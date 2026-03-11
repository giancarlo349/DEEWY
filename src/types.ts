export interface PhotoEvent {
  id: string;
  name: string;
  code: string;
  photoUrls: string[];
  customText: string;
  createdAt: number;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  ownerId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  photoUrls: string[];
}

export interface PortfolioData {
  categories: {
    negocios: string[];
    impacto: string[];
    cotidiano: string[];
  };
}
