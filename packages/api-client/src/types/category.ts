export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

export interface CategoriesResponse {
  categories: CategoryDto[];
}
