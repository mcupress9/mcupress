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
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PackageCheck,
  Eye,
  SlidersHorizontal,
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
  AreaChart,
  Area,
} from 'recharts';
import { Book, SummaryStats } from '../types';
import { StockBadge } from '../components/StockBadge';
import { getStockStatusText, storageService } from '../services/storage';
import { CategoryStockOverviewChart } from '../components/CategoryStockOverviewChart';

interface SummaryPageProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ books, onSelectBook }) => {
  // Active main tab in Summary Page: 'overview' | 'yearly'
  const [activeTab, setActiveTab] = useState<'overview' | 'yearly'>('yearly');

  // Period filter for general overview
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

  // Yearly Breakdown Specific State
  const [selectedYearTab, setSelectedYearTab] = useState<string>('all');
  const [yearlySearchQuery, setYearlySearchQuery] = useState<string>('');
  const [expandedYearSections, setExpandedYearSections] = useState<Record<number, boolean>>({});

  const toggleYearSection = (year: number) => {
    setExpandedYearSections((prev) => ({
      ...prev,
      [year]: prev[year] === undefined ? false : !prev[year],
    }));
  };

  // Table filters for Overview tab
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

  // Combined filters for main overview table
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

  // ==============================================================
  // 1. YEARLY BREAKDOWN LOGIC & AGGREGATIONS (REQ: ข้อมูลและสต๊อกแต่ละปี)
  // ==============================================================
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

  // Yearly Comparison Chart Data (Copies & Value)
  const yearlyChartData = useMemo(() => {
    return [...yearlyBreakdown]
      .reverse() // show chronological order on charts
      .map((item) => ({
        yearLabel: item.yearLabel,
        yearNum: item.year,
        titles: item.titlesCount,
        copies: item.totalCopies,
        value: item.totalValue,
      }));
  }, [yearlyBreakdown]);

