import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RotateCcw,
  Search,
  BookOpen,
  Boxes,
  Coins,
  AlertTriangle,
  XCircle,
  Layers,
  Sparkles,
  Printer,
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Book, SummaryStats } from '../types';
import { StockBadge } from '../components/StockBadge';
import { getStockStatusText, storageService } from '../services/storage';
import { CategoryStockOverviewChart } from '../components/CategoryStockOverviewChart';

interface SummaryPageProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

const STATUS_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export const SummaryPage: React.FC<SummaryPageProps> = ({ books, onSelectBook }) => {
  // Period filter: today, this_week, this_month, this_year, all
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

  // Table filters
  const [filterTitle, setFilterTitle] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterIsbn, setFilterIsbn] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'all',
    year: 'all',
    status: 'all',
    minPrice: '',
    maxPrice: '',
  });

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      title: filterTitle.trim(),
      author: filterAuthor.trim(),
      isbn: filterIsbn.trim(),
      category: filterCategory,
      year: filterYear,
      status: filterStatus,
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
    });
  };

  const handleResetFilter = () => {
    setFilterTitle('');
    setFilterAuthor('');
    setFilterIsbn('');
    setFilterCategory('all');
    setFilterYear('all');
    setFilterStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setAppliedFilters({
      title: '',
      author: '',
      isbn: '',
      category: 'all',
      year: 'all',
      status: 'all',
      minPrice: '',
      maxPrice: '',
    });
  };

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category?.trim()) set.add(b.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [books]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    books.forEach((b) => {
      if (b.published_year) set.add(b.published_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [books]);

  // Date filtering based on periodFilter
  const periodFilteredBooks = useMemo(() => {
    if (periodFilter === 'all') return books;
    const now = new Date();
    return books.filter((b) => {
      const created = new Date(b.created_at);
      if (periodFilter === 'today') {
        return created.toDateString() === now.toDateString();
      }
      if (periodFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return created >= oneWeekAgo;
      }
      if (periodFilter === 'month') {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === 'year') {
        return created.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [books, periodFilter]);

  // Combined filters for main table
  const filteredBooks = useMemo(() => {
    return periodFilteredBooks.filter((book) => {
      if (
        appliedFilters.title &&
        !book.book_name.toLowerCase().includes(appliedFilters.title.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.author &&
        !book.author.toLowerCase().includes(appliedFilters.author.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.isbn &&
        (!book.isbn || !book.isbn.toLowerCase().includes(appliedFilters.isbn.toLowerCase()))
      ) {
        return false;
      }
      if (
        appliedFilters.category !== 'all' &&
        (book.category?.trim() || 'สิ่งพิมพ์ทั่วไป') !== appliedFilters.category
      ) {
        return false;
      }
      if (appliedFilters.year !== 'all' && book.published_year !== Number(appliedFilters.year)) {
        return false;
      }
      if (appliedFilters.status === 'in_stock' && book.stock_quantity <= 10) return false;
      if (
        appliedFilters.status === 'low_stock' &&
        (book.stock_quantity === 0 || book.stock_quantity > 10)
      )
        return false;
      if (appliedFilters.status === 'out_of_stock' && book.stock_quantity !== 0) return false;

      const minP = parseFloat(appliedFilters.minPrice);
      if (!isNaN(minP) && book.price < minP) return false;

      const maxP = parseFloat(appliedFilters.maxPrice);
      if (!isNaN(maxP) && book.price > maxP) return false;

      return true;
    });
  }, [periodFilteredBooks, appliedFilters]);

  // Executive stats
  const summaryStats = useMemo(() => {
    let totalCopies = 0;
    let totalStockValue = 0;
    let inStockTitles = 0;
    let lowStockTitles = 0;
    let outOfStockTitles = 0;

    filteredBooks.forEach((b) => {
      const q = b.stock_quantity || 0;
      const p = b.price || 0;
      totalCopies += q;
      totalStockValue += q * p;

      if (q === 0) outOfStockTitles++;
      else if (q <= 10) lowStockTitles++;
      else inStockTitles++;
    });

    return {
      totalTitles: filteredBooks.length,
      totalCopies,
      totalStockValue,
      inStockTitles,
      lowStockTitles,
      outOfStockTitles,
    };
  }, [filteredBooks]);

  // Donut chart data
  const statusPieData = useMemo(() => {
    return [
      { name: 'พร้อมจำหน่าย', value: summaryStats.inStockTitles, color: '#10b981' },
      { name: 'ใกล้หมด (1-10)', value: summaryStats.lowStockTitles, color: '#f59e0b' },
      { name: 'หมดสต๊อก (0)', value: summaryStats.outOfStockTitles, color: '#f43f5e' },
    ].filter((item) => item.value > 0);
  }, [summaryStats]);

  // Category bar data
  const categoryBarData = useMemo(() => {
    const map: Record<string, { count: number; totalVal: number }> = {};
    filteredBooks.forEach((b) => {
      const cat = b.category || 'อื่นๆ';
      if (!map[cat]) map[cat] = { count: 0, totalVal: 0 };
      map[cat].count += b.stock_quantity;
      map[cat].totalVal += b.stock_quantity * b.price;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name: name.length > 14 ? name.substring(0, 13) + '...' : name,
        fullName: name,
        copies: data.count,
        value: data.totalVal,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredBooks]);

  // Top 5 books by stock / value
  const top5Books = useMemo(() => {
    return [...filteredBooks]
      .sort((a, b) => (b.stock_quantity * b.price) - (a.stock_quantity * a.price))
      .slice(0, 5);
  }, [filteredBooks]);

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

  const handlePrint = () => {
    window.print();
  };

  // Export to CSV with UTF-8 BOM
  const exportCSV = () => {
    const headers = [
      'ลำดับ',
      'ชื่อหนังสือ',
      'ผู้แต่ง',
      'หมวดหมู่',
      'จำนวนหน้า',
      'ISBN',
      'ปีที่พิมพ์',
      'ราคา (บาท)',
      'จำนวนคงเหลือ (เล่ม)',
      'มูลค่าคงเหลือ (บาท)',
      'สถานะ',
    ];

    const rows = filteredBooks.map((b, index) => [
      index + 1,
      `"${b.book_name.replace(/"/g, '""')}"`,
      `"${b.author.replace(/"/g, '""')}"`,
      `"${b.category || 'สิ่งพิมพ์วิชาการ'}"`,
      b.pages,
      `"${b.isbn || '-'}"`,
      b.published_year,
      b.price,
      b.stock_quantity,
      b.stock_quantity * b.price,
      `"${getStockStatusText(b.stock_quantity)}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `รายงานสรุปสต๊อกหนังสือ_มจร_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Excel XML (.xls)
  const exportExcel = () => {
    const title = 'รายงานสรุปสต๊อกหนังสือ สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย';
    const timestamp = new Date().toLocaleString('th-TH');

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          th { background-color: #ED1760; color: #ffffff; font-weight: bold; border: 1px solid #ccc; padding: 8px; }
          td { border: 1px solid #ccc; padding: 6px; }
          .num { mso-number-format:"\\#\\,\\#\\#0"; }
          .price { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
        </style>
      </head>
      <body>
        <h3>${title}</h3>
        <p>ข้อมูล ณ วันที่: ${timestamp} | ช่วงเวลา: ${periodFilter} | ทั้งหมด ${filteredBooks.length} รายการ</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่อหนังสือ</th>
              <th>ผู้แต่ง</th>
              <th>หมวดหมู่</th>
              <th>จำนวนหน้า</th>
              <th>ISBN</th>
              <th>ปีที่พิมพ์ (พ.ศ.)</th>
              <th>ราคา (บาท)</th>
              <th>จำนวนคงเหลือ</th>
              <th>มูลค่าคงเหลือ (บาท)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredBooks.forEach((b, index) => {
      const remainingVal = b.stock_quantity * b.price;
      const statusText = getStockStatusText(b.stock_quantity);
      tableHtml += `
        <tr>
          <td>${index + 1}</td>
          <td>${b.book_name}</td>
          <td>${b.author}</td>
          <td>${b.category || '-'}</td>
          <td class="num">${b.pages}</td>
          <td>${b.isbn || '-'}</td>
          <td>${b.published_year}</td>
          <td class="price">${b.price}</td>
          <td class="num">${b.stock_quantity}</td>
          <td class="price">${remainingVal}</td>
          <td>${statusText}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + tableHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `รายงานสรุปสต๊อกหนังสือ_มจร_${new Date().toISOString().slice(0, 10)}.xls`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Action Buttons (Executive Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            รายงานและสรุปข้อมูลภาพรวม (Executive Summary)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย — สถิติ วิเคราะห์ และส่งออกเอกสารรายงาน
          </p>
        </div>

        {/* Period Filter & Export Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Filter Pills */}
          <div className="flex items-center bg-white p-1 rounded-[14px] border border-[#F3DDE7] shadow-2xs text-xs font-bold">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
                periodFilter === 'today'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              สัปดาห์นี้
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
                periodFilter === 'year'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              ปีนี้
            </button>
          </div>

          {/* Action Buttons: Print, Excel, CSV */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-800 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              title="พิมพ์รายงานสรุป"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">พิมพ์รายงาน</span>
            </button>

            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition-colors cursor-pointer"
              title="ส่งออกไฟล์ Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              title="ส่งออกไฟล์ CSV UTF-8"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Titles */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            หนังสือทั้งหมด
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatNumber(summaryStats.totalTitles)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">ชื่อเรื่อง</div>
        </div>

        {/* Total Copies */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            จำนวนคงเหลือรวม
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
            {formatNumber(summaryStats.totalCopies)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">เล่มในคลัง</div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            มูลค่าสต๊อกรวม
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-800 mt-1 truncate">
            {formatBaht(summaryStats.totalStockValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">บาท</div>
        </div>

        {/* In Stock */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            มีสต๊อกพร้อมจำหน่าย
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {formatNumber(summaryStats.inStockTitles)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">&gt; 10 เล่ม</div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            หนังสือใกล้หมด
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            {formatNumber(summaryStats.lowStockTitles)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">1 - 10 เล่ม</div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-[0_2px_10px_rgba(190,24,93,0.03)]">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            หนังสือหมดสต๊อก
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            {formatNumber(summaryStats.outOfStockTitles)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">0 เล่ม</div>
        </div>
      </div>

      {/* Featured Recharts Overview: Category Stock Comparison Bar Chart */}
      <CategoryStockOverviewChart
        books={periodFilteredBooks}
        totalWarehouseCopies={summaryStats.totalCopies}
        totalWarehouseValue={summaryStats.totalStockValue}
        formatNumber={formatNumber}
        formatBaht={formatBaht}
        onFilterByCategory={(category) => {
          setFilterCategory(category);
          setAppliedFilters((prev) => ({
            ...prev,
            category: category || 'all',
          }));
        }}
      />

      {/* Visual Charts: Donut Chart & Category Value Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: สถานะสต๊อก */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-rose-700" />
            <h3 className="text-base font-extrabold text-slate-900">
              สัดส่วนสถานะสต๊อกหนังสือ
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            วิเคราะห์ความพร้อมในการให้บริการและจำหน่ายสิ่งพิมพ์
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val ?? 0} ชื่อเรื่อง`, 'จำนวน']}
                  contentStyle={{
                    borderRadius: '16px',
                    borderColor: '#fecdd3',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50/70">
                <div className="text-[11px] font-bold text-slate-500 truncate">{item.name}</div>
                <div className="text-sm font-black mt-0.5" style={{ color: item.color }}>
                  {item.value} <span className="text-[10px] font-normal text-slate-400">ชื่อ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Value Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-700" />
            <h3 className="text-base font-extrabold text-slate-900">
              มูลค่าคงคลังตามหมวดหมู่สิ่งพิมพ์
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            6 หมวดหมู่ที่มีมูลค่าสินค้าคงคลังรวมสูงสุด (บาท)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatBaht(Number(val) || 0), 'มูลค่ารวม']}
                  labelFormatter={(name) => {
                    const found = categoryBarData.find((c) => c.name === name);
                    return found?.fullName || name;
                  }}
                  contentStyle={{
                    borderRadius: '16px',
                    borderColor: '#fecdd3',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="value" fill="#9d174d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 text-right">
            <span className="text-[11px] text-slate-400 font-medium">
              * ข้อมูลอัปเดตแบบ Real-time ตามตัวกรองปัจจุบัน
            </span>
          </div>
        </div>
      </div>

      {/* Top 5 Rankings Table (Section 13 requirement) */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              5 อันดับหนังสือมูลค่าคงคลังสูงสุด (Top Inventory Assets)
            </h3>
            <p className="text-xs text-slate-400">
              รายการหนังสือที่มีมูลค่าสต๊อกคงคลังรวมสูงสุดในสำนักพิมพ์
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-center w-12">อันดับ</th>
                <th className="px-4 py-3 w-16">รูปปก</th>
                <th className="px-4 py-3">ชื่อหนังสือ</th>
                <th className="px-4 py-3">ผู้แต่ง</th>
                <th className="px-4 py-3 text-right">ราคาต่อเล่ม</th>
                <th className="px-4 py-3 text-right">คงเหลือ</th>
                <th className="px-4 py-3 text-right font-black text-rose-800">มูลค่ารวม</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top5Books.map((book, idx) => (
                <tr
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-center font-black text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center text-xs text-slate-700">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-16">
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200/90 shadow-xs flex-shrink-0">
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
                  <td className="px-4 py-3 font-bold text-slate-900 max-w-xs">
                    <div className="line-clamp-1 hover:text-rose-800">{book.book_name}</div>
                    <div className="text-[11px] text-slate-400">{book.category}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{book.author}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatBaht(book.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {book.stock_quantity} เล่ม
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-800">
                    {formatBaht(book.stock_quantity * book.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StockBadge quantity={book.stock_quantity} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Comprehensive Filters Card */}
      <div className="bg-white p-6 rounded-3xl border border-rose-100/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-rose-700" />
          <span>ตัวกรองตารางข้อมูลสรุปรายละเอียด</span>
        </div>

        <form onSubmit={handleApplyFilter} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ชื่อหนังสือ
              </label>
              <input
                type="text"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                placeholder="คำค้นชื่อเรื่อง..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ผู้แต่ง
              </label>
              <input
                type="text"
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                placeholder="ชื่อผู้แต่ง / ปราชญ์..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={filterIsbn}
                onChange={(e) => setFilterIsbn(e.target.value)}
                placeholder="เช่น 978-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                หมวดหมู่สิ่งพิมพ์
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              >
                <option value="all">ทุกหมวดหมู่ ({availableCategories.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ปีที่พิมพ์
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              >
                <option value="all">ทุกปีที่พิมพ์</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    พ.ศ. {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                สถานะสต๊อก
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="in_stock">🟢 มีสินค้า (&gt;10)</option>
                <option value="low_stock">🟡 ใกล้หมด (1-10)</option>
                <option value="out_of_stock">🔴 หมดสต๊อก (0)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ช่วงราคา (บาท)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="ต่ำสุด"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="สูงสุด"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ค้นหาข้อมูล</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Filtered Table */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs sm:text-sm font-extrabold text-slate-800">
            ตารางสรุปรายการสิ่งพิมพ์ตามเงื่อนไข ({filteredBooks.length} รายการ)
          </div>
          <div className="text-xs text-slate-400">
            มูลค่าคงเหลือ = ราคาจำหน่าย × จำนวนคงเหลือ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-xs">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">ลำดับ</th>
                <th className="px-4 py-3.5 w-16">รูปปก</th>
                <th className="px-4 py-3.5">ชื่อหนังสือ</th>
                <th className="px-4 py-3.5">ผู้แต่ง</th>
                <th className="px-4 py-3.5 text-center">จำนวนหน้า</th>
                <th className="px-4 py-3.5">ISBN</th>
                <th className="px-4 py-3.5 text-center">ปีที่พิมพ์</th>
                <th className="px-4 py-3.5 text-right">ราคา</th>
                <th className="px-4 py-3.5 text-right">จำนวนคงเหลือ</th>
                <th className="px-4 py-3.5 text-right font-black text-rose-800">
                  มูลค่าคงเหลือ
                </th>
                <th className="px-4 py-3.5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    {books.length === 0
                      ? 'ยังไม่มีรายการหนังสือในระบบ สามารถเริ่มต้นเพิ่มหนังสือใหม่ได้ที่เมนู "เพิ่มหนังสือ"'
                      : 'ไม่พบข้อมูลหนังสือที่ตรงกับตัวกรอง'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book, idx) => {
                  const remainingValue = (book.stock_quantity || 0) * (book.price || 0);
                  return (
                    <tr
                      key={book.id}
                      onClick={() => onSelectBook(book)}
                      className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 w-16">
                        <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200/90 shadow-xs flex-shrink-0">
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
                      <td className="px-4 py-3 font-bold text-slate-900 max-w-xs">
                        <div className="line-clamp-2 hover:text-rose-800">{book.book_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {book.category || 'สิ่งพิมพ์วิชาการ'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{book.author}</td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs">
                        {book.pages}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {book.isbn || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs">
                        พ.ศ. {book.published_year}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatBaht(book.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {book.stock_quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-800">
                        {formatBaht(remainingValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StockBadge quantity={book.stock_quantity} size="sm" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredBooks.length > 0 && (
              <tfoot className="bg-slate-50/90 font-bold text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={7} className="px-4 py-3.5 text-right text-xs uppercase tracking-wider text-slate-500">
                    รวมทั้งสิ้น ({filteredBooks.length} รายการ):
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-slate-500">-</td>
                  <td className="px-4 py-3.5 text-right text-sm text-blue-700 font-black">
                    {formatNumber(summaryStats.totalCopies)} เล่ม
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm text-rose-800 font-black">
                    {formatBaht(summaryStats.totalStockValue)}
                  </td>
                  <td className="px-4 py-3.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
