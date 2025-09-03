export interface ICategoryResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
  displayName: string;
}

export interface ICategorySummary {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  displayName: string;
}

export interface ICreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface IUpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}
