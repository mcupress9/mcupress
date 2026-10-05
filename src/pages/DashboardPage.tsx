import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Boxes,
  Coins,
  AlertTriangle,
  XCircle,
  Plus,
  ChevronRight,
  Calendar,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Book, SummaryStats } from '../types';
import { StockBadge } from '../components/StockBadge';

interface DashboardPageProps {
  books: Book[];
  stats: SummaryStats;
  onNavigateToBooks: () => void;
  onNavigateToAddBook: () => void;
  onNavigateToStock: () => void;
  onSelectBook: (book: Book) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  books,
  stats,
  onNavigateToBooks,
  onNavigateToAddBook,
  onNavigateToStock,
  onSelectBook,
}) => {
  // 4. Low stock books (<= 10 and > 0)
  const lowStockBooks = useMemo(() => {
    return books.filter((b) => b.stock_quantity > 0 && b.stock_quantity <= 10);
  }, [books]);

  // 5. Out of stock books (= 0)
  const outOfStockBooks = useMemo(() => {
    return books.filter((b) => b.stock_quantity === 0);
  }, [books]);

  // 5.5. Bestseller books (is_bestseller === true or top sales)
  const bestsellerBooks = useMemo(() => {
    return [...books]
      .filter((b) => b.is_bestseller || (b.sales_count && b.sales_count >= 500))
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
  }, [books]);

  // 6. Recently added books (sorted by created_at)
  const recentBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [books]);

  // 7. Yearly breakdown of books, stock count and stock values
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [yearSearchQuery, setYearSearchQuery] = useState<string>('');
  const [yearViewMode, setYearViewMode] = useState<'table' | 'cards'>('table');
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  const toggleYearExpand = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: prev[year] === undefined ? true : !prev[year],
    }));
  };

  const yearlyBreakdown = useMemo(() => {
    const map: Record<number, Book[]> = {};
    books.forEach((b) => {
      const yr = b.published_year || 2567;
      if (!map[yr]) map[yr] = [];
      map[yr].push(b);
    });

    const sortedYears = Object.keys(map)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedYears.map((year) => {
      const yearBooks = map[year];
      let totalCopies = 0;
      let totalValue = 0;
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      yearBooks.forEach((b) => {
        const q = Number(b.stock_quantity) || 0;
        const p = Number(b.price) || 0;
        totalCopies += q;
        totalValue += q * p;
        if (q === 0) outOfStock++;
        else if (q <= 10) lowStock++;
        else inStock++;
      });

      return {
        year,
        yearLabel: `พ.ศ. ${year}`,
        titlesCount: yearBooks.length,
        totalCopies,
        totalValue,
        inStock,
        lowStock,
        outOfStock,
        books: yearBooks,
      };
    });
  }, [books]);

  // Filtered books within the selected year
  const activeYearData = useMemo(() => {
    if (selectedYearFilter === 'all') return null;
    const yrNum = Number(selectedYearFilter);
    return yearlyBreakdown.find((y) => y.year === yrNum) || null;
  }, [selectedYearFilter, yearlyBreakdown]);

  const formatBaht = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  return (
    <div className="space-y-3 sm:space-y-8 pb-8 sm:pb-12">
      {/* 7. HERO DASHBOARD (MCU Esports Style) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FCE7F3] via-[#FFF1F7] to-[#FCF8FA] p-3 sm:p-8 rounded-xl sm:rounded-[24px] border border-[#F3DDE7] shadow-[0_4px_20px_rgba(237,23,96,0.04)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-2xl font-bold text-[#111827]">สวัสดี 👋</span>
              <span className="inline-flex items-center px-1.5 sm:px-3 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-white text-[#ED1760] border border-[#F3DDE7] shadow-2xs">
                MCU Press Inventory
              </span>
            </div>
            <h2 className="text-base sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
              ภาพรวมสต๊อกหนังสือของสำนักพิมพ์
            </h2>
            <p className="text-[11px] sm:text-sm text-[#64748B] max-w-2xl leading-relaxed whitespace-pre-line hidden sm:block">
              สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย{'\n'}
              ติดตามยอดคงเหลือ มูลค่าคลังสิ่งพิมพ์ และสถิติวิชาการแบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
            <button
              onClick={onNavigateToAddBook}
              className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#ED1760]/25 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>เพิ่มหนังสือใหม่</span>
            </button>
            <button
              onClick={onNavigateToStock}
              className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-[14px] bg-white hover:bg-[#FCE7F3] text-[#111827] hover:text-[#ED1760] font-bold text-xs sm:text-sm border border-[#F3DDE7] shadow-2xs transition-all duration-150 cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ED1760]" />
              <span>จัดการสต๊อก</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. STATISTICS CARDS (2 cols on mobile, 4 cols on lg/xl) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
        {/* Card 1: หนังสือทั้งหมด */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-1 sm:mb-3">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#A7F3D0] truncate">
              พร้อมบริการ
            </span>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#64748B]">หนังสือทั้งหมด</div>
            <div className="text-lg sm:text-3xl font-extrabold text-[#111827] tabular-nums tracking-tight mt-0.5 sm:mt-1">
              {formatNumber(stats.totalTitles)}
            </div>
          </div>
          <div className="mt-1 sm:mt-3 pt-1 sm:pt-2.5 border-t border-[#F3DDE7]/50 text-[9px] sm:text-xs font-bold text-[#ED1760]">
            จำนวนชื่อเรื่อง
          </div>
        </div>

        {/* Card 2: มูลค่าสต๊อก */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-1 sm:mb-3">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center flex-shrink-0">
              <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-[#ED1760] bg-[#FCE7F3] px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#F3DDE7]">
              ราคาปก
            </span>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#64748B]">มูลค่าสต๊อก</div>
            <div className="text-base sm:text-2xl xl:text-[26px] font-extrabold text-[#111827] tabular-nums tracking-tight truncate mt-0.5 sm:mt-1" title={formatBaht(stats.totalStockValue)}>
              {formatBaht(stats.totalStockValue)}
            </div>
          </div>
          <div className="mt-1 sm:mt-3 pt-1 sm:pt-2.5 border-t border-[#F3DDE7]/50 text-[9px] sm:text-xs font-bold text-[#ED1760]">
            มูลค่าคลังสิ่งพิมพ์
          </div>
        </div>

        {/* Card 3: ใกล้หมดสต๊อก */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-1 sm:mb-3">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-full bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#FDE68A]">
              1-10 เล่ม
            </span>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#64748B]">ใกล้หมดสต๊อก</div>
            <div className="text-lg sm:text-3xl font-extrabold text-[#F59E0B] tabular-nums tracking-tight mt-0.5 sm:mt-1">
              {formatNumber(stats.lowStockTitles)}
            </div>
          </div>
          <div className="mt-1 sm:mt-3 pt-1 sm:pt-2.5 border-t border-[#F3DDE7]/50 text-[9px] sm:text-xs font-bold text-[#F59E0B]">
            รายการเฝ้าระวัง
          </div>
        </div>

        {/* Card 4: หมดสต๊อก */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-1 sm:mb-3">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center flex-shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span className={`text-[9px] sm:text-[11px] font-semibold px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full border ${
              stats.outOfStockTitles > 0
                ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                : 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]'
            }`}>
              {stats.outOfStockTitles > 0 ? 'สินค้าหมด' : 'ปกติ'}
            </span>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#64748B]">หมดสต๊อก</div>
            <div className={`text-lg sm:text-3xl font-extrabold tabular-nums tracking-tight mt-0.5 sm:mt-1 ${
              stats.outOfStockTitles > 0 ? 'text-[#EF4444]' : 'text-[#111827]'
            }`}>
              {formatNumber(stats.outOfStockTitles)}
            </div>
          </div>
          <div className="mt-1 sm:mt-3 pt-1 sm:pt-2.5 border-t border-[#F3DDE7]/50 text-[9px] sm:text-xs font-bold text-[#EF4444]">
            รายการสินค้าหมด
          </div>
        </div>
      </div>

      {/* 10. STOCK STATUS OVERVIEW (สัดส่วนสถานะสต๊อกหนังสือ - ปรับให้กะทัดรัด ประหยัดพื้นที่) */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-[18px] border border-[#F3DDE7] shadow-[0_2px_12px_rgba(237,23,96,0.03)] space-y-2 sm:space-y-3">
        {/* Compact Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-[#ECFDF5] rounded-md sm:rounded-[8px] text-[#10B981]">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#111827] leading-none">
                สถานะสต๊อกหนังสือ
              </h3>
              <p className="text-[9px] sm:text-xs text-[#64748B] mt-0.5">
                สัดส่วนสต๊อกสิ่งพิมพ์ (มีสินค้า, ใกล้หมด, หมดสต๊อก)
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-[#64748B] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
            รวม {formatNumber(stats.totalTitles)} ชื่อเรื่อง
          </span>
        </div>

        {/* Proportional Segmented Progress Bar */}
        {stats.totalTitles > 0 ? (
          <div className="w-full h-2 sm:h-2.5 rounded-full overflow-hidden bg-slate-100 flex shadow-inner">
            <div
              style={{ width: `${(stats.inStockTitles / stats.totalTitles) * 100}%` }}
              className="bg-[#10B981] transition-all duration-300"
              title={`มีสินค้า: ${stats.inStockTitles} เรื่อง`}
            />
            <div
              style={{ width: `${(stats.lowStockTitles / stats.totalTitles) * 100}%` }}
              className="bg-[#F59E0B] transition-all duration-300"
              title={`ใกล้หมด: ${stats.lowStockTitles} เรื่อง`}
            />
            <div
              style={{ width: `${(stats.outOfStockTitles / stats.totalTitles) * 100}%` }}
              className="bg-[#EF4444] transition-all duration-300"
              title={`หมดสต๊อก: ${stats.outOfStockTitles} เรื่อง`}
            />
          </div>
        ) : (
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100" />
        )}

        {/* 3 Status Badges / Cards in a single compact 3-column row */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {/* In stock */}
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-0.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-emerald-900 truncate">
                มีสินค้า
              </span>
            </div>
            <div className="text-xs sm:text-base font-black text-emerald-700 tabular-nums">
              {formatNumber(stats.inStockTitles)}{' '}
              <span className="text-[9px] sm:text-xs font-normal text-emerald-600">เรื่อง</span>
            </div>
          </div>

          {/* Low stock */}
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-0.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-900 truncate">
                ใกล้หมด
              </span>
            </div>
            <div className="text-xs sm:text-base font-black text-amber-700 tabular-nums">
              {formatNumber(stats.lowStockTitles)}{' '}
              <span className="text-[9px] sm:text-xs font-normal text-amber-600">เรื่อง</span>
            </div>
          </div>

          {/* Out of stock */}
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-50/70 border border-rose-100 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-0.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-rose-900 truncate">
                หมดสต๊อก
              </span>
            </div>
            <div className="text-xs sm:text-base font-black text-rose-700 tabular-nums">
              {formatNumber(stats.outOfStockTitles)}{' '}
              <span className="text-[9px] sm:text-xs font-normal text-rose-600">เรื่อง</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10. BESTSELLER BOOKS SHOWCASE (หนังสือขายดีประจำสำนักพิมพ์ มจร) */}
      <div className="bg-gradient-to-br from-white via-[#FFF7FA] to-[#FCE7F3]/30 rounded-xl sm:rounded-[22px] border border-[#F3DDE7] shadow-[0_4px_20px_rgba(237,23,96,0.04)] p-3 sm:p-7 space-y-2.5 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-4 border-b border-[#F3DDE7]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-[14px] bg-gradient-to-tr from-[#ED1760] to-[#FF6584] text-white flex items-center justify-center shadow-md shadow-[#ED1760]/25 flex-shrink-0">
              <Flame className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-xl font-extrabold text-[#111827] tracking-tight">
                  หนังสือขายดี (Best Sellers)
                </h3>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-[#ED1760] text-white shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>ยอดจำหน่ายสูงสุด</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5 hidden sm:block">
                ผลงานวิชาการและคัมภีร์ที่มีความต้องการสูง คัดเลือกจากยอดจำหน่ายและการสั่งซื้อ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToBooks}
            className="inline-flex items-center gap-1 px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-[12px] bg-white hover:bg-[#FCE7F3] text-[#ED1760] font-bold text-[11px] sm:text-xs border border-[#F3DDE7] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <span>ดูทั้งหมด</span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {bestsellerBooks.length === 0 ? (
          <div className="p-4 sm:p-8 text-center bg-white rounded-xl sm:rounded-[16px] border border-[#F3DDE7] text-xs text-[#64748B]">
            ยังไม่มีหนังสือที่กำหนดเป็นหนังสือขายดี ท่านสามารถแก้ไขหรือเพิ่มหนังสือและทำเครื่องหมาย &quot;หนังสือขายดี&quot; ได้
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5">
            {bestsellerBooks.slice(0, 4).map((book, idx) => (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="bg-white rounded-xl sm:rounded-[18px] border border-[#F3DDE7] hover:border-[#ED1760]/50 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer relative"
              >
                {/* Ranking Tag */}
                <div className="absolute top-1 sm:top-2.5 left-1 sm:left-2.5 z-10 flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2.5 py-0.2 sm:py-1 rounded-sm sm:rounded-[10px] bg-gradient-to-r from-amber-500 to-[#ED1760] text-white text-[8px] sm:text-[11px] font-black shadow-md">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>อันดับ {idx + 1}</span>
                </div>

                {/* Bestseller Badge Right */}
                <div className="absolute top-1 sm:top-2.5 right-1 sm:right-2.5 z-10">
                  <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-[4px] sm:rounded-[8px] bg-white/95 backdrop-blur-xs text-[#ED1760] text-[8px] sm:text-[10px] font-extrabold shadow-sm border border-[#F3DDE7]">
                    <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#ED1760]" />
                    <span>ขายดี</span>
                  </span>
                </div>

                {/* Cover Image */}
                <div className="aspect-[3/4] w-full bg-slate-100 overflow-hidden relative">
                  <img
                    src={book.cover_image}
                    alt={book.book_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-1 left-1 right-1 sm:bottom-1.5 sm:left-1.5 sm:right-1.5 flex items-center justify-between text-white text-[8px] sm:text-[10px] font-bold">
                    <span className="bg-black/60 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-[4px] backdrop-blur-xs">
                      พ.ศ. {book.published_year}
                    </span>
                    {book.sales_count && (
                      <span className="bg-[#ED1760] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-[4px] shadow-xs truncate max-w-[80px] sm:max-w-[100px]">
                        ขาย {formatNumber(book.sales_count)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-1.5 py-0.2 rounded-sm sm:rounded-[6px] truncate block max-w-max">
                      {book.category || 'สิ่งพิมพ์วิชาการ'}
                    </span>
                    <h4
                      className="text-[11px] sm:text-sm font-extrabold text-[#111827] group-hover:text-[#ED1760] line-clamp-2 mt-1 sm:mt-2 leading-snug transition-colors"
                      title={book.book_name}
                    >
                      {book.book_name}
                    </h4>
                    <p className="text-[9px] sm:text-[11px] text-[#64748B] line-clamp-1 mt-0.2 sm:mt-1">
                      {book.author}
                    </p>
                  </div>

                  <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-[#F3DDE7]/60 flex items-center justify-between gap-1">
                    <div>
                      <div className="text-[8px] sm:text-[10px] text-[#64748B]">คงเหลือ</div>
                      <div className="text-[10px] sm:text-xs font-black text-[#111827]">
                        {book.stock_quantity}{' '}
                        <span className="text-[8px] sm:text-[10px] font-normal text-[#64748B]">เล่ม</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] sm:text-[10px] text-[#64748B]">ราคา</div>
                      <div className="text-[11px] sm:text-sm font-black text-[#ED1760]">
                        {formatBaht(book.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10.5. YEARLY BOOK & STOCK EXPLORER (หนังสือและสต๊อกแยกตามปีที่พิมพ์) */}
      <div className="bg-white rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] overflow-hidden">
        {/* Section Header */}
        <div className="p-3 sm:p-6 border-b border-[#F3DDE7]/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-[14px] bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7] shadow-2xs flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-extrabold text-[#111827]">
                  หนังสือและสต๊อกแยกตามปีที่พิมพ์
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
                  {yearlyBreakdown.length} ปีที่เผยแพร่
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5 hidden sm:block">
                ตรวจสอบรายชื่อหนังสือ ยอดคงเหลือในสต๊อก และมูลค่าสต๊อกของแต่ละปีที่พิมพ์อย่างละเอียด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Search within yearly books */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={yearSearchQuery}
                onChange={(e) => setYearSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหนังสือ..."
                className="pl-8 pr-3 py-1.5 rounded-[10px] sm:rounded-[12px] bg-[#FCF8FA] border border-[#F3DDE7] text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:border-[#ED1760] focus:ring-1 focus:ring-[#ED1760] transition-colors w-full md:w-48 lg:w-56"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#FCF8FA] p-0.5 sm:p-1 rounded-[10px] sm:rounded-[12px] border border-[#F3DDE7]">
              <button
                type="button"
                onClick={() => setYearViewMode('table')}
                className={`p-1.5 rounded-[6px] sm:rounded-[8px] transition-colors cursor-pointer ${
                  yearViewMode === 'table'
                    ? 'bg-[#ED1760] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
                title="มุมมองตาราง"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setYearViewMode('cards')}
                className={`p-1.5 rounded-[6px] sm:rounded-[8px] transition-colors cursor-pointer ${
                  yearViewMode === 'cards'
                    ? 'bg-[#ED1760] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
                title="มุมมองการ์ด"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Year Filter Pills */}
        <div className="px-2.5 sm:px-6 py-2 sm:py-3.5 bg-[#FCF8FA]/70 border-b border-[#F3DDE7]/50 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] sm:text-xs font-bold text-[#64748B] flex-shrink-0 mr-0.5 sm:mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>ปี:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedYearFilter('all')}
            className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-lg sm:rounded-[12px] text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 sm:gap-1.5 ${
              selectedYearFilter === 'all'
                ? 'bg-[#ED1760] text-white shadow-sm shadow-[#ED1760]/20'
                : 'bg-white text-[#64748B] hover:text-[#ED1760] border border-[#F3DDE7]'
            }`}
          >
            <span>ทั้งหมด</span>
            <span
              className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold ${
                selectedYearFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FCE7F3] text-[#ED1760]'
              }`}
            >
              {books.length} เล่ม
            </span>
          </button>

          {yearlyBreakdown.map((item) => (
            <button
              key={item.year}
              type="button"
              onClick={() => setSelectedYearFilter(item.year.toString())}
              className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-lg sm:rounded-[12px] text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 sm:gap-1.5 ${
                selectedYearFilter === item.year.toString()
                  ? 'bg-[#ED1760] text-white shadow-sm shadow-[#ED1760]/20'
                  : 'bg-white text-[#64748B] hover:text-[#ED1760] border border-[#F3DDE7]'
              }`}
            >
              <span>{item.yearLabel}</span>
              <span
                className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold ${
                  selectedYearFilter === item.year.toString()
                    ? 'bg-white/20 text-white'
                    : 'bg-[#FCE7F3] text-[#ED1760]'
                }`}
              >
                {item.titlesCount}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area 1: Specific Year Selected */}
        {activeYearData ? (
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-6">
            {/* Year KPI Metric Highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="p-2 sm:p-4 rounded-xl sm:rounded-[16px] bg-[#FCF8FA] border border-[#F3DDE7]">
                <div className="flex items-center gap-1 sm:gap-2 text-[#ED1760] text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">จำนวนชื่อเรื่อง</span>
                </div>
                <div className="text-base sm:text-2xl font-black text-[#111827] tabular-nums">
                  {activeYearData.titlesCount} <span className="text-[9px] sm:text-xs font-normal text-[#64748B]">ชื่อเรื่อง</span>
                </div>
                <div className="text-[9px] sm:text-[11px] text-[#64748B] mt-0.2 sm:mt-1 truncate">
                  {((activeYearData.titlesCount / (books.length || 1)) * 100).toFixed(0)}% ของทั้งคลัง
                </div>
              </div>

              <div className="p-2 sm:p-4 rounded-xl sm:rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0]">
                <div className="flex items-center gap-1 sm:gap-2 text-[#10B981] text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                  <Boxes className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">คงเหลือในคลัง</span>
                </div>
                <div className="text-base sm:text-2xl font-black text-[#065F46] tabular-nums">
                  {formatNumber(activeYearData.totalCopies)} <span className="text-[9px] sm:text-xs font-normal text-[#047857]">เล่ม</span>
                </div>
                <div className="text-[9px] sm:text-[11px] text-[#047857] mt-0.2 sm:mt-1 truncate">
                  สต๊อกพิมพ์ปี {activeYearData.year}
                </div>
              </div>

              <div className="p-2 sm:p-4 rounded-xl sm:rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A]">
                <div className="flex items-center gap-1 sm:gap-2 text-[#D97706] text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">มูลค่าสต๊อก</span>
                </div>
                <div className="text-sm sm:text-2xl font-black text-[#92400E] tabular-nums truncate">
                  {formatBaht(activeYearData.totalValue)}
                </div>
                <div className="text-[9px] sm:text-[11px] text-[#B45309] mt-0.2 sm:mt-1 truncate">
                  ตามราคาปกคงเหลือ
                </div>
              </div>

              <div className="p-2 sm:p-4 rounded-xl sm:rounded-[16px] bg-white border border-[#F3DDE7] flex flex-col justify-between">
                <div className="text-[9px] sm:text-xs font-bold text-[#64748B] mb-0.5 sm:mb-1">
                  สถานะสต๊อก
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-[9px] sm:text-xs">
                  <span className="px-1 sm:px-2 py-0.2 rounded-full bg-[#ECFDF5] text-[#10B981] font-bold text-[8px] sm:text-[11px]">
                    มี: {activeYearData.inStock}
                  </span>
                  <span className="px-1 sm:px-2 py-0.2 rounded-full bg-[#FFFBEB] text-[#F59E0B] font-bold text-[8px] sm:text-[11px]">
                    ใกล้หมด: {activeYearData.lowStock}
                  </span>
                  <span className="px-1 sm:px-2 py-0.2 rounded-full bg-[#FEF2F2] text-[#EF4444] font-bold text-[8px] sm:text-[11px]">
                    หมด: {activeYearData.outOfStock}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Books for this specific year */}
            {(() => {
              const q = yearSearchQuery.trim().toLowerCase();
              const displayedYearBooks = activeYearData.books.filter(
                (b) =>
                  !q ||
                  b.book_name.toLowerCase().includes(q) ||
                  b.author.toLowerCase().includes(q) ||
                  (b.isbn && b.isbn.toLowerCase().includes(q))
              );

              if (displayedYearBooks.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-[#64748B] bg-[#FCF8FA] rounded-[16px] border border-[#F3DDE7]">
                    ไม่พบหนังสือที่ตรงกับคำค้นหาในรอบปี {activeYearData.yearLabel}
                  </div>
                );
              }

              if (yearViewMode === 'table') {
                return (
                  <div className="border border-[#F3DDE7] rounded-[16px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#FCF8FA] text-xs text-[#64748B] font-bold border-b border-[#F3DDE7]">
                          <tr>
                            <th className="px-5 py-3 w-14">ปก</th>
                            <th className="px-5 py-3">ชื่อหนังสือ / ผู้แต่ง</th>
                            <th className="px-5 py-3">หมวดหมู่</th>
                            <th className="px-5 py-3">ISBN</th>
                            <th className="px-5 py-3">ราคาปก</th>
                            <th className="px-5 py-3 text-center">คงเหลือในสต๊อก</th>
                            <th className="px-5 py-3">มูลค่าสต๊อก</th>
                            <th className="px-5 py-3 text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3DDE7]/50">
                          {displayedYearBooks.map((book) => {
                            const lineValue = (book.stock_quantity || 0) * (book.price || 0);
                            return (
                              <tr key={book.id} className="hover:bg-[#FCE7F3]/15 transition-colors">
                                <td className="px-5 py-3">
                                  <div
                                    onClick={() => onSelectBook(book)}
                                    className="w-10 h-14 rounded-md overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-2xs cursor-pointer hover:shadow-md transition-shadow"
                                    title={book.book_name}
                                  >
                                    <img
                                      src={book.cover_image}
                                      alt={book.book_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-5 py-3 font-bold text-[#111827] max-w-sm">
                                  <button
                                    onClick={() => onSelectBook(book)}
                                    className="text-left line-clamp-1 hover:text-[#ED1760] transition-colors cursor-pointer"
                                  >
                                    {book.book_name}
                                  </button>
                                  <div className="text-[11px] font-normal text-[#64748B] mt-0.5">
                                    {book.author}
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-xs text-[#111827]">
                                  <span className="bg-[#FCF8FA] px-2 py-0.5 rounded-[6px] border border-[#F3DDE7] text-[11px]">
                                    {book.category || 'ทั่วไป'}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-[#64748B] font-mono">
                                  {book.isbn || '-'}
                                </td>
                                <td className="px-5 py-3 font-semibold text-[#111827] tabular-nums">
                                  {formatBaht(book.price)}
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className="text-sm font-black text-[#111827] tabular-nums">
                                      {book.stock_quantity} <span className="text-xs font-normal text-[#64748B]">เล่ม</span>
                                    </span>
                                    <StockBadge quantity={book.stock_quantity} size="sm" />
                                  </div>
                                </td>
                                <td className="px-5 py-3 font-bold text-[#ED1760] tabular-nums">
                                  {formatBaht(lineValue)}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    onClick={() => onSelectBook(book)}
                                    className="text-xs font-bold text-[#ED1760] hover:text-white bg-[#FCE7F3] hover:bg-[#ED1760] px-3 py-1.5 rounded-[10px] border border-[#F3DDE7] transition-all cursor-pointer shadow-2xs"
                                  >
                                    ดูรายละเอียด
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Card View
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedYearBooks.map((book) => {
                    const lineValue = (book.stock_quantity || 0) * (book.price || 0);
                    return (
                      <div
                        key={book.id}
                        className="p-4 rounded-[16px] border border-[#F3DDE7] hover:border-[#ED1760]/40 bg-white hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex gap-3">
                          <div
                            onClick={() => onSelectBook(book)}
                            className="w-16 h-22 rounded-lg overflow-hidden bg-slate-100 border border-[#F3DDE7] flex-shrink-0 cursor-pointer shadow-2xs"
                          >
                            <img
                              src={book.cover_image}
                              alt={book.book_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-md">
                              {book.category || 'ทั่วไป'}
                            </span>
                            <h4
                              onClick={() => onSelectBook(book)}
                              className="text-xs font-bold text-[#111827] line-clamp-2 mt-1 hover:text-[#ED1760] cursor-pointer"
                            >
                              {book.book_name}
                            </h4>
                            <p className="text-[11px] text-[#64748B] truncate mt-0.5">{book.author}</p>
                            <p className="text-xs font-bold text-[#ED1760] mt-1">{formatBaht(book.price)}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#F3DDE7]/60 mt-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#64748B] block">สต๊อกคงเหลือ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-[#111827]">{book.stock_quantity} เล่ม</span>
                              <StockBadge quantity={book.stock_quantity} size="sm" showIcon={false} />
                            </div>
                            <span className="text-[10px] text-[#ED1760] font-bold block mt-0.5">
                              มูลค่า: {formatBaht(lineValue)}
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectBook(book)}
                            className="p-2 rounded-[10px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white transition-colors cursor-pointer"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Subtotal Footer */}
            <div className="p-4 rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#111827]">
                สรุปยอดรวมเฉพาะปี {activeYearData.yearLabel}:
              </span>
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <span>
                  จำนวนชื่อเรื่อง: <strong className="text-[#111827]">{activeYearData.titlesCount} เรื่อง</strong>
                </span>
                <span>
                  ยอดคงเหลือรวม: <strong className="text-[#10B981] font-black">{formatNumber(activeYearData.totalCopies)} เล่ม</strong>
                </span>
                <span>
                  มูลค่าสต๊อกรวม: <strong className="text-[#ED1760] font-black">{formatBaht(activeYearData.totalValue)}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Content Area 2: All Years Deck */
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-5">
              {yearlyBreakdown.map((item) => {
                const isExpanded = expandedYears[item.year] !== false; // default expanded
                return (
                  <div
                    key={item.year}
                    className="rounded-[18px] border border-[#F3DDE7] bg-white overflow-hidden shadow-2xs hover:shadow-sm transition-shadow"
                  >
                    {/* Year Card Header */}
                    <div className="p-5 bg-gradient-to-r from-[#FCF8FA] via-white to-[#FCE7F3]/20 border-b border-[#F3DDE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-[12px] bg-[#ED1760] text-white font-black text-sm shadow-xs shadow-[#ED1760]/20">
                          {item.yearLabel}
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#111827]">
                            หนังสือที่พิมพ์ปี {item.year}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 flex-wrap">
                            <span>มีสินค้า <strong>{item.inStock}</strong></span>
                            <span>·</span>
                            <span>ใกล้หมด <strong>{item.lowStock}</strong></span>
                            <span>·</span>
                            <span>หมดสต๊อก <strong>{item.outOfStock}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-[#64748B]">
                            สต๊อกรวม: <strong className="text-[#10B981] font-black text-sm tabular-nums">{formatNumber(item.totalCopies)}</strong> เล่ม
                          </div>
                          <div className="text-xs font-bold text-[#ED1760] tabular-nums">
                            มูลค่า: {formatBaht(item.totalValue)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedYearFilter(item.year.toString())}
                          className="px-3 py-1.5 rounded-[10px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white text-xs font-bold transition-colors cursor-pointer border border-[#F3DDE7]"
                        >
                          เจาะลึกปีนี้
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleYearExpand(item.year)}
                          className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#111827] hover:bg-[#FCF8FA] transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Books preview within this year */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.books.map((book) => {
                            const lineValue = (book.stock_quantity || 0) * (book.price || 0);
                            return (
                              <div
                                key={book.id}
                                onClick={() => onSelectBook(book)}
                                className="p-3 rounded-[14px] bg-[#FCF8FA] border border-[#F3DDE7] hover:border-[#ED1760]/40 hover:bg-[#FCE7F3]/10 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-200 border border-[#F3DDE7] flex-shrink-0">
                                    <img
                                      src={book.cover_image}
                                      alt={book.book_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-[#111827] truncate group-hover:text-[#ED1760] transition-colors">
                                      {book.book_name}
                                    </h5>
                                    <p className="text-[10px] text-[#64748B] truncate mt-0.5">{book.author}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-[11px] font-bold text-[#ED1760]">
                                        {formatBaht(book.price)}
                                      </span>
                                      <span className="text-[10px] text-[#64748B]">·</span>
                                      <span className="text-[10px] text-[#64748B]">
                                        มูลค่า: {formatBaht(lineValue)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="text-xs font-black text-[#111827] tabular-nums">
                                    {book.stock_quantity} เล่ม
                                  </span>
                                  <StockBadge quantity={book.stock_quantity} size="sm" showIcon={false} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 11. RECENT BOOKS (หนังสือล่าสุด) */}
      <div className="bg-white rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] overflow-hidden">
        <div className="p-6 border-b border-[#F3DDE7]/60 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <span>หนังสือล่าสุด</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
                {recentBooks.length} รายการล่าสุด
              </span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              ผลงานวิชาการและสิ่งพิมพ์ที่ลงทะเบียนเข้าสู่ระบบล่าสุด
            </p>
          </div>
          <button
            onClick={onNavigateToBooks}
            className="text-xs font-bold text-[#ED1760] hover:text-white bg-[#FCE7F3] hover:bg-[#ED1760] border border-[#F3DDE7] px-4 py-2 rounded-[12px] transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>ดูหนังสือทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBooks.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            ยังไม่มีรายการหนังสือในระบบ สามารถกดปุ่ม &quot;เพิ่มหนังสือใหม่&quot; เพื่อเริ่มต้นบันทึกข้อมูล
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FCF8FA] text-xs text-[#64748B] font-bold border-b border-[#F3DDE7]">
                <tr>
                  <th className="px-6 py-3.5 w-16">ปก</th>
                  <th className="px-6 py-3.5">ชื่อหนังสือ</th>
                  <th className="px-6 py-3.5">ISBN</th>
                  <th className="px-6 py-3.5">หมวดหมู่</th>
                  <th className="px-6 py-3.5">ปีพิมพ์</th>
                  <th className="px-6 py-3.5">คงเหลือ</th>
                  <th className="px-6 py-3.5">ราคาปก</th>
                  <th className="px-6 py-3.5">สถานะ</th>
                  <th className="px-6 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3DDE7]/50">
                {recentBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-[#FCE7F3]/20 transition-colors">
                    <td className="px-6 py-3.5 w-16">
                      <div
                        onClick={() => onSelectBook(book)}
                        className="w-10 h-14 rounded-md overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-2xs flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow relative"
                        title={book.book_name}
                      >
                        <img
                          src={book.cover_image}
                          alt={book.book_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-[#111827] max-w-xs">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="text-left line-clamp-1 hover:text-[#ED1760] transition-colors cursor-pointer"
                      >
                        {book.book_name}
                      </button>
                      <div className="text-[11px] font-normal text-[#64748B] mt-0.5">{book.author}</div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[#64748B] font-mono">{book.isbn || '-'}</td>
                    <td className="px-6 py-3.5 text-xs text-[#111827] font-medium">
                      <span className="bg-[#FCF8FA] px-2.5 py-1 rounded-[8px] border border-[#F3DDE7] text-[11px]">
                        {book.category || 'ทั่วไป'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[#64748B] font-medium">พ.ศ. {book.published_year}</td>
                    <td className="px-6 py-3.5 font-bold text-[#111827] tabular-nums">
                      {book.stock_quantity} <span className="text-xs font-normal text-[#64748B]">เล่ม</span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-[#ED1760] tabular-nums">
                      {formatBaht(book.price)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StockBadge quantity={book.stock_quantity} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="text-xs font-bold text-[#ED1760] hover:text-white bg-[#FCE7F3] hover:bg-[#ED1760] px-3 py-1.5 rounded-[10px] border border-[#F3DDE7] transition-all cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock and Out of Stock Attention Lists */}
      {(lowStockBooks.length > 0 || outOfStockBooks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-6">
          {/* Low Stock List */}
          <div className="bg-white rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] p-3 sm:p-5">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#F3DDE7]/60">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B]" />
                <h4 className="text-xs sm:text-sm font-extrabold text-[#111827]">
                  หนังสือใกล้หมดสต๊อก ({lowStockBooks.length})
                </h4>
              </div>
              <button
                onClick={onNavigateToStock}
                className="text-[10px] sm:text-[11px] font-bold text-[#F59E0B] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>จัดการสต๊อก</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-1.5 sm:mt-2 max-h-48 sm:max-h-56 overflow-y-auto">
              {lowStockBooks.map((book) => (
                <div key={book.id} className="py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111827] truncate">{book.book_name}</p>
                    <p className="text-[10px] sm:text-[11px] text-[#64748B]">พ.ศ. {book.published_year} · ราคา {formatBaht(book.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="text-xs font-extrabold text-[#F59E0B] tabular-nums">
                      {book.stock_quantity} เล่ม
                    </span>
                    <button
                      onClick={() => onSelectBook(book)}
                      className="text-[9px] sm:text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-1.5 sm:px-2 py-0.5 rounded-[6px]"
                    >
                      ดู
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Out of Stock List */}
          <div className="bg-white rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] p-3 sm:p-5">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#F3DDE7]/60">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EF4444]" />
                <h4 className="text-xs sm:text-sm font-extrabold text-[#111827]">
                  หนังสือหมดสต๊อก ({outOfStockBooks.length})
                </h4>
              </div>
              <button
                onClick={onNavigateToStock}
                className="text-[10px] sm:text-[11px] font-bold text-[#EF4444] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>รับเข้าคลัง</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-1.5 sm:mt-2 max-h-48 sm:max-h-56 overflow-y-auto">
              {outOfStockBooks.length === 0 ? (
                <div className="py-4 sm:py-6 text-center text-xs text-[#10B981] font-semibold">
                  ไม่มีรายการหนังสือที่หมดสต๊อก
                </div>
              ) : (
                outOfStockBooks.map((book) => (
                  <div key={book.id} className="py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{book.book_name}</p>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B]">พ.ศ. {book.published_year} · ราคา {formatBaht(book.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-extrabold text-[#EF4444]">
                        หมด (0 เล่ม)
                      </span>
                      <button
                        onClick={() => onSelectBook(book)}
                        className="text-[9px] sm:text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-1.5 sm:px-2 py-0.5 rounded-[6px]"
                      >
                        ดู
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
