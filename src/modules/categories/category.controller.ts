import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { success } from '../../utils/response.util';
import { ICategory } from './category.model';
import { CategoryParent, extractParentSummary, mapCategoryResponse } from './category.types';

export const transformCategory = (category: ICategory) => ({
  id: category._id.toString(),
  name: category.name,
  slug: category.slug,
  description: category.description,
  parentId: extractParentSummary(category.parentId as CategoryParent)?.id ?? undefined,
  image: category.image,
  isActive: category.isActive,
  order: category.order,
  productCount: category.productCount,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateCategoryDto;
      const category = await categoryService.createCategory(data);

      success(res, mapCategoryResponse(category), 201);
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeProductCount = req.query.includeProductCount === 'true';
      const category = await categoryService.getCategoryById(req.params.id, includeProductCount);

      success(res, mapCategoryResponse(category));
    } catch (err) {
      next(err);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeProductCount = req.query.includeProductCount === 'true';
      const category = await categoryService.getCategoryBySlug(
        req.params.slug,
        includeProductCount
      );

      success(res, mapCategoryResponse(category));
    } catch (err) {
      next(err);
    }
  }

  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
        parentId: req.query.parentId ? String(req.query.parentId) : undefined,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        includeProductCount: req.query.includeProductCount === 'true',
      };

      const { categories, meta } = await categoryService.listCategories(query);

      success(
        res,
        categories.map(mapCategoryResponse),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeProductCount = req.query.includeProductCount === 'true';
      const tree = await categoryService.getCategoryTree(includeProductCount);

      success(res, tree, 200);
    } catch (err) {
      next(err);
    }
  }

  async getCategoryWithChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryWithChildren(req.params.id);

      success(res, category);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateCategoryDto;
      const category = await categoryService.updateCategory(req.params.id, data);

      success(res, mapCategoryResponse(category));
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id);

      success(res, { message: 'Category deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
