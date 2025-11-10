import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User } from '../modules/users/user.model';
import { Product } from '../modules/products/product.model';
import logger from '../logger';

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      role: 'admin',
    });
    logger.info(`Created admin user: ${admin.email}`);

    // Create seller user
    const sellerPasswordHash = await bcrypt.hash('seller123', 10);
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: sellerPasswordHash,
      name: 'Seller User',
      role: 'seller',
    });
    logger.info(`Created seller user: ${seller.email}`);

    // Create customer user
    const customerPasswordHash = await bcrypt.hash('customer123', 10);
    const customer = await User.create({
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      name: 'Customer User',
      role: 'customer',
    });
    logger.info(`Created customer user: ${customer.email}`);

    // Create sample products
    const products = [
      {
        title: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 19999, // $199.99 in cents
        currency: 'USD',
        stock: 50,
        category: 'Electronics',
        tags: ['audio', 'wireless', 'headphones'],
        sellerId: seller._id,
      },
      {
        title: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Feature-rich smartwatch with fitness tracking',
        price: 29999, // $299.99 in cents
        currency: 'USD',
        stock: 30,
        category: 'Electronics',
        tags: ['wearable', 'fitness', 'smartwatch'],
        sellerId: seller._id,
      },
      {
        title: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 2499, // $24.99 in cents
        currency: 'USD',
        stock: 100,
        category: 'Clothing',
        tags: ['casual', 'cotton', 'tshirt'],
        sellerId: seller._id,
      },
      {
        title: 'Running Shoes',
        slug: 'running-shoes',
        description: 'Lightweight running shoes for daily training',
        price: 8999, // $89.99 in cents
        currency: 'USD',
        stock: 25,
        category: 'Footwear',
        tags: ['sports', 'running', 'shoes'],
        sellerId: seller._id,
      },
      {
        title: 'Laptop Stand',
        slug: 'laptop-stand',
        description: 'Ergonomic aluminum laptop stand',
        price: 4999, // $49.99 in cents
        currency: 'USD',
        stock: 75,
        category: 'Accessories',
        tags: ['ergonomic', 'laptop', 'stand'],
        sellerId: seller._id,
      },
    ];

    const createdProducts = await Product.insertMany(products);
    logger.info(`Created ${createdProducts.length} products`);

    logger.info('Seeding completed successfully!');
    logger.info('\n=== Test Credentials ===');
    logger.info('Admin: admin@example.com / admin123');
    logger.info('Seller: seller@example.com / seller123');
    logger.info('Customer: customer@example.com / customer123');
    logger.info('========================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();

