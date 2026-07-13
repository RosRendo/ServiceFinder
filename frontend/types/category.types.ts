export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl?: string | null;
  status: "active" | "inactive";
  displayOrder: number;
  serviceTypesCount?: number; // optional if not always present
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
};

export type CategoryResponse = {
  success: boolean;
  data: Category[];
};
