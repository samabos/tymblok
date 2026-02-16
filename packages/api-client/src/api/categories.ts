import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoriesResponse,
} from '../types/category';
import type { ApiResponse } from '../types/common';
import type { ApiClient } from './blocks';

export const createCategoriesApi = (api: ApiClient) => ({
  async list(): Promise<CategoryDto[]> {
    const response = await api.get<ApiResponse<CategoriesResponse>>('/categories');
    return response.data.categories;
  },

  async getById(id: string): Promise<CategoryDto> {
    const response = await api.get<ApiResponse<CategoryDto>>(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryRequest): Promise<CategoryDto> {
    const response = await api.post<ApiResponse<CategoryDto>>('/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryRequest): Promise<CategoryDto> {
    const response = await api.patch<ApiResponse<CategoryDto>>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
});

export type CategoriesApi = ReturnType<typeof createCategoriesApi>;
