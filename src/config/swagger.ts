import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce API',
      version: '1.0.0',
      description: 'Production-ready ecommerce backend API with Express.js, TypeScript, MongoDB, and Cloudinary',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            status: {
              type: 'number',
              example: 400,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'BadRequest',
                },
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            status: {
              type: 'number',
              example: 200,
            },
            data: {
              type: 'object',
            },
            meta: {
              type: 'object',
            },
          },
        },
        RegisterDto: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'password123',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['admin', 'seller', 'customer'],
              default: 'customer',
              example: 'customer',
            },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            status: {
              type: 'number',
              example: 200,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    email: {
                      type: 'string',
                      example: 'user@example.com',
                    },
                    name: {
                      type: 'string',
                      example: 'John Doe',
                    },
                    role: {
                      type: 'string',
                      example: 'customer',
                    },
                    avatarUrl: {
                      type: 'string',
                      nullable: true,
                      example: 'https://example.com/avatar.jpg',
                    },
                  },
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              example: 'customer',
            },
            avatarUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UpdateProfileDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe Updated',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/avatar.jpg',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Wireless Headphones',
            },
            slug: {
              type: 'string',
              example: 'wireless-headphones',
            },
            description: {
              type: 'string',
              example: 'High-quality wireless headphones',
            },
            price: {
              type: 'number',
              example: 19999,
              description: 'Price in cents',
            },
            currency: {
              type: 'string',
              example: 'USD',
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    example: 'https://example.com/image.jpg',
                  },
                  id: {
                    type: 'string',
                    example: 'image-id',
                  },
                },
              },
            },
            stock: {
              type: 'number',
              example: 50,
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['audio', 'wireless'],
            },
            sellerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateProductDto: {
          type: 'object',
          required: ['title', 'description', 'price', 'category'],
          properties: {
            title: {
              type: 'string',
              example: 'Wireless Headphones',
            },
            description: {
              type: 'string',
              example: 'High-quality wireless headphones',
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 19999,
              description: 'Price in cents',
            },
            currency: {
              type: 'string',
              default: 'USD',
              example: 'USD',
            },
            stock: {
              type: 'number',
              minimum: 0,
              default: 0,
              example: 50,
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['audio', 'wireless'],
            },
          },
        },
        UpdateProductDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Updated Product Title',
            },
            description: {
              type: 'string',
              example: 'Updated description',
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 24999,
            },
            currency: {
              type: 'string',
              example: 'USD',
            },
            stock: {
              type: 'number',
              minimum: 0,
              example: 100,
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              example: 1,
            },
            limit: {
              type: 'number',
              example: 20,
            },
            totalItems: {
              type: 'number',
              example: 100,
            },
            totalPages: {
              type: 'number',
              example: 5,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
        CreateOrderDto: {
          type: 'object',
          required: ['shippingAddress', 'paymentMethod'],
          properties: {
            shippingAddress: {
              type: 'object',
              required: ['street', 'city', 'state', 'zipCode', 'country'],
              properties: {
                street: {
                  type: 'string',
                  example: '123 Main St',
                },
                city: {
                  type: 'string',
                  example: 'New York',
                },
                state: {
                  type: 'string',
                  example: 'NY',
                },
                zipCode: {
                  type: 'string',
                  example: '10001',
                },
                country: {
                  type: 'string',
                  example: 'USA',
                },
              },
            },
            paymentMethod: {
              type: 'string',
              example: 'credit_card',
            },
            notes: {
              type: 'string',
              example: 'Please leave at front door',
            },
          },
        },
        UpdateOrderStatusDto: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
              example: 'shipped',
            },
          },
        },
        UpdateShippingInfoDto: {
          type: 'object',
          properties: {
            carrier: {
              type: 'string',
              example: 'UPS',
            },
            trackingNumber: {
              type: 'string',
              example: '1Z999AA10123456784',
            },
            estimatedDelivery: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:00:00Z',
            },
          },
        },
        CreateCouponDto: {
          type: 'object',
          required: ['code', 'discountType', 'discountValue', 'validUntil'],
          properties: {
            code: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              example: 'SAVE20',
            },
            description: {
              type: 'string',
              example: 'Save 20% on all items',
            },
            discountType: {
              type: 'string',
              enum: ['percentage', 'fixed'],
              example: 'percentage',
            },
            discountValue: {
              type: 'number',
              minimum: 0,
              example: 20,
              description: 'Percentage (0-100) or fixed amount in cents',
            },
            minPurchaseAmount: {
              type: 'number',
              minimum: 0,
              example: 5000,
              description: 'Minimum purchase amount in cents',
            },
            maxDiscountAmount: {
              type: 'number',
              minimum: 0,
              example: 5000,
              description: 'Maximum discount amount in cents (for percentage)',
            },
            validFrom: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00Z',
            },
            validUntil: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
            usageLimit: {
              type: 'number',
              minimum: 1,
              example: 100,
              description: 'Total usage limit',
            },
            usageLimitPerUser: {
              type: 'number',
              minimum: 1,
              example: 1,
              description: 'Per-user usage limit',
            },
            applicableTo: {
              type: 'string',
              enum: ['all', 'category', 'product'],
              default: 'all',
              example: 'all',
            },
            applicableCategories: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Electronics', 'Clothing'],
            },
            applicableProducts: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['507f1f77bcf86cd799439011'],
            },
            isActive: {
              type: 'boolean',
              default: true,
              example: true,
            },
          },
        },
        UpdateCouponDto: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
            },
            discountValue: {
              type: 'number',
              minimum: 0,
            },
            minPurchaseAmount: {
              type: 'number',
              minimum: 0,
            },
            maxDiscountAmount: {
              type: 'number',
              minimum: 0,
            },
            validUntil: {
              type: 'string',
              format: 'date-time',
            },
            usageLimit: {
              type: 'number',
              minimum: 1,
            },
            usageLimitPerUser: {
              type: 'number',
              minimum: 1,
            },
            applicableCategories: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            applicableProducts: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.routes.ts', './src/**/*.controller.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

