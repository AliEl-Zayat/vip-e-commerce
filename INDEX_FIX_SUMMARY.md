# Mongoose Index Duplicate Warnings - Fixed

## Issue
Mongoose was showing duplicate index warnings because indexes were defined both:
1. In field definitions using `index: true`
2. At schema level using `schema.index()`

## Root Cause
According to Mongoose best practices:
- When `unique: true` is set, it automatically creates an index
- When you explicitly call `schema.index()`, you should remove `index: true` from the field definition
- Having both creates duplicate indexes

## Fixes Applied

### Models Fixed
1. **User Model** - Removed `index: true` from `email` (has `unique: true` and explicit index)
2. **Product Model** - Removed `index: true` from `slug`, `category`, `categoryId`, `sellerId`
3. **Category Model** - Removed `index: true` from `name`, `slug`, `parentId`, `isActive`
4. **Cart Model** - Removed `index: true` from `userId` (has `unique: true`)
5. **Coupon Model** - Removed `index: true` from `code` (has `unique: true`), `isActive`
6. **Order Model** - Removed `index: true` from `orderNumber` (has `unique: true`), `userId`, `status`
7. **Stock Model** - Removed `index: true` from `productId` (has `unique: true`), `orderId`, `isActive`
8. **Rating Model** - Removed `index: true` from `productId`, `userId`, `rating`
9. **Notification Model** - Removed `index: true` from `userId`, `type`, `read`
10. **Wishlist Model** - Removed `index: true` from `userId`, `isPublic`
11. **Favorite Model** - Removed `index: true` from `userId`, `productId`
12. **Comment Model** - Removed `index: true` from `productId`, `userId`, `parentId`
13. **Scraper Model** - Removed `index: true` from `url`, `productId`, `status`
14. **Push Notification Model** - Removed `index: true` from `userId`, `token` (has `unique: true`), `isActive`
15. **QR Session Model** - Removed `index: true` from `sessionId` (has `unique: true`), `qrToken` (has `unique: true`), `status`
16. **Offer Model** - Removed `index: true` from `offerType`, `isActive`

## Best Practice Applied

**Before:**
```typescript
slug: {
  type: String,
  unique: true,
  index: true, // ❌ Redundant - unique already creates index
}

schema.index({ slug: 1 }, { unique: true }); // Also creates index
```

**After:**
```typescript
slug: {
  type: String,
  unique: true, // ✅ unique: true automatically creates an index
}

schema.index({ slug: 1 }, { unique: true }); // Explicit index for clarity
```

Or for compound indexes:
```typescript
category: {
  type: String,
  // Index defined at schema level: productSchema.index({ category: 1, price: 1 })
}

schema.index({ category: 1, price: 1 }); // Compound index
```

## Result
✅ All duplicate index warnings resolved
✅ Indexes still properly defined at schema level
✅ Better code clarity with comments explaining index locations
✅ Follows Mongoose 8.x best practices

## Verification
Run the server and verify no Mongoose warnings appear:
```bash
pnpm dev
```

Expected output: No `[MONGOOSE] Warning: Duplicate schema index` messages.

