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
  driveLink?: string;
  showSocialTips?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  title: string;
  photoUrls: string[];
}

export interface PortfolioData {
  heroTitle?: string;
  heroSubtitle?: string;
  philosophyTitle?: string;
  philosophyText?: string;
  urls: string[];
  categories?: {
    negocios: {
      name: string;
      title: string;
      urls: string[];
    };
    impacto: {
      name: string;
      title: string;
      urls: string[];
    };
    cotidiano: {
      name: string;
      title: string;
      urls: string[];
    };
  };
}
