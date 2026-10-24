import { Book, StockTransaction, User, StockStatus, SummaryStats, TransactionType } from '../types';

const STORAGE_KEYS = {
  BOOKS: 'mcu_press_books_v2',
  TRANSACTIONS: 'mcu_press_transactions_v2',
  USERS: 'mcu_press_users_v2',
  CURRENT_USER: 'mcu_press_active_user_v2',
  SETTINGS: 'mcu_press_settings_v2',
  ADD_BOOK_DRAFT: 'mcu_press_add_book_draft_v2',
};

// Cross-tab and cross-window real-time synchronization channel
const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('mcu_press_cross_tab_sync')
    : null;

function notifyDataUpdated(type: 'books' | 'transactions' | 'users') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(`mcu_${type}_updated`));
    try {
      syncChannel?.postMessage({ type, timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors
    }
  }
}

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
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || new Date().toISOString(),
    created_by: b.created_by || '',
    category: b.category || 'พระไตรปิฎกและคัมภีร์ศึกษา',
    description: b.description || '',
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
    created_at: t.created_at || new Date().toISOString(),
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
  // Books - Local Cache
  getBooks(): Book[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) return [];
      const parsed: any[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(parseBook);
    } catch {
      return [];
    }
  },

  saveBooks(books: Book[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch {
      // Ignore quota error
    }
    notifyDataUpdated('books');
  },

  // Direct Fetch from Cloud SQL Backend (used on load & polling)
  async fetchBooksFromApi(): Promise<Book[]> {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const remoteBooks: any[] = await res.json();
        if (Array.isArray(remoteBooks)) {
          const parsed = remoteBooks.map(parseBook);
          localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(parsed));
          notifyDataUpdated('books');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Network fetch error for books, using cache:', e);
    }
    return this.getBooks();
  },

  async fetchTransactionsFromApi(): Promise<StockTransaction[]> {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const remoteTxs: any[] = await res.json();
        if (Array.isArray(remoteTxs)) {
          const parsed = remoteTxs.map(parseTransaction);
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed));
          notifyDataUpdated('transactions');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Network fetch error for transactions, using cache:', e);
    }
    return this.getTransactions();
  },

  async clearAllBooks(): Promise<void> {
    try {
      await fetch('/api/reset-defaults', { method: 'POST' });
    } catch (e) {
      console.warn('Network reset error:', e);
    }

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    notifyDataUpdated('books');
    notifyDataUpdated('transactions');
  },

  // Add Book: Directly stores to Cloud SQL first, ensuring remote persistence
  async addBook(
    bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>,
    creatorName: string
  ): Promise<Book> {
    const payload = {
      ...bookData,
      created_by: creatorName,
    };

    // 1. Persist directly to Cloud SQL PostgreSQL backend
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ไม่สามารถบันทึกข้อมูลหนังสือลงฐานข้อมูลกลางได้');
    }

    const remoteCreated = await res.json();
    const newBook = parseBook(remoteCreated);

    // 2. Update local storage with real persisted record
    const books = this.getBooks().filter((b) => b.id !== newBook.id);
    books.unshift(newBook);
    this.saveBooks(books);

    // 3. Sync transactions from backend (initial stock transaction was created by backend)
    await this.fetchTransactionsFromApi().catch(() => {});

    notifyDataUpdated('books');
    notifyDataUpdated('transactions');

    return newBook;
  },

  async updateBook(
    id: string,
    updates: Partial<Book>,
    updaterName: string
  ): Promise<Book | null> {
    // 1. Send update to Cloud SQL backend
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, updaterName }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ไม่สามารถบันทึกการแก้ไขลงฐานข้อมูลกลางได้');
    }

    const updatedRemote = await res.json();
    const updatedBook = parseBook(updatedRemote);

    // 2. Update local cache
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === id);
    if (index !== -1) {
      books[index] = updatedBook;
    } else {
      books.unshift(updatedBook);
    }
    this.saveBooks(books);

    // 3. Update transactions if stock changed
    await this.fetchTransactionsFromApi().catch(() => {});

    notifyDataUpdated('books');
    notifyDataUpdated('transactions');

    return updatedBook;
  },

  async deleteBook(id: string): Promise<boolean> {
    // 1. Send delete request to Cloud SQL backend
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ไม่สามารถลบหนังสือออกจากฐานข้อมูลกลางได้');
    }

    // 2. Update local cache
    const books = this.getBooks().filter((b) => b.id !== id);
    this.saveBooks(books);

    const txs = this.getTransactions().filter((t) => t.book_id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

    notifyDataUpdated('books');
    notifyDataUpdated('transactions');

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
    const localBook = this.getBooks().find((b) => b.id === bookId);

    const res = await fetch(`/api/books/${bookId}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        quantity,
        operatorName,
        note,
        bookFallback: localBook
          ? {
              book_name: localBook.book_name,
              author: localBook.author,
              pages: localBook.pages,
              isbn: localBook.isbn,
              published_year: localBook.published_year,
              price: localBook.price,
              cover_image: localBook.cover_image,
              category: localBook.category,
              description: localBook.description,
            }
          : undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ไม่สามารถบันทึกการปรับปรุงสต๊อกลงฐานข้อมูลกลางได้');
    }

    const data = await res.json();
    const book = parseBook(data.book);
    const transaction = parseTransaction(data.transaction);

    // Update local cache
    const books = this.getBooks();
    const idx = books.findIndex((b) => b.id === bookId);
    if (idx !== -1) {
      books[idx] = book;
    } else {
      books.unshift(book);
    }
    this.saveBooks(books);

    const txs = this.getTransactions().filter((t) => t.id !== transaction.id);
    txs.unshift(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

    notifyDataUpdated('books');
    notifyDataUpdated('transactions');

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
    const localBook = this.getBooks().find((b) => b.id === params.bookId);

    const res = await fetch(`/api/books/${params.bookId}/postal-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        bookFallback: localBook
          ? {
              book_name: localBook.book_name,
              author: localBook.author,
              pages: localBook.pages,
              isbn: localBook.isbn,
              published_year: localBook.published_year,
              price: localBook.price,
              cover_image: localBook.cover_image,
              category: localBook.category,
              description: localBook.description,
            }
          : undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ไม่สามารถบันทึกรายการขายพัสดุลงฐานข้อมูลกลางได้');
    }

    const data = await res.json();
    const book = parseBook(data.book);
    const transaction = parseTransaction(data.transaction);

    // Update local cache
    const books = this.getBooks();
    const idx = books.findIndex((b) => b.id === params.bookId);
    if (idx !== -1) {
      books[idx] = book;
    } else {
      books.unshift(book);
    }
    this.saveBooks(books);

    const txs = this.getTransactions().filter((t) => t.id !== transaction.id);
    txs.unshift(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

    notifyDataUpdated('books');
    notifyDataUpdated('transactions');

    return { book, transaction };
  },

  // Transactions Local Cache
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
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete transaction remote error:', e);
    }

    const txs = this.getTransactions().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    notifyDataUpdated('transactions');
  },

  async clearAllTransactions(): Promise<void> {
    try {
      await fetch('/api/transactions', { method: 'DELETE' });
    } catch (e) {
      console.warn('Clear transactions remote error:', e);
    }

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    notifyDataUpdated('transactions');
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
    notifyDataUpdated('transactions');

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
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyDataUpdated('users');
  },

  getActiveUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
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
    notifyDataUpdated('books');
    notifyDataUpdated('transactions');
    notifyDataUpdated('users');

    try {
      await fetch('/api/reset-defaults', { method: 'POST' });
    } catch (e) {
      console.warn('Network sync notice during reset:', e);
    }
  },
};

