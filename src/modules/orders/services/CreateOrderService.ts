import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';

import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const productsData = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );

    if (!productsData.length) {
      throw new AppError('Could not find any products with the given ids');
    }

    const productsSerialized = products.map(productRequest => {
      const productFind = productsData.find(
        product => product.id === productRequest.id,
      );
      if (!productFind) {
        throw new AppError(`
        Could not find product with ${productRequest.id}`);
      }
      if (
        productFind.quantity === 0 ||
        productFind.quantity <= productRequest.quantity
      ) {
        throw new AppError(`
        The quantity ${productRequest.quantity}
        is not available for ${productRequest.id}`);
      }
      return {
        product_id: productRequest.id,
        price: productFind.price,
        quantity: productRequest.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsSerialized,
    });

    const { order_products } = order;

    const productsUpdateQuantity = order_products.map(order_product => ({
      id: order_product.product_id,
      quantity:
        (productsData.find(product => product.id === order_product.product_id)
          ?.quantity ?? 0) - order_product.quantity,
    }));

    await this.productsRepository.updateQuantity(productsUpdateQuantity);

    return order;
  }
}

export default CreateOrderService;
