import type { Types } from 'mongoose';
import type { ICategory } from './category.model';

export type CategoryParent =
  | ICategory
  | Types.ObjectId
  | (Record<string, unknown> & { _id?: Types.ObjectId | string; id?: string })
  | null
  | undefined;

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: { id: string; name?: string; slug?: string } | null;
  image?: string;
  isActive: boolean;
  order: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode extends CategoryResponse {
  children: CategoryTreeNode[];
}

const extractIdFromParent = (parent: CategoryParent): string | null => {
  if (!parent) {
    return null;
  }

  if (typeof parent === 'string') {
    return parent;
  }

  if ('toString' in parent && typeof parent.toString === 'function') {
    return parent.toString();
  }

  if (typeof parent === 'object') {
    const potentialId = parent._id ?? parent.id;
    if (typeof potentialId === 'string') {
      return potentialId;
    }
    if (potentialId && typeof potentialId === 'object' && 'toString' in potentialId) {
      return potentialId.toString();
    }
  }

  return null;
};

export const extractParentSummary = (
  parent: CategoryParent
): { id: string; name?: string; slug?: string } | null => {
  const id = extractIdFromParent(parent);
  if (!id) {
    return null;
  }

  if (parent && typeof parent === 'object') {
    const parentRecord = parent as Record<string, unknown>;
    const name = typeof parentRecord.name === 'string' ? parentRecord.name : undefined;
    const slug = typeof parentRecord.slug === 'string' ? parentRecord.slug : undefined;
    return { id, name, slug };
  }

  return { id };
};

export const mapCategoryResponse = (category: ICategory): CategoryResponse => ({
  id: category._id.toString(),
  name: category.name,
  slug: category.slug,
  description: category.description,
  parentId: extractParentSummary(category.parentId as CategoryParent),
  image: category.image,
  isActive: category.isActive,
  order: category.order,
  productCount: category.productCount,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});
