import { db } from './index.ts';
import { books, transactions } from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { withDbRetry } from './retry.ts';

export async function getAllTransactions() {
  try {
    return await withDbRetry(() => db.select().from(transactions).orderBy(desc(transactions.created_at)));
  } catch (error) {
    console.error('Database query failed in getAllTransactions:', error);
    throw new Error('Database query failed while fetching transactions.', { cause: error });
  }
}

export async function createTransaction(tx: typeof transactions.$inferInsert) {
  try {
    return await withDbRetry(async () => {
      const result = await db.insert(transactions).values(tx).returning();
      return result[0];
    });
  } catch (error) {
    console.error('Database query failed in createTransaction:', error);
    throw new Error('Database query failed while creating transaction.', { cause: error });
  }
}

export async function deleteTransaction(id: string) {
  try {
    return await withDbRetry(async () => {
      const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
      return result.length > 0;
    });
  } catch (error) {
    console.error('Database query failed in deleteTransaction:', error);
    throw new Error('Database query failed while deleting transaction.', { cause: error });
  }
}

export async function clearAllTransactions() {
  try {
    return await withDbRetry(async () => {
      await db.delete(transactions);
      return true;
    });
  } catch (error) {
    console.error('Database query failed in clearAllTransactions:', error);
    throw new Error('Database operation failed while clearing transactions.', { cause: error });
  }
}

export async function resetDatabase(initialBooks: any[]) {
  try {
    return await withDbRetry(async () => {
      await db.delete(transactions);
      await db.delete(books);

      for (const item of initialBooks) {
        await db.insert(books).values({
          id: item.id,
          book_name: item.book_name,
          author: item.author,
          pages: item.pages || 0,
          isbn: item.isbn || '',
          published_year: item.published_year || 2567,
          price: item.price ? item.price.toString() : '0',
          cover_image: item.cover_image || '',
          stock_quantity: item.stock_quantity || 0,
          category: item.category || '',
          description: item.description || '',
          is_bestseller: Boolean(item.is_bestseller),
          sales_count: item.sales_count || 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          created_by: item.created_by || 'พระมหาคณัย สุมน, ดร.',
        });
      }

      return true;
    });
  } catch (error) {
    console.error('Database query failed in resetDatabase:', error);
    throw new Error('Database operation failed while resetting database.', { cause: error });
  }
}
