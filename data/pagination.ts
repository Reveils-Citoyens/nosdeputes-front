/**
 * Pagination metadata extracted from API response headers
 */
export type PaginationMetadata = {
  total: number;
  totalPage: number;
  perPage: number;
  currentPage: number;
};

/**
 * Paginated response structure returned by search functions
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMetadata;
};

/**
 * Extracts pagination metadata from a fetch Response object
 * @param response - The fetch Response object
 * @param currentPage - The current page number (from request params)
 * @returns PaginationMetadata object
 */
export function extractPaginationMetadata(
  response: Response,
  currentPage: number
): PaginationMetadata {
  const total = parseInt(response.headers.get("total") || "0", 10);
  const totalPage = parseInt(response.headers.get("total-page") || "0", 10);
  const perPage = parseInt(response.headers.get("per-page") || "0", 10);

  return {
    total,
    totalPage,
    perPage,
    currentPage,
  };
}
