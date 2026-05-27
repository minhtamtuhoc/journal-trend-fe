export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};
