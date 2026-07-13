import { Category } from "./category.types";

export interface ServiceType{
    category: Pick<Category, 'id' | 'name' | 'slug' | 'icon' >;
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    image: string;
    status: string;
    displayOrder: number;
    companiesCount: number;
    createdAt: string; 
    updatedAt: string
}


export interface ServiceTypeResponse {
  success: boolean;
  booking: ServiceType;
}