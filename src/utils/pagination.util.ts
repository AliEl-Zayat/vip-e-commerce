export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = (
  query: PaginationQuery,
  options: PaginationOptions = {}
): { page: number; limit: number; skip: number } => {
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;

  const page = Math.max(1, parseInt(String(query.page || 1), 10));
  let limit = parseInt(String(query.limit || defaultLimit), 10);
  limit = Math.min(Math.max(1, limit), maxLimit);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

