# Type Safety Guide - Replacing `any` Types

## Overview
This guide documents the systematic replacement of `any` types with proper TypeScript types throughout the codebase.

## Type Utilities Created

### `src/types/mongoose.types.ts`
Created utility types for Mongoose document transformations:
- `MongooseTransformReturn`: Type for transform function return values
- `MongooseTransformDoc`: Type for transform function document parameter
- `MongooseTransformFn`: Type signature for transform functions

## Pattern for Model Transform Functions

**Before:**
```typescript
transform: (_doc, ret: any) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}
```

**After:**
```typescript
import { MongooseTransformReturn, MongooseTransformFn } from '../../types/mongoose.types';

transform: ((_doc, ret: MongooseTransformReturn) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}) as MongooseTransformFn
```

## Pattern for Service/Controller Functions

**Before:**
```typescript
const transformProduct = (product: any) => ({ ... });
```

**After:**
```typescript
import { IProduct } from './product.model';

const transformProduct = (product: IProduct) => ({ ... });
```

## Completed Modules

- ✅ Auth module - All `any` types replaced
- ✅ Product module - All `any` types replaced  
- ✅ User module - All `any` types replaced
- ✅ Cart model - Transform functions updated

## Remaining Work

All other model files need to be updated to use `MongooseTransformReturn`:
- Orders model
- Coupons model
- Offers model
- Categories model
- Stock model
- Ratings model
- Notifications model
- And other models...

## Best Practices

1. **Always import model interfaces** - Use `IUser`, `IProduct`, etc. instead of `any`
2. **Use MongooseTransformReturn** - For all Mongoose transform functions
3. **Avoid type assertions** - Use proper types instead of `as any`
4. **No eslint-disable comments** - Fix the root cause instead

