import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Send,
  Truck,
  Copy,
  Check,
  ExternalLink,
  Package,
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

  // Postal & Sale Pricing State
  const [postalPrice, setPostalPrice] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedBookId if preselectedBookId changes
  useEffect(() => {
    if (preselectedBookId) {
      setSelectedBookId(preselectedBookId);
    }
  }, [preselectedBookId]);

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

  // Synchronize default postal/sale price when selected book changes
  useEffect(() => {
    if (selectedBook) {
      setPostalPrice(String(selectedBook.price || 0));
    }
  }, [selectedBookId, selectedBook]);

  const parsedPrice = parseFloat(postalPrice) || (selectedBook ? selectedBook.price : 0);
  const totalSaleAmount = parsedQty * parsedPrice;

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedBook) {
      setErrorMessage('กรุณาเลือกหนังสือที่ต้องการทำรายการ');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setErrorMessage('กรุณาระบุจำนวนเล่มให้มากกว่า 0');
      return;
    }

    if (!isAddition && qty > selectedBook.stock_quantity) {
      const actionText = adjustType === 'damage' ? 'บันทึกชำรุด' : 'ขาย';
      setErrorMessage(
        `ไม่สามารถ${actionText} ${qty} เล่มได้ เนื่องจากปัจจุบันมีคงเหลือเพียง ${selectedBook.stock_quantity} เล่ม`
      );
      return;
    }

    setIsSubmitting(true);

    (async () => {
      try {
        if (adjustType === 'decrease' && trackingNumber.trim()) {
          // Postal sale with tracking number
          const price = parseFloat(postalPrice) || selectedBook.price || 0;
          const result = await storageService.recordPostalSale({
            bookId: selectedBook.id,
            quantity: qty,
            price,
            trackingNumber: trackingNumber.trim(),
            operatorName: currentUser?.name || 'เจ้าหน้าที่คลัง',
            customerName: customerName.trim(),
            note: note.trim(),
          });

          setIsSubmitting(false);

          if (result) {
            setSuccessMessage(
              `บันทึกการขายส่งไปรษณีย์ "${result.book.book_name}" จำนวน ${qty} เล่ม สำเร็จ! เลขพัสดุ: ${trackingNumber.trim()} (ยอดคงเหลือใหม่: ${result.book.stock_quantity} เล่ม)`
            );
            setTrackingNumber('');
            setCustomerName('');
            setNote('');
            onRefresh();
          }
        } else {
          // Regular adjust (in, damage, or regular sale)
          const saleNote =
            adjustType === 'decrease' && postalPrice && Number(postalPrice) !== selectedBook.price
              ? [`ราคาขาย ฿${Number(postalPrice).toLocaleString('th-TH')}/เล่ม`, note.trim()]
                  .filter(Boolean)
                  .join(' · ')
              : note.trim();

          const result = await storageService.adjustStock(
            selectedBook.id,
            adjustType,
            qty,
            currentUser?.name || 'เจ้าหน้าที่คลัง',
            saleNote
          );

          setIsSubmitting(false);

          if (result) {
            const typeLabel =
              adjustType === 'in'
                ? 'รับเข้า'
                : adjustType === 'damage'
                ? 'บันทึกชำรุด'
                : 'ขาย';
            setSuccessMessage(
              `บันทึกรายการ${typeLabel}สำหรับหนังสือ "${result.book.book_name}" จำนวน ${qty} เล่ม สำเร็จ (ยอดคงเหลือใหม่: ${result.book.stock_quantity} เล่ม)`
            );
            setNote('');
            onRefresh();
          }
        }
      } catch (err: any) {
        console.error('Failed to adjust stock:', err);
        setIsSubmitting(false);
        setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกสต๊อก กรุณาลองใหม่อีกครั้ง');
      }
    })();
  };

  const copyTracking = (tracking: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tracking);
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    }
  };

  // Filtered recent logs for right column
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !historySearchQuery.trim() ||
        tx.book_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        tx.created_by.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (tx.tracking_number && tx.tracking_number.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
        (tx.customer_name && tx.customer_name.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
        (tx.note && tx.note.toLowerCase().includes(historySearchQuery.toLowerCase()));

      const isPostalTx =
        tx.sale_channel === 'postal' ||
        Boolean(tx.tracking_number) ||
        (tx.note && tx.note.includes('ส่งไปรษณีย์'));

      const isDamageTx =
        tx.transaction_type === 'damage' ||
        (tx.note && (tx.note.includes('ชำรุด') || tx.note.includes('เสียหาย')));

      const matchType =
        historyFilterType === 'all'
          ? true
          : historyFilterType === 'in'
          ? tx.transaction_type === 'in' || tx.transaction_type === 'increase'
          : historyFilterType === 'postal'
          ? isPostalTx
          : historyFilterType === 'damage'
          ? isDamageTx
          : (tx.transaction_type === 'decrease' || historyFilterType === 'out') && !isPostalTx && !isDamageTx;

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
          {/* Form Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-[#F3DDE7]/60">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-[12px] bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center flex-shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
                แบบฟอร์มปรับปรุงสต๊อก (รับเข้า / ขาย / ชำรุด)
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

          {books.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center mx-auto shadow-2xs">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-[#111827]">ยังไม่มีหนังสือในคลัง</h4>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  กรุณาเพิ่มหนังสือเล่มแรกเข้าสู่ระบบก่อน เพื่อเริ่มต้นจัดการสต๊อก รับเข้า หรือบันทึกการขาย
                </p>
              </div>
            </div>
          ) : (
          <form onSubmit={handleAdjustSubmit} className="space-y-3 sm:space-y-4">
            {/* 1. Search / Filter & Select Book */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                1. เลือกหนังสือที่ต้องการทำรายการ <span className="text-[#ED1760]">*</span>
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
                    <span className="text-[11px] sm:text-xs text-[#64748B]">
                      ราคาปก: <strong className="text-[#111827] font-bold">฿{selectedBook.price}</strong>
                    </span>
                    <StockBadge quantity={selectedBook.stock_quantity} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Operation Type: In vs Sale vs Damage */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                2. ประเภทรายการ <span className="text-[#ED1760]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1. รับเข้า */}
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-[12px] text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    adjustType === 'in' || adjustType === 'increase'
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-2xs'
                      : 'bg-[#FCF8FA] text-[#64748B] border-[#F3DDE7] hover:bg-[#ECFDF5] hover:text-[#10B981]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>รับเข้า (+)</span>
                </button>

                {/* 2. ขาย (เปลี่ยนจาก เบิกจ่าย) */}
                <button
                  type="button"
                  onClick={() => setAdjustType('decrease')}
                  className={`py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-[12px] text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    adjustType === 'decrease'
                      ? 'bg-[#ED1760] text-white border-[#ED1760] shadow-2xs'
                      : 'bg-[#FCF8FA] text-[#64748B] border-[#F3DDE7] hover:bg-[#FCE7F3] hover:text-[#ED1760]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>ขาย (-)</span>
                </button>

                {/* 3. ชำรุด (เพิ่มใหม่) */}
                <button
                  type="button"
                  onClick={() => setAdjustType('damage')}
                  className={`py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-[12px] text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    adjustType === 'damage'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-[#FCF8FA] text-[#64748B] border-[#F3DDE7] hover:bg-amber-50 hover:text-amber-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>ชำรุด (-)</span>
                </button>
              </div>
            </div>

            {/* 3. Quantity & Pricing */}
            <div className={adjustType === 'decrease' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3' : ''}>
              {/* Quantity */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                  3. จำนวนเล่ม <span className="text-[#ED1760]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={!isAddition && selectedBook ? selectedBook.stock_quantity : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="เช่น 10"
                    className="w-full pl-3.5 pr-12 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm sm:text-base font-extrabold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-[#64748B] font-bold">
                    เล่ม
                  </div>
                </div>
              </div>

              {/* Price Per Unit (Shown when ขาย) */}
              {adjustType === 'decrease' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#111827] mb-1 sm:mb-1.5">
                    ราคาขาย (บาท/เล่ม)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={postalPrice}
                      onChange={(e) => setPostalPrice(e.target.value)}
                      placeholder={selectedBook ? String(selectedBook.price) : '0'}
                      className="w-full pl-8 pr-12 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm sm:text-base font-extrabold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-[#64748B] font-bold">
                      ฿
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-[#64748B] font-bold">
                      บาท
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Sales Calculation Banner (Shown when ขาย) */}
            {adjustType === 'decrease' && (
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#FCE7F3] to-[#FFF1F7] border border-[#F3DDE7] flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">
                  ยอดเงินรวม ({parsedQty} เล่ม × ฿{parsedPrice.toLocaleString('th-TH')})
                </span>
                <span className="text-xs sm:text-sm font-black text-[#ED1760]">
                  ฿{totalSaleAmount.toLocaleString('th-TH')} บาท
                </span>
              </div>
            )}

            {/* Postal Delivery Fields (Shown when ขาย) */}
            {adjustType === 'decrease' && (
              <div className="p-2.5 sm:p-3 rounded-xl border border-[#F3DDE7] bg-[#FCF8FA]/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                  <Truck className="w-3.5 h-3.5 text-[#ED1760]" />
                  <span>การจัดส่งไปรษณีย์ / พัสดุ (ระบุหากส่งพัสดุ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                      เลขไปรษณีย์ / เลขพัสดุ (Tracking No.)
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="เช่น ED123456789TH, Flash, Kerry"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#F3DDE7] bg-white text-xs font-bold text-[#111827] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                      ชื่อผู้รับ / ที่อยู่จัดส่ง (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="เช่น พระมหา... / คุณสมชาย"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#F3DDE7] bg-white text-xs text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Stock Preview */}
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
                        : adjustType === 'damage'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
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
                placeholder={
                  adjustType === 'in'
                    ? 'เช่น พิมพ์เพิ่มครั้งที่ 2, รับมอบจากโรงพิมพ์...'
                    : adjustType === 'damage'
                    ? 'เช่น ปกฉีกขาด, หน้ากระดาษไม่ครบ, เปียกน้ำ, ชำรุดระหว่างจัดเก็บ...'
                    : 'เช่น ขายหน้าร้าน, จำหน่ายงานสัปดาห์หนังสือ, สั่งซื้อพิเศษ...'
                }
                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || books.length === 0}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 text-white flex items-center justify-center gap-2 ${
                adjustType === 'damage'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : adjustType === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-[#ED1760] hover:bg-[#D41456] shadow-[#ED1760]/20'
              }`}
            >
              {adjustType === 'decrease' && trackingNumber.trim() ? (
                <Truck className="w-4 h-4" />
              ) : null}
              <span>
                {isSubmitting
                  ? 'กำลังบันทึกข้อมูล...'
                  : adjustType === 'in'
                  ? `ยืนยันรับเข้าสต๊อก (+${parsedQty} เล่ม)`
                  : adjustType === 'damage'
                  ? `ยืนยันบันทึกหนังสือชำรุด (-${parsedQty} เล่ม)`
                  : trackingNumber.trim()
                  ? `ยืนยันบันทึกการขายส่งไปรษณีย์ (-${parsedQty} เล่ม)`
                  : `ยืนยันการขายหนังสือ (-${parsedQty} เล่ม)`}
              </span>
            </button>
          </form>
          )}
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

            <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end flex-wrap">
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

              {/* Filter: All / In / Sale / Damage / Postal */}
              <div className="flex items-center bg-[#FCF8FA] p-0.5 sm:p-1 rounded-lg sm:rounded-[10px] border border-[#F3DDE7] text-[10px] sm:text-xs font-semibold flex-wrap">
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
                  ขาย (-)
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('damage')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer ${
                    historyFilterType === 'damage'
                      ? 'bg-white text-amber-600 shadow-2xs font-bold'
                      : 'text-[#64748B]'
                  }`}
                >
                  ชำรุด (-)
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('postal')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer ${
                    historyFilterType === 'postal'
                      ? 'bg-[#ED1760] text-white shadow-2xs font-black'
                      : 'text-[#ED1760] hover:bg-[#FCE7F3]'
                  }`}
                >
                  📮 ไปรษณีย์
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
              placeholder="ค้นหาตามชื่อหนังสือ, ผู้ทำรายการ, เลขพัสดุ..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg sm:rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
            />
          </div>

          {/* Transactions List */}
          <div className="space-y-2 sm:space-y-2.5 max-h-[460px] sm:max-h-[540px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-xs text-[#64748B]">
                ยังไม่มีข้อมูลประวัติการเคลื่อนไหวสต๊อก
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isTxIn = tx.transaction_type === 'in' || tx.transaction_type === 'increase';
                const isDamage =
                  tx.transaction_type === 'damage' ||
                  (tx.note && (tx.note.includes('ชำรุด') || tx.note.includes('เสียหาย')));
                const isPostal =
                  tx.sale_channel === 'postal' ||
                  Boolean(tx.tracking_number) ||
                  (tx.note && tx.note.includes('ส่งไปรษณีย์'));

                return (
                  <div
                    key={tx.id}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] hover:border-[#ED1760]/30 transition-all flex items-start justify-between gap-2.5 sm:gap-3 group"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPostal
                            ? 'bg-gradient-to-tr from-[#ED1760] to-[#FF6584] text-white shadow-2xs'
                            : isTxIn
                            ? 'bg-[#ECFDF5] text-[#10B981]'
                            : isDamage
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-[#FCE7F3] text-[#ED1760]'
                        }`}
                      >
                        {isPostal ? (
                          <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : isTxIn ? (
                          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : isDamage ? (
                          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#111827] truncate">
                            {tx.book_name}
                          </span>
                          {isPostal && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#FCE7F3] text-[#ED1760] text-[9px] font-black border border-[#F3DDE7]">
                              📮 ขายส่งไปรษณีย์
                            </span>
                          )}
                          {isDamage && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black border border-amber-200">
                              ⚠️ ชำรุด
                            </span>
                          )}
                          {!isPostal && !isDamage && !isTxIn && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 text-[9px] font-black border border-rose-200">
                              🛍️ ขาย
                            </span>
                          )}
                        </div>

                        {/* Tracking number badge & link */}
                        {tx.tracking_number && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#F3DDE7] text-[10px] font-mono font-bold text-[#ED1760] shadow-2xs">
                              <Truck className="w-2.5 h-2.5 text-[#ED1760]" />
                              <span>{tx.tracking_number}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => copyTracking(tx.tracking_number!, tx.id)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[#111827] text-[9px] font-semibold transition-colors cursor-pointer"
                              title="คัดลอกเลขพัสดุ"
                            >
                              {copiedTxId === tx.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="text-emerald-700">คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 text-[#64748B]" />
                                  <span>คัดลอก</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`https://track.thailandpost.co.th/?trackNumber=${encodeURIComponent(
                                tx.tracking_number
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#ED1760]/10 hover:bg-[#ED1760]/20 text-[#ED1760] text-[9px] font-bold transition-colors"
                              title="ตรวจสอบสถานะพัสดุไปรษณีย์ไทย"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>เช็คพัสดุ</span>
                            </a>
                          </div>
                        )}

                        {/* Customer & Price Info */}
                        {(tx.customer_name || tx.price !== undefined) && (
                          <div className="text-[10px] text-[#64748B] flex items-center gap-2 flex-wrap">
                            {tx.price !== undefined && (
                              <span className="text-emerald-700 font-bold">
                                ฿{tx.price.toLocaleString('th-TH')}/เล่ม
                                {tx.total_price && (
                                  <span className="text-[#111827]">
                                    {' '}
                                    (รวม ฿{tx.total_price.toLocaleString('th-TH')})
                                  </span>
                                )}
                              </span>
                            )}
                            {tx.customer_name && (
                              <span>ผู้รับ: <strong className="text-[#111827]">{tx.customer_name}</strong></span>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-[#64748B]">
                          {tx.note || (isTxIn ? 'รับเข้าสต๊อก' : isDamage ? 'หนังสือชำรุด' : 'ขายหนังสือ')}
                        </div>

                        <div className="text-[9px] sm:text-[10px] text-[#64748B]">
                          โดย: {tx.created_by} · {formatDateTime(tx.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full ${
                          isPostal
                            ? 'bg-[#FCE7F3] text-[#ED1760]'
                            : isTxIn
                            ? 'bg-[#ECFDF5] text-[#10B981]'
                            : isDamage
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
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