/**
 * Real-time bidirectional synchronization with Cloud SQL PostgreSQL backend.
 * Synchronizes books and transactions across all devices, users, tabs, and sessions.
 */
export function initializeCloudSync(): () => void {
  let isCancelled = false;

  const syncAll = async () => {
    if (isCancelled) return;
    try {
      await Promise.allSettled([
        storageService.fetchBooksFromApi(),
        storageService.fetchTransactionsFromApi(),
      ]);
    } catch {
      // Keep offline cache intact
    }
  };

  // Immediate sync upon initialization
  syncAll();

  // Frequent polling every 3.5 seconds across all connected devices and users
  const timer = setInterval(() => {
    if (!document.hidden && !isCancelled) {
      syncAll();
    }
  }, 3500);

  // Sync immediately when returning to the tab / window focus
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isCancelled) {
      syncAll();
    }
  };

  const onFocus = () => {
    if (!isCancelled) {
      syncAll();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onFocus);

  // Sync instantly across multiple browser tabs on the same computer
  if (syncChannel) {
    syncChannel.onmessage = () => {
      if (!isCancelled) {
        window.dispatchEvent(new Event('mcu_books_updated'));
        window.dispatchEvent(new Event('mcu_transactions_updated'));
      }
    };
  }

  return () => {
    isCancelled = true;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
  };
}

// Backwards-compatible alias for existing imports
export const initializeSupabaseSync = initializeCloudSync;
