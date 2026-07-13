
import { Company } from "./company.types";
import { ServiceType } from "./serviceType.types";


export interface Service {
  id: string;
  companyId: string;
  serviceTypeId: string;
  image: string
  name: string;
  description: string;
  basePrice: number;
  durationMin: number;
  durationMax: number;
  isActive: boolean;
  features: string[];
  platformFee: number;


  company: Pick<Company, 'id' | 'name' | 'city' | 'verificationStatus'>

  serviceType: Pick<ServiceType, 'id' | 'name' | 'slug' > & {
    category: {
      id: string;
      name: string;
      slug: string;
    }
  }
  createdAt: string;
  updatedAt: string;

}