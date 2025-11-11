import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { success } from '../../utils/response.util';

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateCategoryDto;
      const category = await categoryService.createCategory(data);

      success(
        res,
        {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: category.parentId?.toString(),
          image: category.image,
          isActive: category.isActive,
          order: category.order,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeProductCount = req.query.includeProductCount === 'true';
      const category = await categoryService.getCategoryById(req.params.id, includeProductCount);

      success(res, {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId
          ? {
              id: (category.parentId as any)._id?.toString() || category.parentId.toString(),
              name: (category.parentId as any).name,
              slug: (category.parentId as any).slug,
            }
          : null,
        image: category.image,
        isActive: category.isActive,
        order: category.order,
        productCount: (category as any).productCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeProductCount = req.query.includeProductCount === 'true';
      const category = await categoryService.getCategoryBySlug(req.params.slug, includeProductCount);

      success(res, {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId
          ? {
              id: (category.parentId as any)._id?.toString() || category.parentId.toString(),
              name: (category.parentId as any).name,
              slug: (category.parentId as any).slug,
            }
          : null,
        image: category.image,
        isActive: category.isActive,
        order: category.order,
        productCount: (category as any).productCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
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
        categories.map((category) => ({
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: category.parentId
            ? {
                id: (category.parentId as any)._id?.toString() || category.parentId.toString(),
                name: (category.parentId as any).name,
                slug: (category.parentId as any).slug,
              }
            : null,
          image: category.image,
          isActive: category.isActive,
          order: category.order,
          productCount: (category as any).productCount,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        })),
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

      const formatCategory = (cat: any): any => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parentId
          ? {
              id: cat.parentId._id?.toString() || cat.parentId.toString(),
              name: cat.parentId.name,
              slug: cat.parentId.slug,
            }
          : null,
        image: cat.image,
        isActive: cat.isActive,
        order: cat.order,
        productCount: cat.productCount,
        children: cat.children ? cat.children.map(formatCategory) : [],
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });

      success(res, tree.map(formatCategory), 200);
    } catch (err) {
      next(err);
    }
  }

  async getCategoryWithChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryWithChildren(req.params.id);

      success(res, {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId
          ? {
              id: (category.parentId as any)._id?.toString() || category.parentId.toString(),
              name: (category.parentId as any).name,
              slug: (category.parentId as any).slug,
            }
          : null,
        image: category.image,
        isActive: category.isActive,
        order: category.order,
        children: category.children?.map((child: any) => ({
          id: child._id.toString(),
          name: child.name,
          slug: child.slug,
          description: child.description,
          image: child.image,
          isActive: child.isActive,
          order: child.order,
        })),
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateCategoryDto;
      const category = await categoryService.updateCategory(req.params.id, data);

      success(res, {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId?.toString(),
        image: category.image,
        isActive: category.isActive,
        order: category.order,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id);

      success(res, { message: 'Category deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();


