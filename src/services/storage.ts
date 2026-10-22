import { Book, StockTransaction, User, StockStatus, SummaryStats, TransactionType } from '../types';

const STORAGE_KEYS = {
  BOOKS: 'mcu_press_books_v2',
  TRANSACTIONS: 'mcu_press_transactions_v2',
  USERS: 'mcu_press_users_v2',
  CURRENT_USER: 'mcu_press_active_user_v2',
  SETTINGS: 'mcu_press_settings_v2',
  ADD_BOOK_DRAFT: 'mcu_press_add_book_draft_v2',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'พระมหาคณัย สุมน, ดร.',
    email: 'admin@mcu.ac.th',
    role: 'Admin',
    status: 'active',
    created_at: '2023-01-15T08:30:00Z',
    password: 'admin123',
    department: 'ผู้อำนวยการสำนักพิมพ์',
  },
  {
    id: 'user-2',
    name: 'นายสมชาย เจริญสุข',
    email: 'somchai@mcu.ac.th',
    role: 'Manager',
    status: 'active',
    created_at: '2023-03-20T09:15:00Z',
    password: 'staff123',
    department: 'หัวหน้าฝ่ายคลังและพัสดุสิ่งพิมพ์',
  },
  {
    id: 'user-3',
    name: 'นางสาววราภรณ์ วงศ์สว่าง',
    email: 'waraporn@mcu.ac.th',
    role: 'Staff',
    status: 'active',
    created_at: '2023-06-10T10:00:00Z',
    password: 'staff123',
    department: 'เจ้าหน้าที่ธุรการสิ่งพิมพ์และเผยแพร่',
  },
];

export const INITIAL_BOOKS: Book[] = [];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [];

export function getStockStatus(quantity: number): StockStatus {
  if (quantity > 10) return 'in_stock';
  if (quantity >= 1 && quantity <= 10) return 'low_stock';
  return 'out_of_stock';
}

export function getStockStatusText(quantity: number): string {
  const status = getStockStatus(quantity);
  if (status === 'in_stock') return 'มีสินค้า';
  if (status === 'low_stock') return 'ใกล้หมด';
  return 'หมดสต๊อก';
}

function parseBook(b: any): Book {
  return {
    id: b.id,
    book_name: b.book_name,
    author: b.author,
    pages: Number(b.pages) || 0,
    isbn: b.isbn || '',
    published_year: Number(b.published_year) || 2567,
    price: Number(b.price) || 0,
    cover_image: b.cover_image || '',
    stock_quantity: Number(b.stock_quantity) || 0,
    created_at: b.created_at,
    updated_at: b.updated_at,
    created_by: b.created_by || '',
    category: b.category,
    description: b.description,
    is_bestseller: Boolean(b.is_bestseller),
    sales_count: Number(b.sales_count) || 0,
  };
}

function parseTransaction(t: any): StockTransaction {
  return {
    id: t.id,
    book_id: t.book_id,
    book_name: t.book_name,
    transaction_type: t.transaction_type,
    quantity: Number(t.quantity) || 0,
    stock_before: Number(t.stock_before) || 0,
    stock_after: Number(t.stock_after) || 0,
    created_at: t.created_at,
    created_by: t.created_by || '',
    note: t.note || '',
    tracking_number: t.tracking_number,
    price: t.price ? Number(t.price) : undefined,
    total_price: t.total_price ? Number(t.total_price) : undefined,
    customer_name: t.customer_name,
    sale_channel: t.sale_channel,
  };
}

