import {MongoClient, Db, Collection} from 'mongodb';
import {Product, ProductCategory} from '../types';
import {v4 as uuidv4} from 'uuid';

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'visioneer';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(mongoUrl);
    await client.connect();
  }
  return client;
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db(dbName);
  }
  return db;
}

export async function getProductsCollection(): Promise<Collection<Product>> {
  const database = await getDatabase();
  return database.collection<Product>('products');
}

export async function getProducts(params?: {
  category?: ProductCategory;
  styleTags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const collection = await getProductsCollection();
  const query: any = {};

  if (params?.category) {
    query.category = params.category;
  }

  if (params?.styleTags && params.styleTags.length > 0) {
    query.styleTags = {$in: params.styleTags};
  }

  if (params?.search) {
    query.$or = [
      {name: {$regex: params.search, $options: 'i'}},
      {description: {$regex: params.search, $options: 'i'}},
    ];
  }

  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  const products = await collection
    .find(query)
    .sort({createdAt: -1})
    .limit(limit)
    .skip(offset)
    .toArray();

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const collection = await getProductsCollection();
  const product = await collection.findOne({id});
  return product;
}

export async function initSampleData() {
  const collection = await getProductsCollection();
  const count = await collection.countDocuments();

  if (count === 0) {
    const sampleProducts: Product[] = [
      {
        id: uuidv4(),
        name: 'Modern Sofa',
        price: 899.99,
        category: 'furniture',
        styleTags: ['modern', 'minimal'],
        dimensions: {length: 84, width: 36, height: 34, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Modern+Sofa'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Furniture Store', url: 'https://example.com', price: 899.99}],
        description: 'A comfortable modern sofa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Rustic Coffee Table',
        price: 299.99,
        category: 'furniture',
        styleTags: ['rustic', 'wood'],
        dimensions: {length: 48, width: 24, height: 18, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Coffee+Table'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Furniture Store', url: 'https://example.com', price: 299.99}],
        description: 'Beautiful rustic coffee table',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Ceramic Floor Tiles',
        price: 4.99,
        category: 'tiles',
        styleTags: ['modern', 'ceramic'],
        dimensions: {length: 12, width: 12, height: 0.5, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Ceramic+Tiles'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Tile Store', url: 'https://example.com', price: 4.99}],
        description: 'High-quality ceramic floor tiles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Minimalist Chair',
        price: 199.99,
        category: 'furniture',
        styleTags: ['minimal', 'modern'],
        dimensions: {length: 24, width: 24, height: 32, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Minimalist+Chair'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Furniture Store', url: 'https://example.com', price: 199.99}],
        description: 'Elegant minimalist chair',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Wooden Bookshelf',
        price: 449.99,
        category: 'furniture',
        styleTags: ['rustic', 'wood', 'traditional'],
        dimensions: {length: 36, width: 12, height: 72, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Bookshelf'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Furniture Store', url: 'https://example.com', price: 449.99}],
        description: 'Classic wooden bookshelf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Marble Tiles',
        price: 12.99,
        category: 'tiles',
        styleTags: ['luxury', 'marble'],
        dimensions: {length: 24, width: 24, height: 0.75, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Marble+Tiles'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Tile Store', url: 'https://example.com', price: 12.99}],
        description: 'Premium marble floor tiles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Decorative Vase',
        price: 49.99,
        category: 'decor',
        styleTags: ['modern', 'ceramic'],
        dimensions: {length: 8, width: 8, height: 16, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Decorative+Vase'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Decor Store', url: 'https://example.com', price: 49.99}],
        description: 'Stylish decorative vase',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Wall Art Print',
        price: 79.99,
        category: 'decor',
        styleTags: ['modern', 'minimal'],
        dimensions: {length: 24, width: 18, height: 1, unit: 'in'},
        images: ['https://via.placeholder.com/400x300?text=Wall+Art'],
        model3DUrl: '',
        storeLinks: [{storeName: 'Decor Store', url: 'https://example.com', price: 79.99}],
        description: 'Modern wall art print',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await collection.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} sample products`);
  }
}
