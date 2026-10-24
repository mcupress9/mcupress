import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  adjustStock,
  postalSale,
} from './src/db/books.ts';
import {
  getAllTransactions,
  createTransaction,
  deleteTransaction,
  clearAllTransactions,
  resetDatabase,
} from './src/db/transactions.ts';
import { getOrCreateUser, getUsers } from './src/db/users.ts';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Clean start with empty database (ready for real user data)

// --- API Endpoints ---

// 1. Health & Server Info
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Books API
app.get('/api/books', optionalAuth, async (_req, res) => {
  try {
    const data = await getAllBooks();
    res.json(data);
  } catch (error: any) {
    console.error('API Error in GET /api/books:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch books' });
  }
});

app.get('/api/books/:id', optionalAuth, async (req, res) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error: any) {
    console.error('API Error in GET /api/books/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch book' });
  }
});

app.post('/api/books', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body;

    if (!body.book_name || !body.book_name.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อหนังสือ (จำเป็น)' });
    }
    if (!body.author || !body.author.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้แต่ง (จำเป็น)' });
    }

    const defaultCover =
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

    const newBook = {
      id: body.id || 'mcu-b' + Date.now().toString(36),
      book_name: body.book_name.trim(),
      author: body.author.trim(),
      pages: Number(body.pages) || 0,
      isbn: (body.isbn || '').trim(),
      published_year: Number(body.published_year) || 2567,
      price: (body.price ?? '0').toString(),
      cover_image: (body.cover_image && body.cover_image.trim()) ? body.cover_image.trim() : defaultCover,
      stock_quantity: Number(body.stock_quantity) || 0,
      category: body.category || 'พระไตรปิฎกและคัมภีร์ศึกษา',
      description: (body.description || '').trim(),
      is_bestseller: Boolean(body.is_bestseller),
      sales_count: Number(body.sales_count) || 0,
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: body.created_by || req.user?.email || 'เจ้าหน้าที่สำนักพิมพ์',
    };

    const created = await createBook(newBook);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('API Error in POST /api/books:', error);
    res.status(500).json({ error: error.message || 'Failed to create book' });
  }
});

app.put('/api/books/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const updates = { ...req.body };
    if (updates.pages !== undefined) updates.pages = Number(updates.pages);
    if (updates.published_year !== undefined) updates.published_year = Number(updates.published_year);
    if (updates.stock_quantity !== undefined) updates.stock_quantity = Number(updates.stock_quantity);
    if (updates.price !== undefined) updates.price = updates.price.toString();
    if (updates.sales_count !== undefined) updates.sales_count = Number(updates.sales_count);
    if (updates.is_bestseller !== undefined) updates.is_bestseller = Boolean(updates.is_bestseller);

    const updaterName = req.body.updaterName || req.user?.email || 'เจ้าหน้าที่';
    const updated = await updateBook(req.params.id, updates, updaterName);
    if (!updated) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('API Error in PUT /api/books/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to update book' });
  }
});

app.delete('/api/books/:id', optionalAuth, async (req, res) => {
  try {
    const success = await deleteBook(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Book not found or already deleted' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    console.error('API Error in DELETE /api/books/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to delete book' });
  }
});

// 3. Stock Adjustment (รับเข้า / ปรับเพิ่ม / ขาย / ชำรุด)
app.post('/api/books/:id/adjust-stock', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { type, quantity, operatorName, note } = req.body;
    const result = await adjustStock({
      bookId: req.params.id,
      type: type || 'in',
      quantity: Number(quantity) || 1,
      operatorName: operatorName || req.user?.email || 'เจ้าหน้าที่',
      note,
    });
    res.json(result);
  } catch (error: any) {
    console.error('API Error in POST /api/books/:id/adjust-stock:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust stock' });
  }
});

// 4. Postal Sale
app.post('/api/books/:id/postal-sale', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { quantity, price, trackingNumber, operatorName, customerName, note } = req.body;
    const result = await postalSale({
      bookId: req.params.id,
      quantity: Number(quantity) || 1,
      price: Number(price) || 0,
      trackingNumber: trackingNumber || '',
      operatorName: operatorName || req.user?.email || 'เจ้าหน้าที่',
      customerName,
      note,
    });
    res.json(result);
  } catch (error: any) {
    console.error('API Error in POST /api/books/:id/postal-sale:', error);
    res.status(500).json({ error: error.message || 'Failed to record postal sale' });
  }
});

// 5. Transactions API
app.get('/api/transactions', optionalAuth, async (_req, res) => {
  try {
    const txs = await getAllTransactions();
    res.json(txs);
  } catch (error: any) {
    console.error('API Error in GET /api/transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const newTx = {
      id: body.id || 'tx-' + Date.now().toString(36),
      book_id: body.book_id,
      book_name: body.book_name,
      transaction_type: body.transaction_type,
      quantity: Number(body.quantity) || 0,
      stock_before: Number(body.stock_before) || 0,
      stock_after: Number(body.stock_after) || 0,
      created_at: body.created_at || new Date().toISOString(),
      created_by: body.created_by || req.user?.email || 'เจ้าหน้าที่',
      note: body.note || '',
      tracking_number: body.tracking_number,
      price: body.price ? body.price.toString() : null,
      total_price: body.total_price ? body.total_price.toString() : null,
      customer_name: body.customer_name,
      sale_channel: body.sale_channel,
    };
    const created = await createTransaction(newTx);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('API Error in POST /api/transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to create transaction' });
  }
});

app.delete('/api/transactions/:id', optionalAuth, async (req, res) => {
  try {
    const success = await deleteTransaction(req.params.id);
    res.json({ success });
  } catch (error: any) {
    console.error('API Error in DELETE /api/transactions/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to delete transaction' });
  }
});

app.delete('/api/transactions', optionalAuth, async (_req, res) => {
  try {
    await clearAllTransactions();
    res.json({ success: true });
  } catch (error: any) {
    console.error('API Error in DELETE /api/transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to clear transactions' });
  }
});

// 6. Reset Database to Default Seeds
app.post('/api/reset-defaults', optionalAuth, async (_req, res) => {
  try {
    await resetDatabase([]);
    res.json({ success: true, message: 'Database reset to empty clean state successfully.' });
  } catch (error: any) {
    console.error('API Error in POST /api/reset-defaults:', error);
    res.status(500).json({ error: error.message || 'Failed to reset database' });
  }
});

// 7. Users API
app.get('/api/users', optionalAuth, async (_req, res) => {
  try {
    const list = await getUsers();
    res.json(list);
  } catch (error: any) {
    console.error('API Error in GET /api/users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

app.post('/api/users/sync', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email, name, role, department } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }
    const user = await getOrCreateUser(uid, email, name, role, department);
    res.json(user);
  } catch (error: any) {
    console.error('API Error in POST /api/users/sync:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// --- Frontend Integration (Vite Middleware in Dev / Static in Prod) ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MCU Press Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