// Storage helpers with Cloud SQL PostgreSQL Persistence and LocalStorage cache
export const storageService = {
  // Books
  getBooks(): Book[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
        return INITIAL_BOOKS;
      }
      const parsed: any[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(parseBook);
    } catch {
      return [];
    }
  },

  saveBooks(books: Book[]): void {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    window.dispatchEvent(new Event('mcu_books_updated'));
  },

  async clearAllBooks(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    window.dispatchEvent(new Event('mcu_books_updated'));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    try {
      await fetch('/api/reset-defaults', { method: 'POST' });
    } catch (e) {
      console.warn('Network sync notice:', e);
    }
  },

  async addBook(
    bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>,
    creatorName: string
  ): Promise<Book> {
    const books = this.getBooks();
    const newBook: Book = {
      ...bookData,
      id: 'mcu-b' + Date.now().toString(36),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: creatorName,
    };
    books.unshift(newBook);
    this.saveBooks(books);

    // Initial stock transaction if stock > 0
    if (newBook.stock_quantity > 0) {
      this.addTransaction({
        book_id: newBook.id,
        book_name: newBook.book_name,
        transaction_type: 'in',
        quantity: newBook.stock_quantity,
        stock_before: 0,
        stock_after: newBook.stock_quantity,
        created_by: creatorName,
        note: 'บันทึกสต๊อกแรกเริ่มจากการเพิ่มหนังสือใหม่',
      });
    }

    // Persist to Cloud SQL PostgreSQL database
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (res.ok) {
        const remoteCreated = await res.json();
        const updatedList = this.getBooks().map((b) => (b.id === newBook.id ? parseBook(remoteCreated) : b));
        this.saveBooks(updatedList);
      }
    } catch (err) {
      console.warn('Cloud sync error (saved locally):', err);
    }

    return newBook;
  },

  async updateBook(
    id: string,
    updates: Partial<Book>,
    updaterName: string
  ): Promise<Book | null> {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const oldBook = books[index];
    const oldStock = oldBook.stock_quantity;
    const updatedBook: Book = {
      ...oldBook,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    books[index] = updatedBook;
    this.saveBooks(books);

    // If stock changed directly via book edit, record transaction
    if (updates.stock_quantity !== undefined && updates.stock_quantity !== oldStock) {
      const diff = updates.stock_quantity - oldStock;
      this.addTransaction({
        book_id: updatedBook.id,
        book_name: updatedBook.book_name,
        transaction_type: diff > 0 ? 'increase' : 'decrease',
        quantity: Math.abs(diff),
        stock_before: oldStock,
        stock_after: updates.stock_quantity,
        created_by: updaterName,
        note: 'ปรับปรุงจำนวนสต๊อกผ่านการแก้ไขข้อมูลหนังสือ',
      });
    }

    // Persist update to Cloud SQL PostgreSQL
    try {
      await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, updaterName }),
      });
    } catch (err) {
      console.warn('Cloud sync error during update:', err);
    }

    return updatedBook;
  },

  async deleteBook(id: string): Promise<boolean> {
    const books = this.getBooks();
    const filtered = books.filter((b) => b.id !== id);
    if (filtered.length === books.length) return false;
    this.saveBooks(filtered);

    // Also remove associated transactions locally
    const txs = this.getTransactions().filter((t) => t.book_id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    // Persist deletion to Cloud SQL PostgreSQL
    try {
      await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Cloud sync error during book deletion:', err);
    }

    return true;
  },

  // Stock Adjustment (รับเข้า / ปรับเพิ่ม / ขาย / ชำรุด)
  async adjustStock(
    bookId: string,
    type: TransactionType,
    quantity: number,
    operatorName: string,
    note: string
  ): Promise<{ book: Book; transaction: StockTransaction } | null> {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) return null;

    const book = books[index];
    const stockBefore = book.stock_quantity;
    let stockAfter = stockBefore;

    if (type === 'in' || type === 'increase') {
      stockAfter = stockBefore + quantity;
    } else if (type === 'decrease') {
      stockAfter = Math.max(0, stockBefore - quantity);
      book.sales_count = (book.sales_count || 0) + quantity;
    } else if (type === 'damage') {
      stockAfter = Math.max(0, stockBefore - quantity);
    }

    book.stock_quantity = stockAfter;
    book.updated_at = new Date().toISOString();
    books[index] = book;
    this.saveBooks(books);

    const defaultNote =
      type === 'in'
        ? 'รับเข้าสต๊อก'
        : type === 'increase'
        ? 'ปรับเพิ่มสต๊อก'
        : type === 'damage'
        ? 'หนังสือชำรุด / คัดออก'
        : 'จำหน่าย / ขายสต๊อก';

    const transaction = this.addTransaction({
      book_id: book.id,
      book_name: book.book_name,
      transaction_type: type,
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_by: operatorName,
      note: note || defaultNote,
    });

    // Persist to Cloud SQL PostgreSQL
    try {
      await fetch(`/api/books/${bookId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity, operatorName, note }),
      });
    } catch (err) {
      console.warn('Cloud sync error during adjustStock:', err);
    }

    return { book, transaction };
  },

  // Record Postal Book Sale
  async recordPostalSale(params: {
    bookId: string;
    quantity: number;
    price: number;
    trackingNumber: string;
    operatorName: string;
    customerName?: string;
    note?: string;
  }): Promise<{ book: Book; transaction: StockTransaction } | null> {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === params.bookId);
    if (index === -1) return null;

    const book = books[index];
    const stockBefore = book.stock_quantity;
    const qty = Math.max(1, params.quantity);

    if (qty > stockBefore) {
      throw new Error(`สต๊อกคงเหลือไม่พอ (${stockBefore} เล่ม) สำหรับการขายจำนวน ${qty} เล่ม`);
    }

    const stockAfter = Math.max(0, stockBefore - qty);
    book.stock_quantity = stockAfter;
    book.sales_count = (book.sales_count || 0) + qty;
    book.updated_at = new Date().toISOString();
    books[index] = book;
    this.saveBooks(books);

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

    const transaction = this.addTransaction({
      book_id: book.id,
      book_name: book.book_name,
      transaction_type: 'decrease',
      quantity: qty,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_by: params.operatorName,
      note: formattedNote,
      tracking_number: trackingTrimmed,
      price: unitPrice,
      total_price: totalPrice,
      customer_name: customerTrimmed,
      sale_channel: 'postal',
    });

    // Persist to Cloud SQL PostgreSQL
    try {
      await fetch(`/api/books/${params.bookId}/postal-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.warn('Cloud sync error during postal sale:', err);
    }

    return { book, transaction };
  },

  // Transactions
  getTransactions(): StockTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(parseTransaction);
    } catch {
      return [];
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const txs = this.getTransactions().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Cloud delete transaction notice:', e);
    }
  },

  async clearAllTransactions(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    try {
      await fetch('/api/transactions', { method: 'DELETE' });
    } catch (e) {
      console.warn('Cloud clear transactions notice:', e);
    }
  },

  addTransaction(data: Omit<StockTransaction, 'id' | 'created_at'>): StockTransaction {
    const txs = this.getTransactions();
    const newTx: StockTransaction = {
      ...data,
      id: 'tx-' + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    txs.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    // Persist to Cloud SQL PostgreSQL
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx),
    }).catch(() => {});

    return newTx;
  },

  // Users
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      const parsed: User[] = JSON.parse(data);
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    window.dispatchEvent(new Event('mcu_users_updated'));
  },

  addUser(userData: Omit<User, 'id' | 'created_at'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return users[index];
  },

  // Active User session
  getActiveUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setActiveUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Summary statistics calculation
  getSummaryStats(customBooks?: Book[]): SummaryStats {
    const books = customBooks || this.getBooks();
    let totalCopies = 0;
    let totalStockValue = 0;
    let outOfStockTitles = 0;
    let lowStockTitles = 0;
    let inStockTitles = 0;

    books.forEach((b) => {
      const qty = Number(b.stock_quantity) || 0;
      const price = Number(b.price) || 0;
      totalCopies += qty;
      totalStockValue += qty * price;

      if (qty === 0) {
        outOfStockTitles++;
      } else if (qty <= 10) {
        lowStockTitles++;
      } else {
        inStockTitles++;
      }
    });

    return {
      totalTitles: books.length,
      totalCopies,
      totalStockValue,
      outOfStockTitles,
      lowStockTitles,
      inStockTitles,
    };
  },

  // Draft auto-save for Add Book
  getAddBookDraft<T = Record<string, any>>(): T | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADD_BOOK_DRAFT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveAddBookDraft(draft: Record<string, any>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ADD_BOOK_DRAFT, JSON.stringify(draft));
    } catch {
      // LocalStorage quota fail-safe
    }
  },

  clearAddBookDraft(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ADD_BOOK_DRAFT);
    } catch {
      // Fail-safe
    }
  },

  // Reset to default seed
  async resetToDefaults(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    window.dispatchEvent(new Event('mcu_books_updated'));
    window.dispatchEvent(new Event('mcu_transactions_updated'));
    window.dispatchEvent(new Event('mcu_users_updated'));

    try {
      await fetch('/api/reset-defaults', { method: 'POST' });
    } catch (e) {
      console.warn('Network sync notice during reset:', e);
    }
  },
};

