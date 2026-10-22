import { relations } from 'drizzle-orm';
import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('Staff'),
  status: text('status').notNull().default('active'),
  department: text('department'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const books = pgTable('books', {
  id: text('id').primaryKey(),
  book_name: text('book_name').notNull(),
  author: text('author').notNull(),
  pages: integer('pages').default(0),
  isbn: text('isbn'),
  published_year: integer('published_year').default(2567),
  price: numeric('price').default('0'),
  cover_image: text('cover_image'),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  category: text('category'),
  description: text('description'),
  is_bestseller: boolean('is_bestseller').default(false),
  sales_count: integer('sales_count').default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  created_by: text('created_by'),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  book_id: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  book_name: text('book_name').notNull(),
  transaction_type: text('transaction_type').notNull(), // 'in', 'increase', 'decrease', 'damage'
  quantity: integer('quantity').notNull().default(0),
  stock_before: integer('stock_before').notNull().default(0),
  stock_after: integer('stock_after').notNull().default(0),
  created_at: text('created_at').notNull(),
  created_by: text('created_by'),
  note: text('note'),
  tracking_number: text('tracking_number'),
  price: numeric('price'),
  total_price: numeric('total_price'),
  customer_name: text('customer_name'),
  sale_channel: text('sale_channel'),
});

export const booksRelations = relations(books, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  book: one(books, {
    fields: [transactions.book_id],
    references: [books.id],
  }),
}));
