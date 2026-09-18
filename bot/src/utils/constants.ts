export const PREFIX = '/';
export const BOT_NAME = 'OrderBot';

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;

export const CATEGORIES = ['electronics', 'clothing', 'food', 'books', 'other'] as const;

export const COMMANDS = {
  MENU: 'MENU',
  PRODUCTS: 'PRODUCTS',
  ORDER: 'ORDER',
  ORDER_STATUS: 'ORDER_STATUS',
  MY_ORDERS: 'MY_ORDERS',
  CANCEL: 'CANCEL',
  CUSTOMER: 'CUSTOMER',
  HELP: 'HELP',
  ADMIN: 'ADMIN',
} as const;

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