/**
 * Real-time bidirectional synchronization with Cloud SQL PostgreSQL backend.
 * Synchronizes books and transactions across all devices and sessions.
 */
export function initializeCloudSync(): () => void {
  let isCancelled = false;

  const syncBooksFromCloud = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok && !isCancelled) {
        const remoteBooks: any[] = await res.json();
        if (Array.isArray(remoteBooks)) {
          const parsed = remoteBooks.map(parseBook);
          localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(parsed));
          window.dispatchEvent(new Event('mcu_books_updated'));
        }
      }
    } catch {
      // Offline / network fallback
    }
  };

  const syncTransactionsFromCloud = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok && !isCancelled) {
        const remoteTxs: any[] = await res.json();
        if (Array.isArray(remoteTxs)) {
          const parsed = remoteTxs.map(parseTransaction);
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed));
          window.dispatchEvent(new Event('mcu_transactions_updated'));
        }
      }
    } catch {
      // Offline / network fallback
    }
  };

  // Immediate fetch
  syncBooksFromCloud();
  syncTransactionsFromCloud();

  // Periodic polling every 5 seconds to sync data created/edited on other devices or tabs
  const timer = setInterval(() => {
    if (!document.hidden && !isCancelled) {
      syncBooksFromCloud();
      syncTransactionsFromCloud();
    }
  }, 5000);

  // Focus event for instant sync when returning to tab
  const onFocus = () => {
    if (!isCancelled) {
      syncBooksFromCloud();
      syncTransactionsFromCloud();
    }
  };

  window.addEventListener('focus', onFocus);

  return () => {
    isCancelled = true;
    clearInterval(timer);
    window.removeEventListener('focus', onFocus);
  };
}

// Backwards-compatible alias for existing imports
export const initializeSupabaseSync = initializeCloudSync;
