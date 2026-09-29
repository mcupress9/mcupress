import React, { useMemo } from 'react';
import {
  BookOpen,
  Boxes,
  Coins,
  AlertTriangle,
  XCircle,
  Plus,
  PackageCheck,
  ChevronRight,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
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
  // 1. Chart 1 Data: Books by published year
  const booksByYearData = useMemo(() => {
    const counts: Record<number, number> = {};
    books.forEach((b) => {
      const year = b.published_year || 2567;
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.keys(counts)
      .map((yearStr) => ({
        year: `พ.ศ. ${yearStr}`,
        count: counts[Number(yearStr)],
        rawYear: Number(yearStr),
      }))
      .sort((a, b) => a.rawYear - b.rawYear);
  }, [books]);

  // 2. Chart 2 Data: Stock status distribution
  const stockStatusData = useMemo(() => {
    return [
      { name: 'มีสินค้า (>10 เล่ม)', value: stats.inStockTitles, color: '#10B981' },
      { name: 'ใกล้หมด (1-10 เล่ม)', value: stats.lowStockTitles, color: '#F59E0B' },
      { name: 'หมดสต๊อก (0 เล่ม)', value: stats.outOfStockTitles, color: '#EF4444' },
    ];
  }, [stats]);

  // 3. Chart 3 Data: Stock value by published year
  const stockValueByYearData = useMemo(() => {
    const values: Record<number, number> = {};
    books.forEach((b) => {
      const year = b.published_year || 2567;
      const val = (b.stock_quantity || 0) * (b.price || 0);
      values[year] = (values[year] || 0) + val;
    });
    return Object.keys(values)
      .map((yearStr) => ({
        year: `พ.ศ. ${yearStr}`,
        value: values[Number(yearStr)],
        rawYear: Number(yearStr),
      }))
      .sort((a, b) => a.rawYear - b.rawYear);
  }, [books]);

  // 4. Low stock books (<= 10 and > 0)
  const lowStockBooks = useMemo(() => {
    return books.filter((b) => b.stock_quantity > 0 && b.stock_quantity <= 10);
  }, [books]);

  // 5. Out of stock books (= 0)
  const outOfStockBooks = useMemo(() => {
    return books.filter((b) => b.stock_quantity === 0);
  }, [books]);

  // 6. Recently added books (sorted by created_at)
  const recentBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [books]);

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
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 7. HERO DASHBOARD (MCU Esports Style) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FCE7F3] via-[#FFF1F7] to-[#FCF8FA] p-6 sm:p-8 rounded-[24px] border border-[#F3DDE7] shadow-[0_4px_20px_rgba(237,23,96,0.04)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#111827]">สวัสดี 👋</span>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-white text-[#ED1760] border border-[#F3DDE7] shadow-2xs">
                MCU Press Inventory
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              ภาพรวมสต๊อกหนังสือของสำนักพิมพ์
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed whitespace-pre-line">
              สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย{'\n'}
              ติดตามยอดคงเหลือ มูลค่าคลังสิ่งพิมพ์ และสถิติวิชาการแบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onNavigateToAddBook}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#ED1760]/25 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหนังสือใหม่</span>
            </button>
            <button
              onClick={onNavigateToStock}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-white hover:bg-[#FCE7F3] text-[#111827] hover:text-[#ED1760] font-bold text-xs sm:text-sm border border-[#F3DDE7] shadow-2xs transition-all duration-150 cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-[#ED1760]" />
              <span>จัดการสต๊อก</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. STATISTICS CARDS (5 Cards, Modern MCU Esports) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Card 1: หนังสือทั้งหมด */}
        <div className="bg-white p-5 rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              พร้อมบริการ
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#64748B]">หนังสือทั้งหมด</div>
            <div className="text-3xl font-extrabold text-[#111827] tabular-nums tracking-tight mt-1">
              {formatNumber(stats.totalTitles)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 text-xs font-bold text-[#ED1760]">
            จำนวนชื่อเรื่อง
          </div>
        </div>

        {/* Card 2: หนังสือในสต๊อก */}
        <div className="bg-white p-5 rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              {stats.inStockTitles} รายการ
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#64748B]">หนังสือในสต๊อก</div>
            <div className="text-3xl font-extrabold text-[#111827] tabular-nums tracking-tight mt-1">
              {formatNumber(stats.totalCopies)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 text-xs font-bold text-[#10B981]">
            เล่มคงเหลือ
          </div>
        </div>

        {/* Card 3: มูลค่าสต๊อก */}
        <div className="bg-white p-5 rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-full border border-[#F3DDE7]">
              ราคาปก
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#64748B]">มูลค่าสต๊อก</div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-[#111827] tabular-nums tracking-tight truncate mt-1" title={formatBaht(stats.totalStockValue)}>
              {formatBaht(stats.totalStockValue)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 text-xs font-bold text-[#ED1760]">
            มูลค่าคลังสิ่งพิมพ์
          </div>
        </div>

        {/* Card 4: ใกล้หมดสต๊อก */}
        <div className="bg-white p-5 rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-full bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
              1-10 เล่ม
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#64748B]">ใกล้หมดสต๊อก</div>
            <div className="text-3xl font-extrabold text-[#F59E0B] tabular-nums tracking-tight mt-1">
              {formatNumber(stats.lowStockTitles)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 text-xs font-bold text-[#F59E0B]">
            รายการเฝ้าระวัง
          </div>
        </div>

        {/* Card 5: หมดสต๊อก */}
        <div className="bg-white p-5 rounded-[18px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col justify-between transition-all duration-150 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              stats.outOfStockTitles > 0
                ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                : 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]'
            }`}>
              {stats.outOfStockTitles > 0 ? 'สินค้าหมด' : 'ปกติ'}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#64748B]">หมดสต๊อก</div>
            <div className={`text-3xl font-extrabold tabular-nums tracking-tight mt-1 ${
              stats.outOfStockTitles > 0 ? 'text-[#EF4444]' : 'text-[#111827]'
            }`}>
              {formatNumber(stats.outOfStockTitles)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F3DDE7]/50 text-xs font-bold text-[#EF4444]">
            รายการสินค้าหมด
          </div>
        </div>
      </div>

      {/* 10. CONTENT SECTIONS (Section 1, Section 2, Section 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Section 1: จำนวนหนังสือตามปีที่พิมพ์ */}
        <div className="bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                จำนวนหนังสือตามปีที่พิมพ์
              </h3>
              <p className="text-xs text-[#64748B]">จำนวนชื่อเรื่องแยกตามปีจัดพิมพ์</p>
            </div>
            <div className="p-2 bg-[#FCE7F3] rounded-[10px] text-[#ED1760]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={booksByYearData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} ชื่อเรื่อง`, 'จำนวนหนังสือ']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F3DDE7', boxShadow: '0 4px 16px rgba(237,23,96,0.08)' }}
                />
                <Bar dataKey="count" fill="#ED1760" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 2: สถานะสต๊อกหนังสือ (Donut Chart) */}
        <div className="bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                สถานะสต๊อกหนังสือ
              </h3>
              <p className="text-xs text-[#64748B]">สัดส่วนสต๊อก (มีสินค้า, ใกล้หมด, หมดสต๊อก)</p>
            </div>
            <div className="p-2 bg-[#ECFDF5] rounded-[10px] text-[#10B981]">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="h-60 w-full mt-2 flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} ชื่อเรื่อง`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F3DDE7', boxShadow: '0 4px 16px rgba(237,23,96,0.08)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-[#64748B] font-semibold">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: มูลค่าสต๊อกตามปีที่พิมพ์ (Area Chart) */}
        <div className="bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                มูลค่าสต๊อกตามปีที่พิมพ์
              </h3>
              <p className="text-xs text-[#64748B]">มูลค่าคงเหลือในคลัง แยกตามปี (บาท)</p>
            </div>
            <div className="p-2 bg-[#FCE7F3] rounded-[10px] text-[#ED1760]">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockValueByYearData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="mcuValGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ED1760" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ED1760" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatBaht(val), 'มูลค่าสต๊อก']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F3DDE7', boxShadow: '0 4px 16px rgba(237,23,96,0.08)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#ED1760" strokeWidth={2.5} fillOpacity={1} fill="url(#mcuValGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Low Stock List */}
          <div className="bg-white rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3DDE7]/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <h4 className="text-sm font-extrabold text-[#111827]">
                  หนังสือใกล้หมดสต๊อก ({lowStockBooks.length})
                </h4>
              </div>
              <button
                onClick={onNavigateToStock}
                className="text-[11px] font-bold text-[#F59E0B] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>จัดการสต๊อก</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-2 max-h-56 overflow-y-auto">
              {lowStockBooks.map((book) => (
                <div key={book.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111827] truncate">{book.book_name}</p>
                    <p className="text-[11px] text-[#64748B]">พ.ศ. {book.published_year} · ราคา {formatBaht(book.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-extrabold text-[#F59E0B] tabular-nums">
                      {book.stock_quantity} เล่ม
                    </span>
                    <button
                      onClick={() => onSelectBook(book)}
                      className="text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-[6px]"
                    >
                      ดู
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Out of Stock List */}
          <div className="bg-white rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3DDE7]/60">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[#EF4444]" />
                <h4 className="text-sm font-extrabold text-[#111827]">
                  หนังสือหมดสต๊อก ({outOfStockBooks.length})
                </h4>
              </div>
              <button
                onClick={onNavigateToStock}
                className="text-[11px] font-bold text-[#EF4444] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>รับเข้าคลัง</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-2 max-h-56 overflow-y-auto">
              {outOfStockBooks.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#10B981] font-semibold">
                  ไม่มีรายการหนังสือที่หมดสต๊อก
                </div>
              ) : (
                outOfStockBooks.map((book) => (
                  <div key={book.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{book.book_name}</p>
                      <p className="text-[11px] text-[#64748B]">พ.ศ. {book.published_year} · ราคา {formatBaht(book.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-extrabold text-[#EF4444]">
                        หมดสต๊อก (0 เล่ม)
                      </span>
                      <button
                        onClick={() => onSelectBook(book)}
                        className="text-[10px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-[6px]"
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
