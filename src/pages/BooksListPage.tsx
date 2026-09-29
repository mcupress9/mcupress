import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  BookOpen,
  PackagePlus,
  RotateCcw,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Boxes,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { Book } from '../types';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';

interface BooksListPageProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onNavigateToAddBook: () => void;
  onQuickStockAdjust?: (book: Book) => void;
}

export const BooksListPage: React.FC<BooksListPageProps> = ({
  books,
  onSelectBook,
  onEditBook,
  onDeleteBook,
  onNavigateToAddBook,
  onQuickStockAdjust,
}) => {
  const { canDeleteBook, canEditBook } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'by_year'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

  const toggleYearCollapse = (year: number) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // Available unique years
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    books.forEach((b) => {
      if (b.published_year) set.add(b.published_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [books]);

  // Overall Yearly Stats for Ribbon (สต๊อกของแต่ละปี)
  const yearlyStats = useMemo(() => {
    const map: Record<number, { titles: number; copies: number; value: number }> = {};
    books.forEach((b) => {
      const yr = b.published_year || 2567;
      if (!map[yr]) map[yr] = { titles: 0, copies: 0, value: 0 };
      map[yr].titles += 1;
      map[yr].copies += Number(b.stock_quantity) || 0;
      map[yr].value += (Number(b.stock_quantity) || 0) * (Number(b.price) || 0);
    });
    return Object.entries(map)
      .map(([yrStr, data]) => ({
        year: Number(yrStr),
        yearLabel: `พ.ศ. ${yrStr}`,
        ...data,
      }))
      .sort((a, b) => b.year - a.year);
  }, [books]);

  // Real-time filter
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      // 1. Search Query: ชื่อหนังสือ, ผู้แต่ง, ISBN
      const matchQuery =
        !q ||
        book.book_name.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn && book.isbn.toLowerCase().includes(q));

      if (!matchQuery) return false;

      // 2. Year Filter
      if (selectedYear !== 'all' && book.published_year !== Number(selectedYear)) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus === 'in_stock' && book.stock_quantity <= 10) return false;
      if (selectedStatus === 'low_stock' && (book.stock_quantity === 0 || book.stock_quantity > 10))
        return false;
      if (selectedStatus === 'out_of_stock' && book.stock_quantity !== 0) return false;

      // 4. Price Range Filter
      const price = book.price || 0;
      if (selectedPriceRange === 'under_200' && price >= 200) return false;
      if (selectedPriceRange === '200_400' && (price < 200 || price > 400)) return false;
      if (selectedPriceRange === 'above_400' && price <= 400) return false;

      return true;
    });
  }, [books, searchQuery, selectedStatus, selectedYear, selectedPriceRange]);

  // Grouped by year for 'by_year' mode
  const groupedByYear = useMemo(() => {
    const map: Record<number, Book[]> = {};
    filteredBooks.forEach((b) => {
      const yr = b.published_year || 2567;
      if (!map[yr]) map[yr] = [];
      map[yr].push(b);
    });

    const sortedYears = Object.keys(map)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedYears.map((year) => {
      const yearBooks = map[year];
      const totalCopies = yearBooks.reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
      const totalValue = yearBooks.reduce(
        (sum, b) => sum + (Number(b.stock_quantity) || 0) * (Number(b.price) || 0),
        0
      );
      const inStock = yearBooks.filter((b) => (b.stock_quantity || 0) > 10).length;
      const lowStock = yearBooks.filter(
        (b) => (b.stock_quantity || 0) > 0 && (b.stock_quantity || 0) <= 10
      ).length;
      const outOfStock = yearBooks.filter((b) => (b.stock_quantity || 0) === 0).length;

      return {
        year,
        yearLabel: `พ.ศ. ${year}`,
        books: yearBooks,
        titlesCount: yearBooks.length,
        totalCopies,
        totalValue,
        inStock,
        lowStock,
        outOfStock,
      };
    });
  }, [filteredBooks]);

  const formatBaht = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedYear('all');
    setSelectedPriceRange('all');
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedYear !== 'all' ||
    selectedPriceRange !== 'all';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action & Search Bar */}
      <div className="bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                แคตตาล็อกหนังสือทั้งหมด
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
                {filteredBooks.length} / {books.length} รายการ
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย — ค้นหา ตรวจสอบสต๊อก และจัดการสิ่งพิมพ์
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Grid | Table | Grouped By Year */}
            <div className="flex items-center bg-[#FCF8FA] p-1 rounded-[12px] border border-[#F3DDE7]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-2.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#ED1760] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
                title="มุมมองแบบการ์ด (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">การ์ด</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 px-2.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#ED1760] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
                title="มุมมองแบบตาราง (Table)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ตาราง</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_year')}
                className={`p-1.5 px-2.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'by_year'
                    ? 'bg-[#ED1760] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
                title="มุมมองแยกตามปีที่พิมพ์ (Yearly Grouping)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">แยกตามปี</span>
              </button>
            </div>

            {/* Add Book Button */}
            <button
              onClick={onNavigateToAddBook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#ED1760]/20 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหนังสือใหม่</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาจากชื่อหนังสือ, ผู้แต่ง, หรือ ISBN..."
              className="w-full pl-10 pr-9 py-2 rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] focus:bg-white text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#ED1760] cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter 1: สถานะสต๊อก */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] focus:bg-white text-xs sm:text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] cursor-pointer"
            >
              <option value="all">สถานะสต๊อกทั้งหมด</option>
              <option value="in_stock">มีสินค้า (&gt; 10 เล่ม)</option>
              <option value="low_stock">ใกล้หมด (1 - 10 เล่ม)</option>
              <option value="out_of_stock">หมดสต๊อก (0 เล่ม)</option>
            </select>
          </div>

          {/* Filter 2: ปีที่พิมพ์ */}
          <div className="md:col-span-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-2 px-3 rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] focus:bg-white text-xs sm:text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] cursor-pointer"
            >
              <option value="all">ปีที่พิมพ์ทั้งหมด</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: ช่วงราคา */}
          <div className="md:col-span-2">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full py-2 px-3 rounded-[14px] border border-[#F3DDE7] bg-[#FCF8FA] focus:bg-white text-xs sm:text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] cursor-pointer"
            >
              <option value="all">ทุกช่วงราคา</option>
              <option value="under_200">ต่ำกว่า ฿200</option>
              <option value="200_400">฿200 - ฿400</option>
              <option value="above_400">มากกว่า ฿400</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="md:col-span-1 flex items-center">
            {isFiltered ? (
              <button
                onClick={handleResetFilters}
                className="w-full py-2 px-2 rounded-[14px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-[#F3DDE7]"
                title="ล้างตัวกรอง"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ล้าง</span>
              </button>
            ) : (
              <div className="w-full py-2 px-2 text-center text-slate-300 text-xs font-semibold">
                —
              </div>
            )}
          </div>
        </div>

        {/* YEARLY STOCK QUICK FILTER RIBBON (สรุปสต๊อกของแต่ละปี) */}
        <div className="pt-2 border-t border-[#F3DDE7]/50 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-[#64748B] flex-shrink-0 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-[#ED1760]" />
            <span>สต๊อกแต่ละปี:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
              selectedYear === 'all'
                ? 'bg-[#ED1760] text-white shadow-xs'
                : 'bg-[#FCF8FA] text-[#64748B] hover:text-[#ED1760] border border-[#F3DDE7]'
            }`}
          >
            <span>ทั้งหมดทุกปี</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedYear === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FCE7F3] text-[#ED1760]'
              }`}
            >
              {books.reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0)} เล่ม
            </span>
          </button>

          {yearlyStats.map((item) => {
            const isSelected = selectedYear === item.year.toString();
            return (
              <button
                key={item.year}
                type="button"
                onClick={() => setSelectedYear(isSelected ? 'all' : item.year.toString())}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#ED1760] text-white shadow-xs'
                    : 'bg-white text-[#111827] hover:text-[#ED1760] border border-[#F3DDE7] hover:border-[#ED1760]/30'
                }`}
              >
                <span>{item.yearLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                  }`}
                >
                  สต๊อก {item.copies} เล่ม
                </span>
                <span
                  className={`text-[10px] ${
                    isSelected ? 'text-white/80' : 'text-[#64748B]'
                  }`}
                >
                  ({item.titles} ชื่อ · {formatBaht(item.value)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty States */}
      {books.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#F3DDE7] p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">ยังไม่มีรายการหนังสือในระบบ</h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto leading-relaxed">
            เริ่มต้นบันทึกข้อมูลสิ่งพิมพ์เล่มแรกของคุณเข้าสู่คลังสต๊อกได้ทันที
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={onNavigateToAddBook}
              className="px-5 py-2.5 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>+ บันทึกหนังสือเล่มแรก</span>
            </button>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#F3DDE7] p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">ไม่พบหนังสือที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
            ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรองที่ระบุ ลองปรับเปลี่ยนเงื่อนไข
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-[12px] bg-[#FCF8FA] hover:bg-[#FCE7F3] text-[#111827] border border-[#F3DDE7] text-xs font-bold transition-colors cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              onClick={onNavigateToAddBook}
              className="px-4 py-2 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + เพิ่มหนังสือใหม่
            </button>
          </div>
        </div>
      ) : null}

      {/* VIEW MODE 1: GRID CARDS */}
      {viewMode === 'grid' && filteredBooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-[18px] border border-[#F3DDE7] hover:border-[#ED1760]/40 shadow-[0_4px_16px_rgba(237,23,96,0.03)] hover:shadow-md transition-all duration-150 flex flex-col justify-between overflow-hidden group relative"
            >
              {/* Cover Aspect 3:4 */}
              <div
                onClick={() => onSelectBook(book)}
                className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden cursor-pointer"
              >
                <img
                  src={book.cover_image}
                  alt={book.book_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                  }}
                />
                <div className="absolute top-2.5 right-2.5">
                  <StockBadge quantity={book.stock_quantity} size="sm" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-[6px] bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                  พ.ศ. {book.published_year}
                </div>
              </div>

              {/* Book Info Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => onSelectBook(book)}
                    className="text-sm font-extrabold text-[#111827] group-hover:text-[#ED1760] line-clamp-2 cursor-pointer leading-snug transition-colors"
                    title={book.book_name}
                  >
                    {book.book_name}
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-1 mt-1 font-medium">
                    {book.author}
                  </p>
                  <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
                    <span>ISBN: {book.isbn || '-'}</span>
                    <span>{book.pages} หน้า</span>
                  </div>
                </div>

                {/* Stock & Price */}
                <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-[#64748B]">คงเหลือ</div>
                    <div className="text-sm font-extrabold text-[#111827] tabular-nums">
                      {book.stock_quantity} <span className="text-[10px] font-normal text-[#64748B]">เล่ม</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-[#64748B]">ราคาเล่มละ</div>
                    <div className="text-sm font-extrabold text-[#ED1760] tabular-nums">
                      {formatBaht(book.price)}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onSelectBook(book)}
                    className="flex-1 py-1.5 px-2 rounded-[10px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="ดูรายละเอียดเล่มนี้"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>รายละเอียด</span>
                  </button>

                  {onQuickStockAdjust && (
                    <button
                      onClick={() => onQuickStockAdjust(book)}
                      className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#10B981] hover:bg-[#ECFDF5] border border-[#F3DDE7] transition-colors cursor-pointer"
                      title="รับเข้า / ปรับสต๊อกเล่มนี้"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canEditBook && (
                    <button
                      onClick={() => onEditBook(book)}
                      className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#3B82F6] hover:bg-blue-50 border border-[#F3DDE7] transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลหนังสือ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canDeleteBook && (
                    <button
                      onClick={() => onDeleteBook(book)}
                      className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] border border-[#F3DDE7] transition-colors cursor-pointer"
                      title="ลบหนังสือ (เฉพาะ Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: TABLE */}
      {viewMode === 'table' && filteredBooks.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FCF8FA] text-xs text-[#64748B] font-bold border-b border-[#F3DDE7]">
                <tr>
                  <th className="px-5 py-3.5 w-16">ปก</th>
                  <th className="px-5 py-3.5">ชื่อหนังสือ</th>
                  <th className="px-5 py-3.5">ผู้แต่ง</th>
                  <th className="px-5 py-3.5">หน้า</th>
                  <th className="px-5 py-3.5">ISBN</th>
                  <th className="px-5 py-3.5">ปีพิมพ์</th>
                  <th className="px-5 py-3.5">ราคาปก</th>
                  <th className="px-5 py-3.5">คงเหลือ</th>
                  <th className="px-5 py-3.5">สถานะ</th>
                  <th className="px-5 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3DDE7]/50">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-[#FCE7F3]/20 transition-colors">
                    <td className="px-5 py-3 w-16">
                      <div
                        onClick={() => onSelectBook(book)}
                        className="w-10 h-14 rounded-md overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-2xs flex-shrink-0 cursor-pointer hover:shadow-md transition-all relative"
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
                    <td className="px-5 py-3 max-w-xs font-extrabold text-[#111827]">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="text-left line-clamp-1 hover:text-[#ED1760] transition-colors cursor-pointer"
                      >
                        {book.book_name}
                      </button>
                      <div className="text-[11px] font-normal text-[#64748B] mt-0.5">
                        {book.category || 'สิ่งพิมพ์วิชาการ'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#64748B]">{book.author}</td>
                    <td className="px-5 py-3 text-xs text-[#64748B]">{book.pages}</td>
                    <td className="px-5 py-3 text-xs text-[#64748B] font-mono">
                      {book.isbn || '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#111827] font-semibold">
                      พ.ศ. {book.published_year}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#111827] tabular-nums">
                      {formatBaht(book.price)}
                    </td>
                    <td className="px-5 py-3 font-bold text-[#111827] tabular-nums">
                      {book.stock_quantity} เล่ม
                    </td>
                    <td className="px-5 py-3">
                      <StockBadge quantity={book.stock_quantity} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectBook(book)}
                          className="p-1.5 rounded-[8px] text-[#ED1760] bg-[#FCE7F3] hover:bg-[#ED1760] hover:text-white transition-colors cursor-pointer"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onQuickStockAdjust && (
                          <button
                            onClick={() => onQuickStockAdjust(book)}
                            className="p-1.5 rounded-[8px] text-[#10B981] bg-[#ECFDF5] hover:bg-[#10B981] hover:text-white transition-colors cursor-pointer"
                            title="ปรับสต๊อก"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEditBook && (
                          <button
                            onClick={() => onEditBook(book)}
                            className="p-1.5 rounded-[8px] text-[#3B82F6] bg-blue-50 hover:bg-[#3B82F6] hover:text-white transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteBook && (
                          <button
                            onClick={() => onDeleteBook(book)}
                            className="p-1.5 rounded-[8px] text-[#EF4444] bg-[#FEF2F2] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: GROUPED BY YEAR (ข้อมูลหนังสือแต่ละปี + สต๊อกแต่ละปี) */}
      {viewMode === 'by_year' && filteredBooks.length > 0 && (
        <div className="space-y-6">
          {groupedByYear.map((yearGroup) => {
            const isCollapsed = collapsedYears[yearGroup.year] === true;
            return (
              <div
                key={yearGroup.year}
                className="bg-white rounded-[22px] border border-[#F3DDE7] shadow-2xs overflow-hidden"
              >
                {/* Year Header Banner */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FCF8FA] via-white to-[#FCE7F3]/25 border-b border-[#F3DDE7] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-[12px] bg-[#ED1760] text-white font-black text-sm shadow-xs shadow-[#ED1760]/20 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{yearGroup.yearLabel}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-[#111827]">
                        สิ่งพิมพ์ที่จัดพิมพ์ปี {yearGroup.year}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 flex-wrap">
                        <span>
                          จำนวน <strong>{yearGroup.titlesCount}</strong> ชื่อเรื่อง
                        </span>
                        <span>·</span>
                        <span>
                          สต๊อกรวม{' '}
                          <strong className="text-[#10B981] font-black">
                            {yearGroup.totalCopies}
                          </strong>{' '}
                          เล่ม
                        </span>
                        <span>·</span>
                        <span>
                          มูลค่ารวม{' '}
                          <strong className="text-[#ED1760] font-black">
                            {formatBaht(yearGroup.totalValue)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Collapse Toggle */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-[10px] bg-[#ECFDF5] text-[#065F46] font-bold text-xs border border-[#A7F3D0]">
                      มีสินค้า: {yearGroup.inStock}
                    </span>
                    <span className="px-2.5 py-1 rounded-[10px] bg-[#FFFBEB] text-[#92400E] font-bold text-xs border border-[#FDE68A]">
                      ใกล้หมด: {yearGroup.lowStock}
                    </span>
                    <span className="px-2.5 py-1 rounded-[10px] bg-[#FEF2F2] text-[#991B1B] font-bold text-xs border border-[#FECACA]">
                      หมดสต๊อก: {yearGroup.outOfStock}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleYearCollapse(yearGroup.year)}
                      className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#111827] hover:bg-[#FCF8FA] border border-[#F3DDE7] transition-colors cursor-pointer"
                      title={isCollapsed ? 'ขยายรายการ' : 'ย่อรายการ'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Books Grid under this year */}
                {!isCollapsed && (
                  <div className="p-5 sm:p-6 bg-[#FCF8FA]/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {yearGroup.books.map((book) => {
                        const lineValue = (book.stock_quantity || 0) * (book.price || 0);
                        return (
                          <div
                            key={book.id}
                            className="bg-white rounded-[16px] border border-[#F3DDE7] hover:border-[#ED1760]/40 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                          >
                            <div className="flex gap-3">
                              {/* Book Cover */}
                              <div
                                onClick={() => onSelectBook(book)}
                                className="w-16 h-22 rounded-lg overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-2xs flex-shrink-0 cursor-pointer relative"
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

                              {/* Book Details */}
                              <div className="flex-1 min-w-0">
                                <h5
                                  onClick={() => onSelectBook(book)}
                                  className="text-xs sm:text-sm font-extrabold text-[#111827] hover:text-[#ED1760] line-clamp-2 cursor-pointer transition-colors"
                                  title={book.book_name}
                                >
                                  {book.book_name}
                                </h5>
                                <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                                  {book.author}
                                </p>
                                <div className="text-[10px] text-[#64748B] mt-1">
                                  <span>{book.category || 'ทั่วไป'}</span> ·{' '}
                                  <span className="font-mono">{book.isbn || '-'}</span>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs font-black text-[#ED1760] tabular-nums">
                                    {formatBaht(book.price)}
                                  </span>
                                  <span className="text-[11px] text-[#64748B]">
                                    มูลค่ารวม: <strong>{formatBaht(lineValue)}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Stock & Actions */}
                            <div className="mt-3 pt-3 border-t border-[#F3DDE7]/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#111827] tabular-nums">
                                  สต๊อก: {book.stock_quantity} เล่ม
                                </span>
                                <StockBadge quantity={book.stock_quantity} size="sm" showIcon={false} />
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onSelectBook(book)}
                                  className="p-1 px-2 rounded-[8px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                                  title="ดูรายละเอียด"
                                >
                                  ดูข้อมูล
                                </button>
                                {onQuickStockAdjust && (
                                  <button
                                    onClick={() => onQuickStockAdjust(book)}
                                    className="p-1 rounded-[8px] text-[#10B981] bg-[#ECFDF5] hover:bg-[#10B981] hover:text-white transition-colors cursor-pointer"
                                    title="ปรับสต๊อก"
                                  >
                                    <PackagePlus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canEditBook && (
                                  <button
                                    onClick={() => onEditBook(book)}
                                    className="p-1 rounded-[8px] text-[#3B82F6] bg-blue-50 hover:bg-[#3B82F6] hover:text-white transition-colors cursor-pointer"
                                    title="แก้ไขข้อมูล"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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
      )}
    </div>
  );
};
