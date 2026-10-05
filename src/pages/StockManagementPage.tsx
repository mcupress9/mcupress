import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Book, StockTransaction, TransactionType } from '../types';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';

interface StockManagementPageProps {
  books: Book[];
  transactions: StockTransaction[];
  onRefresh: () => void;
  preselectedBookId?: string | null;
}

export const StockManagementPage: React.FC<StockManagementPageProps> = ({
  books,
  transactions,
  onRefresh,
  preselectedBookId,
}) => {
  const { currentUser } = useAuth();

  const [selectedBookId, setSelectedBookId] = useState<string>(
    preselectedBookId || (books.length > 0 ? books[0].id : '')
  );
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [adjustType, setAdjustType] = useState<TransactionType>('in');
  const [quantity, setQuantity] = useState<string>('10');
  const [note, setNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History filter on the right panel
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Books filtered for selector
  const selectableBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return books;
    const q = bookSearchQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.book_name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  }, [books, bookSearchQuery]);

  const selectedBook = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || books[0];
  }, [books, selectedBookId]);

  // Real-time stock calculation preview
  const parsedQty = parseInt(quantity, 10) || 0;
  const currentStock = selectedBook ? selectedBook.stock_quantity : 0;
  const isAddition = adjustType === 'in' || adjustType === 'increase';
  const projectedStock = isAddition
    ? currentStock + parsedQty
    : Math.max(0, currentStock - parsedQty);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedBook) {
      setErrorMessage('กรุณาเลือกหนังสือที่ต้องการปรับสต๊อก');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setErrorMessage('กรุณาระบุจำนวนเล่มที่ต้องการปรับเปลี่ยนให้มากกว่า 0');
      return;
    }

    if (!isAddition && qty > selectedBook.stock_quantity) {
      setErrorMessage(
        `ไม่สามารถปรับลดสต๊อก ${qty} เล่มได้ เนื่องจากปัจจุบันมีคงเหลือเพียง ${selectedBook.stock_quantity} เล่ม`
      );
      return;
    }

    setIsSubmitting(true);

    (async () => {
      try {
        const result = await storageService.adjustStock(
          selectedBook.id,
          adjustType,
          qty,
          currentUser?.name || 'เจ้าหน้าที่คลัง',
          note.trim()
        );

        setIsSubmitting(false);

        if (result) {
          setSuccessMessage(
            `บันทึกการปรับสต๊อกหนังสือ "${result.book.book_name}" สำเร็จ (ยอดคงเหลือใหม่: ${result.book.stock_quantity} เล่ม)`
          );
          setNote('');
          onRefresh();
        }
      } catch (err) {
        console.error('Failed to adjust stock:', err);
        setIsSubmitting(false);
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกสต๊อก กรุณาลองใหม่อีกครั้ง');
      }
    })();
  };

  // Filtered recent logs for right column
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !historySearchQuery.trim() ||
        tx.book_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        tx.created_by.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(historySearchQuery.toLowerCase()));

      const matchType =
        historyFilterType === 'all'
          ? true
          : historyFilterType === 'in'
          ? tx.transaction_type === 'in' || tx.transaction_type === 'increase'
          : tx.transaction_type === 'decrease';

      return matchSearch && matchType;
    });
  }, [transactions, historySearchQuery, historyFilterType]);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        }) +
        ' ' +
        d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) +
        ' น.'
      );
    } catch {
      return isoString;
    }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('ท่านต้องการลบประวัติความเคลื่อนไหวสต๊อกทั้งหมดใช่หรือไม่?')) {
      await storageService.clearAllTransactions();
      onRefresh();
    }
  };

  const handleDeleteSingleTransaction = async (txId: string, bookTitle: string) => {
    if (window.confirm(`ต้องการลบรายการประวัติ "${bookTitle}" ออกจากระบบใช่หรือไม่?`)) {
      await storageService.deleteTransaction(txId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6 pb-8 sm:pb-16">
      {/* Title Bar */}
      <div>
        <h2 className="text-lg sm:text-2xl font-extrabold text-[#111827] tracking-tight">
          ระบบจัดการสต๊อกสิ่งพิมพ์ (Stock Management)
        </h2>
        <p className="text-[11px] sm:text-sm text-[#64748B] mt-0.5">
          รับเข้าหนังสือจากโรงพิมพ์ ปรับปรุงยอดคงเหลือ และบันทึกประวัติความเคลื่อนไหว
        </p>
      </div>

      {/* Two-Column Layout: Form on Left, Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
        {/* Left: Stock Adjustment Form */}
        <div className="lg:col-span-6 bg-white p-3.5 sm:p-7 rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-3 sm:space-y-5">
          <div className="flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-[#F3DDE7]/60">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-[12px] bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center flex-shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
                แบบฟอร์มปรับปรุงสต๊อก
              </h3>
              <p className="text-[11px] sm:text-xs text-[#64748B]">
                ผู้บันทึกรายการ: <strong className="text-[#111827]">{currentUser?.name}</strong>
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-[12px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-2.5">
              <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#10B981] flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-2.5">
              <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#EF4444] flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-3 sm:space-y-4">
            {/* Search / Filter & Select Book */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                1. เลือกหนังสือที่ต้องการปรับยอด <span className="text-[#ED1760]">*</span>
              </label>

              {/* Quick Filter Search for Book */}
              <div className="relative mb-1.5 sm:mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อหนังสือเพื่อกรอง..."
                  className="w-full pl-8 pr-3 py-1 sm:py-1.5 rounded-lg sm:rounded-[10px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
                />
              </div>

              <select
                value={selectedBookId}
                disabled={books.length === 0}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs sm:text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] cursor-pointer shadow-2xs disabled:opacity-60"
              >
                {books.length === 0 ? (
                  <option value="">-- ยังไม่มีหนังสือในระบบ --</option>
                ) : (
                  selectableBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.book_name} (พ.ศ. {b.published_year || '-'}) · คงเหลือ {b.stock_quantity} เล่ม
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Selected Book Overview Card */}
            {selectedBook && (
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] flex items-center gap-2.5 sm:gap-3">
                <img
                  src={selectedBook.cover_image}
                  alt={selectedBook.book_name}
                  className="w-9 h-12 sm:w-11 sm:h-15 object-cover rounded-md shadow-2xs border border-[#F3DDE7] flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                      {selectedBook.book_name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#FCE7F3] text-[#ED1760] font-black text-[9px] sm:text-[10px] border border-[#F3DDE7]">
                      พ.ศ. {selectedBook.published_year}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#64748B] mt-0.5 truncate">
                    ผู้แต่ง: {selectedBook.author} · {selectedBook.category || 'สิ่งพิมพ์ทั่วไป'}
                  </div>
                  <div className="mt-0.5 sm:mt-1 flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs text-[#64748B]">
                      คงเหลือ: <strong className="text-[#ED1760] font-bold">{selectedBook.stock_quantity}</strong> เล่ม
                    </span>
                    <StockBadge quantity={selectedBook.stock_quantity} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Operation Type: In vs Out */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                2. ประเภทรายการ <span className="text-[#ED1760]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-[12px] text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    isAddition
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-2xs'
                      : 'bg-[#FCF8FA] text-[#64748B] border-[#F3DDE7] hover:bg-[#ECFDF5] hover:text-[#10B981]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>รับเข้า (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('decrease')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-[12px] text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    !isAddition
                      ? 'bg-[#ED1760] text-white border-[#ED1760] shadow-2xs'
                      : 'bg-[#FCF8FA] text-[#64748B] border-[#F3DDE7] hover:bg-[#FCE7F3] hover:text-[#ED1760]'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>เบิกจ่าย (-)</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                3. จำนวนเล่ม <span className="text-[#ED1760]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="เช่น 20"
                  className="w-full pl-3.5 pr-12 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm sm:text-base font-extrabold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-[#64748B] font-bold">
                  เล่ม
                </div>
              </div>
            </div>

            {/* Real-time Preview */}
            {selectedBook && (
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] flex items-center justify-between">
                <div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    ยอดก่อนปรับ
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#111827]">
                    {currentStock} เล่ม
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    className={`text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                      isAddition
                        ? 'bg-[#ECFDF5] text-[#10B981]'
                        : 'bg-[#FCE7F3] text-[#ED1760]'
                    }`}
                  >
                    {isAddition ? `+${parsedQty}` : `-${parsedQty}`}
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#64748B]" />
                </div>

                <div className="text-right">
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    ยอดใหม่
                  </div>
                  <div className="text-xs sm:text-base font-extrabold text-[#ED1760]">
                    {projectedStock} เล่ม
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                4. หมายเหตุ / อ้างอิง
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น พิมพ์เพิ่มครั้งที่ 2, ส่งมอบศูนย์หนังสือ มจร..."
                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || books.length === 0}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#ED1760]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการปรับปรุงสต๊อก'}
            </button>
          </form>
        </div>

        {/* Right: Recent Stock Logs */}
        <div className="lg:col-span-6 bg-white p-3.5 sm:p-7 rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-[#F3DDE7]/60">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-[12px] bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
                  ประวัติความเคลื่อนไหวสต๊อก
                </h3>
                <p className="text-[11px] sm:text-xs text-[#64748B]">
                  บันทึกทั้งหมด {transactions.length} รายการ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end">
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-[#ED1760] hover:bg-[#FCE7F3] border border-[#F3DDE7] transition-all flex items-center gap-1 cursor-pointer"
                  title="ลบประวัติทั้งหมด"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>ล้างประวัติ</span>
                </button>
              )}

              {/* Filter: All / In / Out */}
              <div className="flex items-center bg-[#FCF8FA] p-0.5 sm:p-1 rounded-lg sm:rounded-[10px] border border-[#F3DDE7] text-[11px] sm:text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('all')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer ${
                    historyFilterType === 'all'
                      ? 'bg-white text-[#ED1760] shadow-2xs font-bold'
                      : 'text-[#64748B]'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('in')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer ${
                    historyFilterType === 'in'
                      ? 'bg-white text-[#10B981] shadow-2xs font-bold'
                      : 'text-[#64748B]'
                  }`}
                >
                  รับเข้า (+)
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('out')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer ${
                    historyFilterType === 'out'
                      ? 'bg-white text-[#ED1760] shadow-2xs font-bold'
                      : 'text-[#64748B]'
                  }`}
                >
                  เบิกออก (-)
                </button>
              </div>
            </div>
          </div>

          {/* Search history input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อหนังสือ, ผู้ทำรายการ..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg sm:rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
            />
          </div>

          {/* Transactions List */}
          <div className="space-y-2 sm:space-y-2.5 max-h-[420px] sm:max-h-[500px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-xs text-[#64748B]">
                ยังไม่มีข้อมูลประวัติการเคลื่อนไหวสต๊อก
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isTxIn = tx.transaction_type === 'in' || tx.transaction_type === 'increase';
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] hover:border-[#ED1760]/30 transition-all flex items-start justify-between gap-2.5 sm:gap-3 group"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isTxIn
                            ? 'bg-[#ECFDF5] text-[#10B981]'
                            : 'bg-[#FCE7F3] text-[#ED1760]'
                        }`}
                      >
                        {isTxIn ? (
                          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#111827] truncate">
                          {tx.book_name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5">
                          {tx.note || (isTxIn ? 'รับเข้าสต๊อก' : 'เบิกจ่ายสต๊อก')}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#64748B] mt-0.5 sm:mt-1">
                          โดย: {tx.created_by} · {formatDateTime(tx.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full ${
                          isTxIn
                            ? 'bg-[#ECFDF5] text-[#10B981]'
                            : 'bg-[#FCE7F3] text-[#ED1760]'
                        }`}
                      >
                        {isTxIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-[#64748B] mt-0.5 sm:mt-1 tabular-nums">
                        {tx.stock_before} ➔ {tx.stock_after} เล่ม
                      </span>
                      <button
                        onClick={() => handleDeleteSingleTransaction(tx.id, tx.book_name)}
                        className="opacity-0 group-hover:opacity-100 text-[#EF4444] hover:text-[#B91C1C] p-1 mt-1 transition-opacity cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
