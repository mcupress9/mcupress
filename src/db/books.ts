import { db } from './index.ts';
import { books, transactions } from './schema.ts';
import { desc, eq } from 'drizzle-orm';

export async function getAllBooks() {
  try {
    return await db.select().from(books).orderBy(desc(books.created_at));
  } catch (error) {
    console.error('Database query failed in getAllBooks:', error);
    throw new Error('Database query failed while fetching books.', { cause: error });
  }
}

export async function getBookById(id: string) {
  try {
    const result = await db.select().from(books).where(eq(books.id, id));
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in getBookById:', error);
    throw new Error('Database query failed while fetching book details.', { cause: error });
  }
}

export async function createBook(newBook: typeof books.$inferInsert) {
  try {
    const result = await db.insert(books).values(newBook).returning();
    const created = result[0];

    // If initial stock > 0, also create initial transaction
    if (created && created.stock_quantity > 0) {
      await db.insert(transactions).values({
        id: 'tx-' + Date.now().toString(36),
        book_id: created.id,
        book_name: created.book_name,
        transaction_type: 'in',
        quantity: created.stock_quantity,
        stock_before: 0,
        stock_after: created.stock_quantity,
        created_at: new Date().toISOString(),
        created_by: created.created_by || 'ผู้ดูแลระบบ',
        note: 'บันทึกสต๊อกแรกเริ่มจากการเพิ่มหนังสือใหม่',
      });
    }

    return created;
  } catch (error) {
    console.error('Database query failed in createBook:', error);
    throw new Error('Database query failed while creating book.', { cause: error });
  }
}

