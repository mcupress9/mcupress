import { Book, StockTransaction, User, StockStatus, SummaryStats } from '../types';
import { supabase, setSupabaseStatus, isTableMissingError } from './supabase';

const STORAGE_KEYS = {
  BOOKS: 'mcu_press_books_v1',
  TRANSACTIONS: 'mcu_press_transactions_v1',
  USERS: 'mcu_press_users_v1',
  CURRENT_USER: 'mcu_press_active_user_v1',
  SETTINGS: 'mcu_press_settings_v1',
  ADD_BOOK_DRAFT: 'mcu_press_add_book_draft_v1',
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

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'mcu-b01',
    book_name: 'พระไตรปิฎกฉบับภาษาไทย มหาจุฬาลงกรณราชวิทยาลัย (ชุดสังเขปสารัตถะ)',
    author: 'คณะกรรมการการตรวจชำระพระไตรปิฎก มจร',
    pages: 680,
    isbn: '978-616-300-112-4',
    published_year: 2567,
    price: 450,
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 48,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    created_by: 'พระมหาคณัย สุมน, ดร.',
    category: 'พระไตรปิฎกและคัมภีร์ศึกษา',
    description: 'ประมวลสารัตถะสำคัญแห่งพระไตรปิฎก ทั้งพระวินัย พระสูตร และพระอภิธรรม เพื่อการศึกษาค้นคว้าของคณาจารย์และนิสิต',
  },
  {
    id: 'mcu-b02',
    book_name: 'พุทธธรรมและสังคมศาสตร์ร่วมสมัย',
    author: 'ศ.ดร.สมภาร พรหมทา และคณาจารย์ มจร',
    pages: 340,
    isbn: '978-616-300-245-9',
    published_year: 2567,
    price: 290,
    cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 26,
    created_at: '2024-02-14T11:20:00Z',
    updated_at: '2024-02-14T11:20:00Z',
    created_by: 'พระมหาคณัย สุมน, ดร.',
    category: 'พุทธปรัชญาและสังคม',
    description: 'การนำหลักธรรมคำสอนในพระพุทธศาสนามาประยุกต์และวิเคราะห์บริบทสังคม เศรษฐกิจ และความเปลี่ยนแปลงของโลกยุคใหม่',
  },
  {
    id: 'mcu-b03',
    book_name: 'ประวัติศาสตร์พระพุทธศาสนาในเอเชียและสุวรรณภูมิ',
    author: 'พระธรรมโกศาจารย์ (ประยูร ธมฺมจิตฺโต)',
    pages: 520,
    isbn: '978-616-300-388-1',
    published_year: 2566,
    price: 380,
    cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 8,
    created_at: '2023-05-18T14:00:00Z',
    updated_at: '2023-11-02T10:30:00Z',
    created_by: 'นายสมชาย เจริญสุข',
    category: 'ประวัติศาสตร์พระพุทธศาสนา',
    description: 'ลำดับเหตุการณ์การเผยแผ่และพัฒนาการของพระพุทธศาสนาตั้งแต่อินเดีย ลังกา สู่ดินแดนสุวรรณภูมิและประเทศไทย',
  },
  {
    id: 'mcu-b04',
    book_name: 'พุทธจิตวิทยาประยุกต์เพื่อการพัฒนาจิตและปัญญา',
    author: 'รศ.ดร.สุรพล สุคนธปฏิภาค',
    pages: 280,
    isbn: '978-616-300-412-3',
    published_year: 2566,
    price: 260,
    cover_image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 0,
    created_at: '2023-08-22T08:15:00Z',
    updated_at: '2024-03-01T16:45:00Z',
    created_by: 'นางสาววราภรณ์ วงศ์สว่าง',
    category: 'พุทธจิตวิทยา',
    description: 'หลักการทางจิตวิทยาพุทธบูรณาการเพื่อการบำบัด เยียวยา และพัฒนาศักยภาพแห่งชีวิตด้วยสติและสมาธิ',
  },
  {
    id: 'mcu-b05',
    book_name: 'วิสุทธิมรรค ฉบับแปลสังเคราะห์ทางวิชาการ',
    author: 'พระพรหมบัณฑิต (ประยูร ธมฺมจิตฺโต, ศ., ดร.)',
    pages: 890,
    isbn: '978-616-300-501-4',
    published_year: 2565,
    price: 650,
    cover_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 35,
    created_at: '2022-09-05T13:40:00Z',
    updated_at: '2022-09-05T13:40:00Z',
    created_by: 'พระมหาคณัย สุมน, ดร.',
    category: 'พระไตรปิฎกและคัมภีร์ศึกษา',
    description: 'คัมภีร์อธิบายศีล สมาธิ ปัญญา อันเป็นหนทางสู่ความบริสุทธิ์หมดจดแห่งจิตใจ จัดพิมพ์เป็นคู่มืออ้างอิงวิทยานิพนธ์',
  },
  {
    id: 'mcu-b06',
    book_name: 'สันติวิธีและทักษะการเจรจาไกล่เกลี่ยข้อพิพาทตามแนวพุทธ',
    author: 'พระครูสุธีจริยวัฒน์, ดร. และสถาบันสันติศึกษา มจร',
    pages: 310,
    isbn: '978-616-300-619-6',
    published_year: 2565,
    price: 320,
    cover_image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 5,
    created_at: '2022-11-12T10:10:00Z',
    updated_at: '2023-12-15T09:20:00Z',
    created_by: 'นายสมชาย เจริญสุข',
    category: 'สันติศึกษา',
    description: 'องค์ความรู้กระบวนทัศน์สันติวิธี วิถีพุทธ และแนวทางการจัดการความขัดแย้งในสังคมพหุวัฒนธรรม',
  },
  {
    id: 'mcu-b07',
    book_name: 'อภิธรรมมัตถสังคหะและปรมัตถธรรมสังเขป',
    author: 'พระราชวรมุนี (พล อาภากโร, ดร.)',
    pages: 420,
    isbn: '978-616-300-723-0',
    published_year: 2564,
    price: 350,
    cover_image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 19,
    created_at: '2021-04-18T15:20:00Z',
    updated_at: '2021-04-18T15:20:00Z',
    created_by: 'พระมหาคณัย สุมน, ดร.',
    category: 'พระไตรปิฎกและคัมภีร์ศึกษา',
    description: 'คู่มือการศึกษาจิต เจตสิก รูป นิพพาน สำหรับนิสิตระดับปริญญาตรีและบัณฑิตศึกษา',
  },
  {
    id: 'mcu-b08',
    book_name: 'มิลินทปัญหาและพุทธปรัชญาเปรียบเทียบ',
    author: 'ศ.พิเศษ เสฐียรพงษ์ วรรณปก (ราชบัณฑิต)',
    pages: 360,
    isbn: '978-616-300-844-2',
    published_year: 2564,
    price: 280,
    cover_image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 0,
    created_at: '2021-07-29T11:00:00Z',
    updated_at: '2024-02-10T14:30:00Z',
    created_by: 'นางสาววราภรณ์ วงศ์สว่าง',
    category: 'พุทธปรัชญาและสังคม',
    description: 'บทสนทนาอันลึกซึ้งระหว่างพระนาคเสนกับพระยามิลินท์ ไขข้อข้องใจในปรัชญาชีวิตและการดับทุกข์',
  },
  {
    id: 'mcu-b09',
    book_name: 'ระเบียบวิธีวิจัยทางพระพุทธศาสนาและนวัตกรรมการศึกษา',
    author: 'พระธรรมวัชรบัณฑิต (สมจินต์ สมฺมาปญฺโญ, ศ., ดร.)',
    pages: 460,
    isbn: '978-616-300-915-9',
    published_year: 2567,
    price: 390,
    cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 62,
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
    created_by: 'พระมหาคณัย สุมน, ดร.',
    category: 'ระเบียบวิธีวิจัย',
    description: 'ตำราหลักว่าด้วยการออกแบบงานวิจัยทางพระพุทธศาสนา ทั้งเชิงคุณภาพ เชิงปริมาณ และการสังเคราะห์ตัวบทคัมภีร์',
  },
  {
    id: 'mcu-b10',
    book_name: 'ภาษาบาลีเพื่อการค้นคว้าพระไตรปิฎก (เล่ม ๑)',
    author: 'พระมหาบุญเลิศ อินฺทปญฺโญ, ศ.ดร.',
    pages: 390,
    isbn: '978-616-300-982-1',
    published_year: 2566,
    price: 310,
    cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 4,
    created_at: '2023-04-12T13:15:00Z',
    updated_at: '2024-02-28T10:00:00Z',
    created_by: 'นายสมชาย เจริญสุข',
    category: 'ภาษาบาลีและสันสกฤต',
    description: 'หลักไวยากรณ์บาลี โครงสร้างประโยค และการแปลความหมายศัพท์ในพระไตรปิฎกสำหรับนักวิชาการ',
  },
];

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

