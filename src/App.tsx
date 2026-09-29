import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService, initializeSupabaseSync } from './services/storage';
import { Book, StockTransaction, User } from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksListPage } from './pages/BooksListPage';
import { AddBookPage } from './pages/AddBookPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { EditBookModal } from './pages/EditBookModal';
import { StockManagementPage } from './pages/StockManagementPage';
import { SummaryPage } from './pages/SummaryPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Trash2 } from 'lucide-react';

const MainApplication: React.FC = () => {
  const { currentUser, canDeleteBook } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDetailView, setIsDetailView] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [stockPreselectedId, setStockPreselectedId] = useState<string | null>(null);

  // Global Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Reload data from storage
  const reloadData = useCallback(() => {
    const loadedBooks = storageService.getBooks();
    const loadedTxs = storageService.getTransactions();
    const loadedUsers = storageService.getUsers();

    setBooks(loadedBooks);
    setTransactions(loadedTxs);
    setUsers(loadedUsers);

    // If currently selected book was updated, sync it
    if (selectedBook) {
      const refreshed = loadedBooks.find((b) => b.id === selectedBook.id);
      if (refreshed) {
        setSelectedBook(refreshed);
      }
    }
  }, [selectedBook]);

  // Initial load, real-time Firestore sync & storage event listener
  useEffect(() => {
    reloadData();

    // Start cloud real-time bidirectional synchronization with Supabase PostgreSQL
    const unsubscribeSupabase = initializeSupabaseSync();

    const handleDataChange = () => {
      reloadData();
    };

    window.addEventListener('mcu_books_updated', handleDataChange);
    window.addEventListener('mcu_transactions_updated', handleDataChange);

    return () => {
      unsubscribeSupabase();
      window.removeEventListener('mcu_books_updated', handleDataChange);
      window.removeEventListener('mcu_transactions_updated', handleDataChange);
    };
  }, [reloadData]);

  // Calculate summary stats
  const stats = useMemo(() => {
    return storageService.getSummaryStats(books);
  }, [books]);

  // Count low stock + out of stock for notification badge
  const lowStockCount = useMemo(() => {
    return books.filter((b) => b.stock_quantity <= 10).length;
  }, [books]);

  // Handle book selection for details view
  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsDetailView(true);
  };

  // Handle edit book
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
  };

  // Handle delete request
  const handleDeleteRequest = (book: Book) => {
    if (!canDeleteBook) {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบหนังสือได้');
      return;
    }
    setBookToDelete(book);
  };

  // Confirm delete
  const confirmDeleteBook = () => {
    if (!bookToDelete) return;
    const bookName = bookToDelete.book_name;
    storageService.deleteBook(bookToDelete.id);
    setBookToDelete(null);
    showToast(`ลบหนังสือ "${bookName}" ออกจากระบบเรียบร้อยแล้ว`);

    if (selectedBook?.id === bookToDelete.id) {
      setSelectedBook(null);
      setIsDetailView(false);
      setCurrentTab('books');
    }
    reloadData();
  };

  // Handle quick stock adjustment jump
  const handleQuickStockAdjust = (book: Book) => {
    setStockPreselectedId(book.id);
    setIsDetailView(false);
    setCurrentTab('stock');
  };

  // If not logged in, render LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'ภาพรวมระบบสต๊อกหนังสือ สำนักพิมพ์ มจร' },
    books: { title: 'หนังสือ', subtitle: 'แคตตาล็อกและการจัดการข้อมูลสิ่งพิมพ์ทางวิชาการ' },
    'add-book': { title: 'เพิ่มหนังสือ', subtitle: 'ลงทะเบียนหนังสือวิชาการเข้าสู่ระบบคลัง' },
    stock: { title: 'สต๊อก', subtitle: 'รับเข้าหนังสือ ปรับปรุงสต๊อก และประวัติธุรกรรม' },
    summary: { title: 'สรุปข้อมูล', subtitle: 'รายงานสถิติสต๊อกและส่งออกไฟล์ Excel/CSV' },
    users: { title: 'ผู้ใช้งาน', subtitle: 'จัดการบัญชีและสิทธิ์การเข้าถึงของเจ้าหน้าที่ 3 คน' },
    settings: { title: 'ตั้งค่าระบบ', subtitle: 'ข้อมูลสำนักพิมพ์ เกณฑ์การแจ้งเตือน และสำรองข้อมูล' },
  };

  const currentHeaderInfo = isDetailView
    ? { title: 'รายละเอียดหนังสือ', subtitle: selectedBook?.book_name || 'ข้อมูลสิ่งพิมพ์' }
    : tabTitles[currentTab] || { title: 'Dashboard', subtitle: 'ภาพรวมระบบสต๊อกหนังสือ สำนักพิมพ์ มจร.' };

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex text-[#111827] font-sans selection:bg-[#FCE7F3] selection:text-[#ED1760]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab: NavTab) => {
          setCurrentTab(tab);
          setIsDetailView(false);
          setIsMobileMenuOpen(false);
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          lowStockCount={lowStockCount}
          currentTabTitle={currentHeaderInfo.title}
          subtitle={currentHeaderInfo.subtitle}
          onNavigateToStock={() => {
            setCurrentTab('stock');
            setIsDetailView(false);
          }}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
            <div className="px-4 py-3 rounded-[16px] bg-[#111827] text-white text-xs sm:text-sm font-semibold shadow-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ED1760] animate-ping" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* If detail view is open */}
          {isDetailView && selectedBook ? (
            <BookDetailPage
              book={selectedBook}
              onBack={() => setIsDetailView(false)}
              onEdit={() => handleEditBook(selectedBook)}
              onDelete={() => handleDeleteRequest(selectedBook)}
              onQuickStockAdjust={() => handleQuickStockAdjust(selectedBook)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  books={books}
                  stats={stats}
                  onNavigateToBooks={() => setCurrentTab('books')}
                  onNavigateToAddBook={() => setCurrentTab('add-book')}
                  onNavigateToStock={() => setCurrentTab('stock')}
                  onSelectBook={handleSelectBook}
                />
              )}

              {currentTab === 'books' && (
                <BooksListPage
                  books={books}
                  onSelectBook={handleSelectBook}
                  onEditBook={handleEditBook}
                  onDeleteBook={handleDeleteRequest}
                  onNavigateToAddBook={() => setCurrentTab('add-book')}
                  onQuickStockAdjust={handleQuickStockAdjust}
                />
              )}

              {currentTab === 'add-book' && (
                <AddBookPage
                  onSuccess={(newBook) => {
                    reloadData();
                    setSelectedBook(newBook);
                    setIsDetailView(true);
                    showToast(`บันทึกข้อมูลหนังสือ "${newBook.book_name}" เรียบร้อยแล้ว`);
                  }}
                  onCancel={() => setCurrentTab('books')}
                />
              )}

              {currentTab === 'stock' && (
                <StockManagementPage
                  books={books}
                  transactions={transactions}
                  onRefresh={reloadData}
                  preselectedBookId={stockPreselectedId}
                />
              )}

              {currentTab === 'summary' && (
                <SummaryPage books={books} onSelectBook={handleSelectBook} />
              )}

              {currentTab === 'users' && (
                <UsersPage users={users} onRefresh={reloadData} />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  onDataReset={() => {
                    reloadData();
                    showToast('รีเซ็ตข้อมูลระบบเรียบร้อยแล้ว');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Edit Book Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={Boolean(editingBook)}
          onClose={() => setEditingBook(null)}
          onSaved={(updated) => {
            reloadData();
            if (selectedBook?.id === updated.id) {
              setSelectedBook(updated);
            }
            showToast(`บันทึกการแก้ไขหนังสือ "${updated.book_name}" สำเร็จ`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] border border-[#F3DDE7] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#111827]">
                ยืนยันการลบข้อมูลหนังสือ?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือ{' '}
                <strong className="text-[#111827] font-bold">
                  "{bookToDelete.book_name}"
                </strong>{' '}
                ออกจากระบบสำนักพิมพ์?
              </p>
              <div className="text-[11px] text-[#EF4444] font-medium pt-1">
                * การกระทำนี้ไม่สามารถย้อนกลับได้
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-[12px] border border-[#F3DDE7] text-[#64748B] hover:bg-[#FCF8FA] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteBook}
                className="flex-1 py-2.5 px-4 rounded-[12px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#EF4444]/20 transition-all cursor-pointer"
              >
                ยืนยันลบหนังสือ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
