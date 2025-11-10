# Ecommerce Backend API

Production-ready ecommerce backend built with Express.js, TypeScript, MongoDB, and Cloudinary. Follows Test-Driven Development (TDD) principles with comprehensive test coverage.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control (admin, seller, customer)
- **Product Management**: Full CRUD operations with pagination, filtering, and search
- **User Profiles**: Profile management with avatar uploads
- **Image Uploads**: Cloudinary integration for product images and user avatars
- **Validation**: Runtime validation with Zod schemas
- **Error Handling**: Unified error response format
- **Security**: Helmet, CORS, rate limiting, secure cookies
- **Testing**: Comprehensive test suite with >=90% coverage

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Image Storage**: Cloudinary
- **Testing**: Jest + Supertest
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 18
- pnpm (or npm/yarn)
- MongoDB (local or Docker)
- Cloudinary account (for image uploads)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecom-cursor
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_ACCESS_TOKEN_SECRET=your-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Development

### Start MongoDB with Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Run in Development Mode

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

### Seed Database

```bash
pnpm seed
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- Seller user: `seller@example.com` / `seller123`
- Customer user: `customer@example.com` / `customer123`
- 5 sample products

## Testing

Run all tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

Run tests with coverage:
```bash
pnpm test:ci
```

## Building for Production

```bash
pnpm build
```

The compiled JavaScript will be in the `dist/` directory.

## Docker

### Build and Run with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start MongoDB container
- Build and start the application container
- Expose the API on port 3000

### Stop Containers

```bash
docker-compose down
```

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication support

Visit `http://localhost:3000/api-docs` to explore the API.

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User Profile

- `GET /api/v1/profile` - Get user profile (requires auth)
- `PATCH /api/v1/profile` - Update user profile (requires auth)
- `POST /api/v1/profile/avatar` - Upload avatar (requires auth)

### Products

- `GET /api/v1/products` - List products (with pagination, filters)
  - Query params: `page`, `limit`, `sort`, `q`, `category`, `minPrice`, `maxPrice`
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (requires seller/admin role)
- `PATCH /api/v1/products/:id` - Update product (requires owner or admin)
- `DELETE /api/v1/products/:id` - Delete product (requires owner or admin)
- `POST /api/v1/products/:id/images` - Upload product images (requires owner or admin)

### Cart

- `GET /api/v1/cart` - Get user's cart (requires auth)
- `POST /api/v1/cart` - Add item to cart (requires auth)
- `PATCH /api/v1/cart/:productId` - Update cart item quantity (requires auth)
- `DELETE /api/v1/cart/:productId` - Remove item from cart (requires auth)
- `DELETE /api/v1/cart` - Clear entire cart (requires auth)

### Orders

- `POST /api/v1/orders` - Create order from cart (requires auth, applies coupon if present)
- `GET /api/v1/orders` - List orders (requires auth, admin sees all, users see own)
  - Query params: `page`, `limit`, `status`
- `GET /api/v1/orders/:id` - Get order by ID (requires auth, users can only view own)
- `PATCH /api/v1/orders/:id/status` - Update order status (requires admin role)
- `PATCH /api/v1/orders/:id/shipping` - Update shipping info (requires admin role)
- `GET /api/v1/orders/track/:orderNumber` - Track order by order number (requires auth)

### Coupons & Offers

- `POST /api/v1/coupons` - Create coupon (requires admin role)
- `GET /api/v1/coupons` - List coupons (public, can filter by isActive)
  - Query params: `page`, `limit`, `isActive`
- `GET /api/v1/coupons/:id` - Get coupon by ID (public)
- `GET /api/v1/coupons/code/:code` - Get coupon by code (public)
- `POST /api/v1/coupons/validate` - Validate coupon code (requires auth)
- `PATCH /api/v1/coupons/:id` - Update coupon (requires admin role)
- `DELETE /api/v1/coupons/:id` - Delete coupon (requires admin role)
- `POST /api/v1/cart/coupon` - Apply coupon to cart (requires auth)
- `DELETE /api/v1/cart/coupon` - Remove coupon from cart (requires auth)

### Health Check

- `GET /healthz` - Health check endpoint

## Response Format

### Success Response

```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "meta": { ... } // optional, for pagination
}
```

### Error Response

```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "BadRequest",
    "message": "Error message",
    "details": { ... } // optional
  }
}
```

## Authentication

The API uses JWT tokens for authentication:

1. **Access Token**: Sent in `Authorization` header as `Bearer <token>`
2. **Refresh Token**: Stored in httpOnly cookie

### Example Request

```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer <access-token>"
```

## Roles & Permissions

- **Admin**: Full access to all resources
- **Seller**: Can create/update/delete own products, manage profile
- **Customer**: Can view products, manage own profile

## Project Structure

```
src/
├── config/           # Configuration files
├── db/              # Database connection and seeding
├── modules/          # Feature modules
│   ├── auth/        # Authentication module
│   ├── users/       # User profile module
│   └── products/    # Product module
├── middlewares/     # Express middlewares
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ci` - Run tests with coverage
- `pnpm lint` - Run linter
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Type check TypeScript
- `pnpm seed` - Seed database with sample data

## CI/CD

GitHub Actions workflow runs on push/PR:
- Linting
- Type checking
- Tests with coverage
- Build verification

## Security Considerations

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens have expiration times
- Refresh tokens stored in httpOnly cookies
- Rate limiting (100 requests per 15 minutes)
- Input validation on all routes
- CORS configured
- Helmet for security headers
- No stack traces in production

## License

ISC

## Contributing

1. Follow TDD approach (write tests first)
2. Ensure test coverage >= 90%
3. Follow existing code style
4. Update documentation as needed

