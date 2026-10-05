import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  BookOpen,
  Calendar,
  Layers,
  Coins,
  FileText,
  Boxes,
  User,
  Barcode,
  Sparkles,
  Printer,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  PackageCheck,
  Flame,
  Award,
} from 'lucide-react';
import { Book, StockTransaction } from '../types';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';

interface BookDetailPageProps {
  book: Book;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickStockAdjust: () => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  book,
  onBack,
  onEdit,
  onDelete,
  onQuickStockAdjust,
}) => {
  const { canDeleteBook, canEditBook } = useAuth();

  const remainingValue = (book.stock_quantity || 0) * (book.price || 0);

  // Fetch stock transactions for this specific book
  const bookTransactions = useMemo(() => {
    const all = storageService.getTransactions();
    return all
      .filter((tx) => tx.book_id === book.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [book.id]);

  const formatBaht = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3.5 sm:space-y-8 pb-10 sm:pb-16">
      {/* Top Navigation & Quick Actions */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-[14px] bg-white border border-[#F3DDE7] text-[#111827] hover:text-[#ED1760] hover:bg-[#FCE7F3] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ED1760]" />
          <span>ย้อนกลับ</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] bg-white border border-[#F3DDE7] hover:bg-[#FCE7F3] text-[#111827] hover:text-[#ED1760] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
            title="พิมพ์รายงานข้อมูลหนังสือ"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#64748B]" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>

          <button
            onClick={onQuickStockAdjust}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#ED1760]/20 transition-all cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ปรับสต๊อก</span>
          </button>

          {canEditBook && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-[14px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white border border-[#F3DDE7] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>แก้ไข</span>
            </button>
          )}

          {canDeleteBook && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="ลบรายการหนังสือ"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Details Card (Left: Large Cover with Zoom, Right: Details) */}
      <div className="bg-white rounded-xl sm:rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* ด้านซ้าย: รูปปกหนังสือขนาดใหญ่ พร้อม Hover Zoom */}
          <div className="md:col-span-5 bg-gradient-to-b from-rose-50/40 via-pink-50/20 to-white p-3.5 sm:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-rose-100/80">
            <div className="relative group max-w-[170px] sm:max-w-[280px] w-full overflow-hidden rounded-xl sm:rounded-3xl p-1">
              <img
                src={book.cover_image}
                alt={book.book_name}
                className="w-full h-auto rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80 object-contain max-h-[240px] sm:max-h-[440px] transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
                }}
              />
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <StockBadge quantity={book.stock_quantity} size="sm" />
              </div>
            </div>

            <div className="mt-2.5 sm:mt-5 text-center space-y-1 sm:space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 font-mono bg-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <Barcode className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                <span>ISBN: {book.isbn || 'ไม่มีระบุ'}</span>
              </span>
              <div className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                รหัสสิ่งพิมพ์: {book.id}
              </div>
            </div>
          </div>

          {/* ด้านขวา: ข้อมูลหนังสือครบถ้วน */}
          <div className="md:col-span-7 p-3.5 sm:p-10 flex flex-col justify-between space-y-3.5 sm:space-y-6">
            <div className="space-y-3 sm:space-y-5">
              {/* Category & Badge */}
              <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/70">
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>{book.category || 'สิ่งพิมพ์วิชาการ มจร'}</span>
                  </span>
                  {(book.is_bestseller || (book.sales_count && book.sales_count >= 500)) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-[#ED1760] text-white shadow-xs">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>ขายดี (Best Seller)</span>
                    </span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <StockBadge quantity={book.stock_quantity} size="md" />
                </div>
              </div>

              {/* ชื่อหนังสือตัวใหญ่ ชัดเจน */}
              <h1 className="text-lg sm:text-3xl font-black text-slate-900 leading-snug sm:leading-tight">
                {book.book_name}
              </h1>

              {/* ผู้แต่ง */}
              <div className="flex items-center gap-2 text-xs sm:text-base text-slate-700">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span>ผู้แต่ง: <strong className="text-slate-900">{book.author}</strong></span>
              </div>

              {/* Description if any */}
              {book.description && (
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {book.description}
                </div>
              )}

              {/* Price & Stock Highlight Card */}
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-3xl bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-amber-50/30 border border-rose-100 flex items-center justify-between flex-wrap gap-2.5 sm:gap-4">
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ราคาต่อเล่ม
                  </div>
                  <div className="text-lg sm:text-3xl font-black text-rose-800 mt-0.5">
                    {formatBaht(book.price)}
                  </div>
                </div>

                <div className="h-8 sm:h-10 w-px bg-rose-200/60" />

                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    สต๊อกปัจจุบัน
                  </div>
                  <div className="text-lg sm:text-3xl font-black text-slate-900 mt-0.5">
                    {book.stock_quantity} <span className="text-xs sm:text-sm font-medium text-slate-500">เล่ม</span>
                  </div>
                </div>

                <div className="h-8 sm:h-10 w-px bg-rose-200/60 hidden sm:block" />

                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    มูลค่าคงคลัง
                  </div>
                  <div className="text-base sm:text-2xl font-black text-emerald-800 mt-0.5">
                    {formatBaht(remainingValue)}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-0.5 sm:pt-1">
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>จำนวนหน้า</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-slate-800 mt-0.5 sm:mt-1">
                    {book.pages} หน้า
                  </div>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>ปีที่พิมพ์</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-slate-800 mt-0.5 sm:mt-1">
                    พ.ศ. {book.published_year}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ED1760]" />
                    <span>ยอดขายสะสม</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-[#ED1760] mt-0.5 sm:mt-1">
                    {book.sales_count ? `${book.sales_count.toLocaleString()} เล่ม` : 'บันทึกใหม่'}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>สถานะ</span>
                  </div>
                  <div className="mt-0.5 sm:mt-1">
                    <StockBadge quantity={book.stock_quantity} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Footer */}
            <div className="pt-3 sm:pt-4 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-1.5 sm:gap-2">
              <span>ลงทะเบียน: {new Date(book.created_at).toLocaleDateString('th-TH')}</span>
              <span>บันทึกโดย: <strong className="text-slate-600">{book.created_by}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock History Log Sub-Card (Section 11 requirement) */}
      <div className="bg-white rounded-xl sm:rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-3.5 sm:p-8 space-y-3 sm:space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs flex-shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-lg font-black text-slate-900 tracking-tight">
                ประวัติการเคลื่อนไหวสต๊อกของเล่มนี้
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                รายการบันทึกการรับเข้า ปรับลด และการเบิกจ่าย
              </p>
            </div>
          </div>

          <button
            onClick={onQuickStockAdjust}
            className="text-xs font-bold text-rose-800 hover:text-rose-900 hover:underline cursor-pointer flex-shrink-0"
          >
            + บันทึกรายการใหม่
          </button>
        </div>

        {bookTransactions.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              ยังไม่มีประวัติการทำรายการรับเข้าหรือเบิกออกเพิ่มเติม
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
              มีเพียงยอดสต๊อกตั้งต้นที่ลงทะเบียนไว้ {book.stock_quantity} เล่ม
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] sm:text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">วัน-เวลา</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">ประเภทรายการ</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">จำนวน</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">ก่อนปรับ</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">หลังปรับ</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3">หมายเหตุ / อ้างอิง</th>
                  <th className="px-2.5 sm:px-4 py-2 sm:py-3 text-right">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookTransactions.map((tx) => {
                  const isIn = tx.transaction_type === 'in' || tx.transaction_type === 'increase';
                  return (
                    <tr key={tx.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 text-slate-600 whitespace-nowrap text-xs">
                        {new Date(tx.created_at).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                            isIn
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isIn ? (
                            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                          )}
                          <span>{isIn ? 'รับเข้า (+)' : 'เบิกออก (-)'}</span>
                        </span>
                      </td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 font-extrabold text-slate-900 text-xs sm:text-sm">
                        {isIn ? `+${tx.quantity}` : `-${tx.quantity}`} เล่ม
                      </td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 text-slate-500 text-xs">{tx.stock_before}</td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 font-bold text-slate-900 text-xs">{tx.stock_after}</td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 text-slate-600 max-w-xs truncate text-xs">
                        {tx.note || '-'}
                      </td>
                      <td className="px-2.5 sm:px-4 py-2 sm:py-3 text-right text-slate-500 font-medium whitespace-nowrap text-xs">
                        {tx.created_by}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