// Storage helpers with Supabase Synchronization & LocalStorage Fallback
export const storageService = {
  // Books
  getBooks(): Book[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
        return INITIAL_BOOKS;
      }
      const parsed: Book[] = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
        return INITIAL_BOOKS;
      }
      return parsed;
    } catch {
      return INITIAL_BOOKS;
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

    if (supabase) {
      try {
        await supabase.from('books').delete().neq('id', '_all_clear_guard_');
        await supabase.from('transactions').delete().neq('id', '_all_clear_guard_');
      } catch (e) {
        console.warn('Error clearing books in Supabase:', e);
      }
    }
  },

  addBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>, creatorName: string): Book {
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

    // Sync new book to Supabase cloud database
    if (supabase) {
      supabase
        .from('books')
        .insert(newBook)
        .then(
          ({ error }) => {
            if (error) {
              if (isTableMissingError(error)) {
                setSupabaseStatus('tables_missing');
              } else {
                console.warn('Supabase insert error (using local cache):', error.message);
              }
            } else {
              setSupabaseStatus('connected');
            }
          },
          () => {
            setSupabaseStatus('fallback_local');
          }
        );
    }

    // Also record initial stock transaction if stock > 0
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

    return newBook;
  },

  updateBook(id: string, updates: Partial<Book>, updaterName: string): Book | null {
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

    // Sync book update to Supabase
    if (supabase) {
      supabase
        .from('books')
        .update(updatedBook)
        .eq('id', updatedBook.id)
        .then(
          ({ error }) => {
            if (error && isTableMissingError(error)) {
              setSupabaseStatus('tables_missing');
            }
          },
          () => {}
        );
    }

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

    return updatedBook;
  },

  deleteBook(id: string): boolean {
    const books = this.getBooks();
    const filtered = books.filter((b) => b.id !== id);
    if (filtered.length === books.length) return false;
    this.saveBooks(filtered);

    // Sync deletion to Supabase
    if (supabase) {
      supabase
        .from('books')
        .delete()
        .eq('id', id)
        .then(
          ({ error }) => {
            if (error && isTableMissingError(error)) {
              setSupabaseStatus('tables_missing');
            }
          },
          () => {}
        );
    }

    return true;
  },

  // Stock Adjustment
  adjustStock(
    bookId: string,
    type: 'in' | 'increase' | 'decrease',
    quantity: number,
    operatorName: string,
    note: string
  ): { book: Book; transaction: StockTransaction } | null {
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
    }

    book.stock_quantity = stockAfter;
    book.updated_at = new Date().toISOString();
    books[index] = book;
    this.saveBooks(books);

    // Sync adjusted book to Supabase
    if (supabase) {
      supabase
        .from('books')
        .update({
          stock_quantity: stockAfter,
          updated_at: book.updated_at,
        })
        .eq('id', book.id)
        .then(
          ({ error }) => {
            if (error && isTableMissingError(error)) {
              setSupabaseStatus('tables_missing');
            }
          },
          () => {}
        );
    }

    const transaction = this.addTransaction({
      book_id: book.id,
      book_name: book.book_name,
      transaction_type: type,
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_by: operatorName,
      note: note || (type === 'in' ? 'รับเข้าสต๊อก' : type === 'increase' ? 'ปรับเพิ่มสต๊อก' : 'ปรับลดสต๊อก'),
    });

    return { book, transaction };
  },

  // Transactions
  getTransactions(): StockTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const txs = this.getTransactions().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    if (supabase) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (e) {
        console.warn('Error deleting transaction from Supabase:', e);
      }
    }
  },

  async clearAllTransactions(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    window.dispatchEvent(new Event('mcu_transactions_updated'));

    if (supabase) {
      try {
        await supabase.from('transactions').delete().neq('id', '_none_');
      } catch (e) {
        console.warn('Error clearing transactions from Supabase:', e);
      }
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

    // Sync transaction to Supabase
    if (supabase) {
      supabase
        .from('transactions')
        .insert(newTx)
        .then(
          ({ error }) => {
            if (error && isTableMissingError(error)) {
              setSupabaseStatus('tables_missing');
            }
          },
          () => {}
        );
    }

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
      let modified = false;
      const updated = parsed.map((u) => {
        let userCopy = { ...u };
        if (userCopy.avatar) {
          delete userCopy.avatar;
          modified = true;
        }
        if (userCopy.id === 'user-1' && userCopy.name !== 'พระมหาคณัย สุมน, ดร.') {
          modified = true;
          userCopy.name = 'พระมหาคณัย สุมน, ดร.';
        }
        if (userCopy.id === 'user-2' && (userCopy.role as string) === 'Staff') {
          modified = true;
          userCopy.role = 'Manager';
          userCopy.department = 'หัวหน้าฝ่ายคลังและพัสดุสิ่งพิมพ์';
        }
        return userCopy;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      }
      return updated;
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
      const parsed: User = JSON.parse(data);
      if (parsed.avatar) {
        delete parsed.avatar;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
      }
      if (parsed.id === 'user-1' && parsed.name !== 'พระมหาคณัย สุมน, ดร.') {
        parsed.name = 'พระมหาคณัย สุมน, ดร.';
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
      }
      return parsed;
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

    if (supabase) {
      try {
        await supabase.from('books').upsert(INITIAL_BOOKS);
      } catch (e) {
        console.warn('Failed to seed Supabase books defaults:', e);
      }
    }
  },
};

let isSupabaseSyncActive = false;

/**
 * Initializes bidirectional real-time synchronization with Supabase (PostgreSQL).
 * Auto-syncs remote books and transactions, with smooth LocalStorage fallback.
 */
export function initializeSupabaseSync(): () => void {
  if (isSupabaseSyncActive) return () => {};
  isSupabaseSyncActive = true;

  if (!supabase) {
    setSupabaseStatus('fallback_local');
    return () => {
      isSupabaseSyncActive = false;
    };
  }

  setSupabaseStatus('connecting');

  // 1. Initial Fetch from Supabase
  const syncRemoteBooks = async () => {
    try {
      const { data, error } = await supabase!
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          setSupabaseStatus('tables_missing');
        } else {
          console.warn('Supabase books query failed, continuing with local data:', error.message);
          setSupabaseStatus('fallback_local');
        }
        return;
      }

      setSupabaseStatus('connected');

      if (data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(data));
        window.dispatchEvent(new Event('mcu_books_updated'));
      } else {
        // If Supabase table exists but is empty, seed it with initial books
        const currentLocal = storageService.getBooks();
        if (currentLocal.length > 0) {
          supabase!.from('books').upsert(currentLocal).then(() => {});
        }
      }
    } catch (e) {
      console.warn('Network error reaching Supabase, using local fallback:', e);
      setSupabaseStatus('fallback_local');
    }
  };

  const syncRemoteTransactions = async () => {
    try {
      const { data, error } = await supabase!
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          setSupabaseStatus('tables_missing');
        }
        return;
      }

      if (data) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data));
        window.dispatchEvent(new Event('mcu_transactions_updated'));
      }
    } catch (e) {
      console.warn('Error fetching Supabase transactions:', e);
    }
  };

  syncRemoteBooks();
  syncRemoteTransactions();

  // 2. Real-time Subscription via Supabase Realtime Channels
  let channel: any = null;
  try {
    channel = supabase
      .channel('mcu-press-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'books' },
        (payload) => {
          const currentBooks = storageService.getBooks();
          if (payload.eventType === 'INSERT') {
            const newBook = payload.new as Book;
            const exists = currentBooks.some((b) => b.id === newBook.id);
            if (!exists) {
              storageService.saveBooks([newBook, ...currentBooks]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Book;
            const next = currentBooks.map((b) => (b.id === updated.id ? updated : b));
            storageService.saveBooks(next);
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            const next = currentBooks.filter((b) => b.id !== oldId);
            storageService.saveBooks(next);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          const currentTxs = storageService.getTransactions();
          if (payload.eventType === 'INSERT') {
            const newTx = payload.new as StockTransaction;
            const exists = currentTxs.some((t) => t.id === newTx.id);
            if (!exists) {
              const updated = [newTx, ...currentTxs];
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
              window.dispatchEvent(new Event('mcu_transactions_updated'));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            const updated = currentTxs.filter((t) => t.id !== oldId);
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
            window.dispatchEvent(new Event('mcu_transactions_updated'));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus('connected');
        }
      });
  } catch (err) {
    console.warn('Failed to subscribe to Supabase Realtime:', err);
  }

  return () => {
    isSupabaseSyncActive = false;
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}
