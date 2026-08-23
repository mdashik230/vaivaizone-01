export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subCategory?: string;
  isNew?: boolean;
  discount?: string;
  isSoldByWeight?: boolean;
  unit?: string;
  description?: string;
  specifications?: string;
  gallery?: string[];
  colors?: string[];
  sizes?: string[];
  stock?: number;
}

export interface Subcategory {
  id: string;
  name: string;
  image: string;
  status?: 'active' | 'hidden' | 'pending' | 'upcoming';
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
  status?: 'active' | 'hidden' | 'pending' | 'upcoming';
  subcategories?: Subcategory[];
}

export interface Slider {
  id: string;
  image: string;
  title: string;
  link?: string;
  status?: 'active' | 'hidden';
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  link?: string;
  status: 'active' | 'hidden';
}

export interface SteadfastSettings {
  apiKey: string;
  secretKey: string;
  isEnabled: boolean;
  autoBooking: boolean;
  defaultNote?: string;
}

export interface SteadfastOrderParams {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastConsignment {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  created_at?: string;
}

export interface SteadfastOrderResponse {
  status: number;
  message?: string;
  consignment?: SteadfastConsignment;
  errors?: Record<string, string[]>;
}