export async function updateBook(id: string, updates: Partial<typeof books.$inferInsert>, updaterName?: string) {
  try {
    const currentList = await db.select().from(books).where(eq(books.id, id));
    if (!currentList.length) return null;

    const oldBook = currentList[0];
    const oldStock = oldBook.stock_quantity;

    const result = await db
      .update(books)
      .set({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .where(eq(books.id, id))
      .returning();

    const updated = result[0];

    // If stock changed directly via book edit, record adjustment transaction
    if (updates.stock_quantity !== undefined && updates.stock_quantity !== oldStock) {
      const diff = updates.stock_quantity - oldStock;
      await db.insert(transactions).values({
        id: 'tx-' + Date.now().toString(36),
        book_id: updated.id,
        book_name: updated.book_name,
        transaction_type: diff > 0 ? 'increase' : 'decrease',
        quantity: Math.abs(diff),
        stock_before: oldStock,
        stock_after: updates.stock_quantity,
        created_at: new Date().toISOString(),
        created_by: updaterName || 'ผู้ดูแลระบบ',
        note: 'ปรับปรุงจำนวนสต๊อกผ่านการแก้ไขข้อมูลหนังสือ',
      });
    }

    return updated;
  } catch (error) {
    console.error('Database query failed in updateBook:', error);
    throw new Error('Database query failed while updating book.', { cause: error });
  }
}

export async function deleteBook(id: string) {
  try {
    // Cascade delete transactions first or let foreign key handle it
    await db.delete(transactions).where(eq(transactions.book_id, id));
    const result = await db.delete(books).where(eq(books.id, id)).returning();
    return result.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteBook:', error);
    throw new Error('Database query failed while deleting book.', { cause: error });
  }
}

export async function adjustStock(params: {
  bookId: string;
  type: 'in' | 'increase' | 'decrease' | 'damage';
  quantity: number;
  operatorName: string;
  note?: string;
}) {
  try {
    const existing = await db.select().from(books).where(eq(books.id, params.bookId));
    if (!existing.length) {
      throw new Error('ไม่พบหนังสือที่ระบุในระบบ');
    }

    const book = existing[0];
    const stockBefore = book.stock_quantity;
    let stockAfter = stockBefore;
    let salesCount = book.sales_count || 0;

    if (params.type === 'in' || params.type === 'increase') {
      stockAfter = stockBefore + params.quantity;
    } else if (params.type === 'decrease') {
      stockAfter = Math.max(0, stockBefore - params.quantity);
      salesCount += params.quantity;
    } else if (params.type === 'damage') {
      stockAfter = Math.max(0, stockBefore - params.quantity);
    }

    const updatedBooks = await db
      .update(books)
      .set({
        stock_quantity: stockAfter,
        sales_count: salesCount,
        updated_at: new Date().toISOString(),
      })
      .where(eq(books.id, params.bookId))
      .returning();

    const defaultNote =
      params.type === 'in'
        ? 'รับเข้าสต๊อก'
        : params.type === 'increase'
        ? 'ปรับเพิ่มสต๊อก'
        : params.type === 'damage'
        ? 'หนังสือชำรุด / คัดออก'
        : 'จำหน่าย / ขายสต๊อก';

    const newTx = {
      id: 'tx-' + Date.now().toString(36),
      book_id: book.id,
      book_name: book.book_name,
      transaction_type: params.type,
      quantity: params.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_at: new Date().toISOString(),
      created_by: params.operatorName || 'เจ้าหน้าที่',
      note: params.note || defaultNote,
    };

    const insertedTx = await db.insert(transactions).values(newTx).returning();

    return {
      book: updatedBooks[0],
      transaction: insertedTx[0],
    };
  } catch (error) {
    console.error('Database query failed in adjustStock:', error);
    throw new Error('Database operation failed while adjusting stock.', { cause: error });
  }
}

export async function postalSale(params: {
  bookId: string;
  quantity: number;
  price: number;
  trackingNumber: string;
  operatorName: string;
  customerName?: string;
  note?: string;
}) {
  try {
    const existing = await db.select().from(books).where(eq(books.id, params.bookId));
    if (!existing.length) {
      throw new Error('ไม่พบหนังสือที่ระบุในระบบ');
    }

    const book = existing[0];
    const stockBefore = book.stock_quantity;
    const qty = Math.max(1, params.quantity);

    if (qty > stockBefore) {
      throw new Error(`สต๊อกคงเหลือไม่พอ (${stockBefore} เล่ม) สำหรับการขายจำนวน ${qty} เล่ม`);
    }

    const stockAfter = Math.max(0, stockBefore - qty);
    const newSalesCount = (book.sales_count || 0) + qty;

    const updatedBooks = await db
      .update(books)
      .set({
        stock_quantity: stockAfter,
        sales_count: newSalesCount,
        updated_at: new Date().toISOString(),
      })
      .where(eq(books.id, params.bookId))
      .returning();

    const trackingTrimmed = params.trackingNumber.trim();
    const customerTrimmed = params.customerName?.trim() || '';
    const noteTrimmed = params.note?.trim() || '';
    const unitPrice = Number(params.price) || 0;
    const totalPrice = unitPrice * qty;

    const formattedNote = [
      `📮 ส่งไปรษณีย์ เลขพัสดุ: ${trackingTrimmed}`,
      `ราคา ฿${unitPrice.toLocaleString('th-TH')} × ${qty} เล่ม = ฿${totalPrice.toLocaleString('th-TH')}`,
      customerTrimmed ? `ผู้รับ: ${customerTrimmed}` : '',
      noteTrimmed,
    ]
      .filter(Boolean)
      .join(' · ');

    const newTx = {
      id: 'tx-' + Date.now().toString(36),
      book_id: book.id,
      book_name: book.book_name,
      transaction_type: 'decrease',
      quantity: qty,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_at: new Date().toISOString(),
      created_by: params.operatorName || 'เจ้าหน้าที่',
      note: formattedNote,
      tracking_number: trackingTrimmed,
      price: unitPrice.toString(),
      total_price: totalPrice.toString(),
      customer_name: customerTrimmed,
      sale_channel: 'postal',
    };

    const insertedTx = await db.insert(transactions).values(newTx).returning();

    return {
      book: updatedBooks[0],
      transaction: insertedTx[0],
    };
  } catch (error) {
    console.error('Database query failed in postalSale:', error);
    throw new Error('Database operation failed while recording postal sale.', { cause: error });
  }
}

export async function seedBooksIfEmpty(initialBooks: any[]) {
  try {
    const existing = await db.select().from(books).limit(1);
    if (existing.length === 0 && initialBooks && initialBooks.length > 0) {
      console.log('Seeding initial books to Cloud SQL PostgreSQL database...');
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
        }).onConflictDoNothing();
      }
    }
  } catch (error) {
    console.warn('Initial books seeding error (non-fatal):', error);
  }
}