  // Filtered books for Yearly Breakdown view based on selected tab and search
  const displayedYearlyBreakdown = useMemo(() => {
    let list = yearlyBreakdown;
    if (selectedYearTab !== 'all') {
      const yrNum = Number(selectedYearTab);
      list = list.filter((item) => item.year === yrNum);
    }

    const q = yearlySearchQuery.trim().toLowerCase();
    if (!q) return list;

    return list
      .map((item) => {
        const matchedBooks = item.books.filter(
          (b) =>
            b.book_name.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.isbn && b.isbn.toLowerCase().includes(q)) ||
            (b.category && b.category.toLowerCase().includes(q))
        );
        return {
          ...item,
          books: matchedBooks,
        };
      })
      .filter((item) => item.books.length > 0);
  }, [yearlyBreakdown, selectedYearTab, yearlySearchQuery]);

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
      .sort((a, b) => b.stock_quantity * b.price - a.stock_quantity * a.price)
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
  const exportCSV = (yearFilter?: number) => {
    const targetBooks = yearFilter
      ? books.filter((b) => b.published_year === yearFilter)
      : filteredBooks;

    const headers = [
      'ลำดับ',
      'ปีที่พิมพ์ (พ.ศ.)',
      'ชื่อหนังสือ',
      'ผู้แต่ง',
      'หมวดหมู่',
      'จำนวนหน้า',
      'ISBN',
      'ราคา (บาท)',
      'จำนวนคงเหลือ (เล่ม)',
      'มูลค่าคงเหลือ (บาท)',
      'สถานะ',
    ];

    const rows = targetBooks.map((b, index) => [
      index + 1,
      b.published_year,
      `"${b.book_name.replace(/"/g, '""')}"`,
      `"${b.author.replace(/"/g, '""')}"`,
      `"${b.category || 'สิ่งพิมพ์วิชาการ'}"`,
      b.pages,
      `"${b.isbn || '-'}"`,
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
    const suffix = yearFilter ? `_ปี${yearFilter}` : '';
    link.setAttribute(
      'download',
      `รายงานสรุปสต๊อกหนังสือ_มจร${suffix}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Excel XML (.xls)
  const exportExcel = (yearFilter?: number) => {
    const targetBooks = yearFilter
      ? books.filter((b) => b.published_year === yearFilter)
      : filteredBooks;

    const title = yearFilter
      ? `รายงานสต๊อกและรายการหนังสือ ประจำปี พ.ศ. ${yearFilter} — สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`
      : 'รายงานสรุปสต๊อกหนังสือ สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย';

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
        <p>ข้อมูล ณ วันที่: ${timestamp} | จำนวนรายการ: ${targetBooks.length} เล่ม</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ปีที่พิมพ์ (พ.ศ.)</th>
              <th>ชื่อหนังสือ</th>
              <th>ผู้แต่ง</th>
              <th>หมวดหมู่</th>
              <th>จำนวนหน้า</th>
              <th>ISBN</th>
              <th>ราคา (บาท)</th>
              <th>จำนวนคงเหลือ (เล่ม)</th>
              <th>มูลค่าคงเหลือ (บาท)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
    `;

    targetBooks.forEach((b, idx) => {
      tableHtml += `
        <tr>
          <td align="center">${idx + 1}</td>
          <td align="center">${b.published_year}</td>
          <td>${b.book_name}</td>
          <td>${b.author}</td>
          <td>${b.category || 'สิ่งพิมพ์วิชาการ'}</td>
          <td align="center" class="num">${b.pages}</td>
          <td>${b.isbn || '-'}</td>
          <td align="right" class="price">${b.price}</td>
          <td align="right" class="num">${b.stock_quantity}</td>
          <td align="right" class="price">${b.stock_quantity * b.price}</td>
          <td align="center">${getStockStatusText(b.stock_quantity)}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const suffix = yearFilter ? `_ปี${yearFilter}` : '';
    link.setAttribute(
      'download',
      `รายงานสรุปสต๊อกหนังสือ_มจร${suffix}_${new Date().toISOString().slice(0, 10)}.xls`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              รายงานและสรุปข้อมูลภาพรวม (Executive Summary)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
              MCU Press Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย — สถิติสต๊อก รายการหนังสือแต่ละปี และเอกสารรายงาน
          </p>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] bg-white border border-[#F3DDE7] hover:border-[#ED1760]/30 text-slate-700 hover:text-[#ED1760] text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
            title="พิมพ์รายงานสรุป"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>

          <button
            onClick={() => exportExcel()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition-colors cursor-pointer"
            title="ส่งออกไฟล์ Excel (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportCSV()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            title="ส่งออกไฟล์ CSV UTF-8"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main Feature Tabs Switcher (Yearly Breakdown vs General Overview) */}
      <div className="bg-white p-1.5 rounded-[18px] border border-[#F3DDE7] shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-4 sm:px-5 py-2.5 rounded-[14px] text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'yearly'
                ? 'bg-[#ED1760] text-white shadow-sm shadow-[#ED1760]/25'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-[#FCF8FA]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>หนังสือและสต๊อกของแต่ละปี (Yearly Breakdown)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'yearly' ? 'bg-white/20 text-white' : 'bg-[#FCE7F3] text-[#ED1760]'
              }`}
            >
              {yearlyBreakdown.length} ปี
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-5 py-2.5 rounded-[14px] text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#ED1760] text-white shadow-sm shadow-[#ED1760]/25'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-[#FCF8FA]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ภาพรวมและหมวดหมู่ (Overview & Categories)</span>
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="flex items-center bg-[#FCF8FA] p-1 rounded-[12px] border border-[#F3DDE7] text-xs font-bold">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1 rounded-[8px] transition-all cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-3 py-1 rounded-[8px] transition-all cursor-pointer ${
                periodFilter === 'today'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1 rounded-[8px] transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              สัปดาห์นี้
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1 rounded-[8px] transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1 rounded-[8px] transition-all cursor-pointer ${
                periodFilter === 'year'
                  ? 'bg-[#ED1760] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              ปีนี้
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: YEARLY BREAKDOWN (หนังสือแต่ละปีมีอะไรบ้าง + สต๊อกแต่ละปี) */}
      {/* ============================================================== */}
      {activeTab === 'yearly' && (
        <div className="space-y-6">
          {/* Top KPI Cards per Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {yearlyBreakdown.map((item) => {
              const isSelected = selectedYearTab === item.year.toString();
              return (
                <div
                  key={item.year}
                  onClick={() => setSelectedYearTab(isSelected ? 'all' : item.year.toString())}
                  className={`p-5 rounded-[20px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-white via-[#FFF1F7] to-[#FCE7F3] border-[#ED1760] shadow-md ring-2 ring-[#ED1760]/30'
                      : 'bg-white border-[#F3DDE7] hover:border-[#ED1760]/40 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-[10px] text-xs font-black ${
                        isSelected
                          ? 'bg-[#ED1760] text-white shadow-xs'
                          : 'bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]'
                      }`}
                    >
                      {item.yearLabel}
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">
                      {item.titlesCount} ชื่อเรื่อง
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-[#64748B] font-semibold">ยอดสต๊อกคงเหลือรวม</div>
                    <div className="text-3xl font-black text-[#111827] tabular-nums tracking-tight">
                      {formatNumber(item.totalCopies)}{' '}
                      <span className="text-xs font-normal text-[#64748B]">เล่ม</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F3DDE7]/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#ED1760] tabular-nums">
                      มูลค่า: {formatBaht(item.totalValue)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-[#10B981] font-bold" title="พร้อมจำหน่าย">
                        ✓{item.inStock}
                      </span>
                      <span className="text-[#F59E0B] font-bold" title="ใกล้หมด">
                        !{item.lowStock}
                      </span>
                      <span className="text-[#EF4444] font-bold" title="หมดสต๊อก">
                        ✕{item.outOfStock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Yearly Comparison Charts (Copies & Value Bar Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Stock Quantity by Year */}
            <div className="lg:col-span-6 bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center border border-[#A7F3D0]">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827]">
                      ยอดสต๊อกคงเหลือแยกตามปีที่พิมพ์ (จำนวนเล่ม)
                    </h3>
                    <p className="text-[11px] text-[#64748B]">เปรียบเทียบปริมาณสต๊อกที่มีในแต่ละปี</p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3DDE7" />
                    <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(val: any) => [`${formatNumber(Number(val))} เล่ม`, 'สต๊อกคงเหลือ']}
                      contentStyle={{
                        borderRadius: '14px',
                        borderColor: '#F3DDE7',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="copies" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Stock Value by Year */}
            <div className="lg:col-span-6 bg-white p-6 rounded-[20px] border border-[#F3DDE7] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center border border-[#F3DDE7]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#111827]">
                      มูลค่าคลังสต๊อกแยกตามปีที่พิมพ์ (บาท)
                    </h3>
                    <p className="text-[11px] text-[#64748B]">มูลค่าประเมินตามราคาปกสิ่งพิมพ์คงคลัง</p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3DDE7" />
                    <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatBaht(Number(val)), 'มูลค่าสต๊อก']}
                      contentStyle={{
                        borderRadius: '14px',
                        borderColor: '#F3DDE7',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="value" fill="#ED1760" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Year Filter Ribbon & Search Bar for Books Breakdown */}
          <div className="bg-white p-4 sm:p-5 rounded-[20px] border border-[#F3DDE7] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Year Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-[#64748B] flex-shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#ED1760]" />
                <span>เลือกปี:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedYearTab('all')}
                className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  selectedYearTab === 'all'
                    ? 'bg-[#ED1760] text-white shadow-xs'
                    : 'bg-[#FCF8FA] text-[#64748B] hover:text-[#ED1760] border border-[#F3DDE7]'
                }`}
              >
                <span>แสดงทุกปี</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedYearTab === 'all'
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
                  onClick={() => setSelectedYearTab(item.year.toString())}
                  className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                    selectedYearTab === item.year.toString()
                      ? 'bg-[#ED1760] text-white shadow-xs'
                      : 'bg-[#FCF8FA] text-[#111827] hover:text-[#ED1760] border border-[#F3DDE7]'
                  }`}
                >
                  <span>{item.yearLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedYearTab === item.year.toString()
                        ? 'bg-white/20 text-white'
                        : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                    }`}
                  >
                    {item.totalCopies} เล่ม
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input for books inside yearly breakdown */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={yearlySearchQuery}
                onChange={(e) => setYearlySearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหนังสือ / ผู้แต่งในรายงานปี..."
                className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[#FCF8FA] border border-[#F3DDE7] text-xs text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ED1760] transition-colors"
              />
            </div>
          </div>

          {/* Year-by-Year Book Catalog & Stock Detail Tables */}
          <div className="space-y-6">
            {displayedYearlyBreakdown.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#F3DDE7] p-12 text-center max-w-md mx-auto shadow-2xs">
                <Calendar className="w-10 h-10 text-[#ED1760] mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-extrabold text-[#111827]">
                  ไม่พบข้อมูลหนังสือในปีที่ระบุ
                </h4>
                <p className="text-xs text-[#64748B] mt-1">
                  ลองล้างคำค้นหาหรือเลือกดูปีอื่น ๆ ที่มีการตีพิมพ์สิ่งพิมพ์
                </p>
              </div>
            ) : (
              displayedYearlyBreakdown.map((yearGroup) => {
                const isExpanded = expandedYearSections[yearGroup.year] !== false; // default open
                return (
                  <div
                    key={yearGroup.year}
                    className="bg-white rounded-[22px] border border-[#F3DDE7] shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Header Banner for This Year */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FCF8FA] via-white to-[#FCE7F3]/25 border-b border-[#F3DDE7] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 rounded-[12px] bg-[#ED1760] text-white font-black text-sm shadow-xs shadow-[#ED1760]/20 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{yearGroup.yearLabel}</span>
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#111827]">
                            รายการหนังสือที่พิมพ์ปี {yearGroup.year}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 flex-wrap">
                            <span>
                              จำนวน <strong>{yearGroup.titlesCount}</strong> ชื่อเรื่อง
                            </span>
                            <span>·</span>
                            <span>
                              สต๊อกคงเหลือรวม{' '}
                              <strong className="text-[#10B981] font-black">
                                {formatNumber(yearGroup.totalCopies)}
                              </strong>{' '}
                              เล่ม
                            </span>
                            <span>·</span>
                            <span>
                              มูลค่าสต๊อกรวม{' '}
                              <strong className="text-[#ED1760] font-black">
                                {formatBaht(yearGroup.totalValue)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Controls */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-[10px] bg-[#ECFDF5] text-[#065F46] font-bold text-xs border border-[#A7F3D0]">
                          พร้อมจำหน่าย: {yearGroup.inStock}
                        </span>
                        <span className="px-2.5 py-1 rounded-[10px] bg-[#FFFBEB] text-[#92400E] font-bold text-xs border border-[#FDE68A]">
                          ใกล้หมด: {yearGroup.lowStock}
                        </span>
                        <span className="px-2.5 py-1 rounded-[10px] bg-[#FEF2F2] text-[#991B1B] font-bold text-xs border border-[#FECACA]">
                          หมดสต๊อก: {yearGroup.outOfStock}
                        </span>

                        <button
                          type="button"
                          onClick={() => exportExcel(yearGroup.year)}
                          className="px-2.5 py-1 rounded-[10px] bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                          title={`ส่งออก Excel ปี ${yearGroup.year}`}
                        >
                          Excel ปีนี้
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleYearSection(yearGroup.year)}
                          className="p-1.5 rounded-[10px] text-[#64748B] hover:text-[#111827] hover:bg-[#FCF8FA] border border-[#F3DDE7] transition-colors cursor-pointer"
                          title={isExpanded ? 'ย่อตาราง' : 'ขยายตาราง'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Book List Table for this year */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-[#FCF8FA] text-xs text-[#64748B] font-bold border-b border-[#F3DDE7]">
                            <tr>
                              <th className="px-5 py-3 w-14 text-center">ลำดับ</th>
                              <th className="px-5 py-3 w-16">หน้าปก</th>
                              <th className="px-5 py-3">ชื่อหนังสือ / ผู้แต่ง</th>
                              <th className="px-5 py-3">หมวดหมู่</th>
                              <th className="px-5 py-3">ISBN</th>
                              <th className="px-5 py-3 text-right">ราคาปก</th>
                              <th className="px-5 py-3 text-center">คงเหลือในสต๊อก</th>
                              <th className="px-5 py-3 text-right">มูลค่าสต๊อกรวม</th>
                              <th className="px-5 py-3 text-center">สถานะ</th>
                              <th className="px-5 py-3 text-right">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F3DDE7]/50">
                            {yearGroup.books.map((book, idx) => {
                              const lineValue = (book.stock_quantity || 0) * (book.price || 0);
                              return (
                                <tr
                                  key={book.id}
                                  onClick={() => onSelectBook(book)}
                                  className="hover:bg-[#FCE7F3]/15 transition-colors cursor-pointer"
                                >
                                  <td className="px-5 py-3.5 text-center font-bold text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="w-11 h-15 rounded-md overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-2xs flex-shrink-0">
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
                                  <td className="px-5 py-3.5 max-w-sm">
                                    <div className="font-extrabold text-[#111827] line-clamp-1 hover:text-[#ED1760] transition-colors">
                                      {book.book_name}
                                    </div>
                                    <div className="text-[11px] text-[#64748B] mt-0.5">
                                      ผู้แต่ง: {book.author}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-[#111827]">
                                    <span className="bg-[#FCF8FA] px-2 py-0.5 rounded-[6px] border border-[#F3DDE7] text-[11px]">
                                      {book.category || 'สิ่งพิมพ์วิชาการ'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-[#64748B] font-mono">
                                    {book.isbn || '-'}
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-bold text-[#111827] tabular-nums">
                                    {formatBaht(book.price)}
                                  </td>
                                  <td className="px-5 py-3.5 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <span className="text-sm font-black text-[#111827] tabular-nums">
                                        {book.stock_quantity}
                                      </span>
                                      <span className="text-xs text-[#64748B]">เล่ม</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-black text-[#ED1760] tabular-nums">
                                    {formatBaht(lineValue)}
                                  </td>
                                  <td className="px-5 py-3.5 text-center">
                                    <StockBadge quantity={book.stock_quantity} size="sm" />
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectBook(book);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#FCE7F3] hover:bg-[#ED1760] text-[#ED1760] hover:text-white text-xs font-bold transition-colors cursor-pointer border border-[#F3DDE7]"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>รายละเอียด</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-[#FCF8FA] font-bold text-[#111827] border-t-2 border-[#F3DDE7]">
                            <tr>
                              <td
                                colSpan={6}
                                className="px-5 py-3 text-right text-xs uppercase tracking-wider text-[#64748B]"
                              >
                                รวมสต๊อกปี {yearGroup.year} ({yearGroup.books.length} รายการ):
                              </td>
                              <td className="px-5 py-3 text-center text-sm font-black text-[#10B981]">
                                {formatNumber(yearGroup.totalCopies)} เล่ม
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-black text-[#ED1760]">
                                {formatBaht(yearGroup.totalValue)}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: OVERVIEW & CATEGORIES (สถิติรวม & หมวดหมู่) */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
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

          {/* Top 5 Rankings Table */}
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
                      <td
                        colSpan={7}
                        className="px-4 py-3.5 text-right text-xs uppercase tracking-wider text-slate-500"
                      >
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
      )}
    </div>
  );
};
