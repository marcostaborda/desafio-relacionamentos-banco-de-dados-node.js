import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsFind = await this.ormRepository.find({
      where: {
        id: In(
          products.map(product => {
            return product.id;
          }),
        ),
      },
    });

    return productsFind;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsFind = await this.ormRepository.find({
      where: {
        id: In(
          products.map(product => {
            return product.id;
          }),
        ),
      },
    });

    const productsUpdate = productsFind.map(product => {
      const productUpdate = products.find(
        productData => productData.id === product.id,
      );

      return { ...productUpdate, quantity: productUpdate?.quantity };
    });

    const productsAlter = await this.ormRepository.save(productsUpdate);

    return productsAlter;
  }
}

export default ProductsRepository;
