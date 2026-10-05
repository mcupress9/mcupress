export type Role = 'Admin' | 'Manager' | 'Staff';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  password?: string;
  department?: string;
  avatar?: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Book {
  id: string;
  book_name: string;
  author: string;
  pages: number;
  isbn: string;
  published_year: number; // e.g. 2567 or 2024
  price: number;
  cover_image: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  description?: string;
  category?: string;
  is_bestseller?: boolean;
  sales_count?: number;
}

export type TransactionType = 'in' | 'increase' | 'decrease';

export interface StockTransaction {
  id: string;
  book_id: string;
  book_name: string;
  transaction_type: TransactionType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  created_at: string;
  created_by: string;
  note: string;
}

export interface SummaryStats {
  totalTitles: number;
  totalCopies: number;
  totalStockValue: number;
  outOfStockTitles: number;
  lowStockTitles: number;
  inStockTitles: number;
}
