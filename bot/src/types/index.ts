export interface Order {
  id: number;
  customer_id: number;
  order_number: string;
  total_price: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  notes: string;
  ordered_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
}

export interface Customer {
  id: number;
  wa_id: string;
  wa_name: string;
  phone: string | null;
  address: string | null;
  total_orders: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface OrderStatus {
  id: number;
  name: string;
  description: string | null;
}
