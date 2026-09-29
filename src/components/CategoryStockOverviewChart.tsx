import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import {
  BarChart3,
  Layers,
  ArrowUpDown,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Boxes,
  Sparkles,
  PieChart as PieChartIcon,
  BookOpen,
} from 'lucide-react';
import { Book } from '../types';

interface CategoryStockOverviewChartProps {
  books: Book[];
  totalWarehouseCopies: number;
  totalWarehouseValue: number;
  formatNumber: (n: number) => string;
  formatBaht: (n: number) => string;
  onFilterByCategory?: (category: string) => void;
}

type MetricMode = 'copies' | 'status_breakdown' | 'value' | 'titles';
type SortOrder = 'desc' | 'asc' | 'alpha';
type ChartOrientation = 'vertical' | 'horizontal';

// Theme palette for MCU Press categories
const CATEGORY_COLORS = [
  '#ED1760', // MCU Primary Pink
  '#0284c7', // sky-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#D41456', // MCU Primary Dark
  '#475569', // slate-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
];

export const CategoryStockOverviewChart: React.FC<CategoryStockOverviewChartProps> = ({
  books,
  totalWarehouseCopies,
  totalWarehouseValue,
  formatNumber,
  formatBaht,
  onFilterByCategory,
}) => {
  const [metric, setMetric] = useState<MetricMode>('copies');
  const [orientation, setOrientation] = useState<ChartOrientation>('vertical');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group books by category and calculate statistics
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      {
        category: string;
        totalCopies: number;
        totalValue: number;
        titlesCount: number;
        inStockCopies: number;
        inStockTitles: number;
        lowStockCopies: number;
        lowStockTitles: number;
        outOfStockTitles: number;
      }
    > = {};

    books.forEach((book) => {
      const cat = book.category?.trim() || 'สิ่งพิมพ์ทั่วไป';
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          totalCopies: 0,
          totalValue: 0,
          titlesCount: 0,
          inStockCopies: 0,
          inStockTitles: 0,
          lowStockCopies: 0,
          lowStockTitles: 0,
          outOfStockTitles: 0,
        };
      }

      const qty = Number(book.stock_quantity) || 0;
      const price = Number(book.price) || 0;

      map[cat].totalCopies += qty;
      map[cat].totalValue += qty * price;
      map[cat].titlesCount += 1;

      if (qty === 0) {
        map[cat].outOfStockTitles += 1;
      } else if (qty <= 10) {
        map[cat].lowStockCopies += qty;
        map[cat].lowStockTitles += 1;
      } else {
        map[cat].inStockCopies += qty;
        map[cat].inStockTitles += 1;
      }
    });

    let list = Object.values(map).map((item) => {
      const sharePct =
        totalWarehouseCopies > 0
          ? Math.round((item.totalCopies / totalWarehouseCopies) * 1000) / 10
          : 0;
      return {
        ...item,
        // Clean truncated label for axis ticks
        displayName:
          item.category.length > 18
            ? item.category.substring(0, 16) + '...'
            : item.category,
        sharePct,
      };
    });

    // Sort order
    if (sortOrder === 'desc') {
      if (metric === 'value') {
        list.sort((a, b) => b.totalValue - a.totalValue);
      } else if (metric === 'titles') {
        list.sort((a, b) => b.titlesCount - a.titlesCount);
      } else {
        list.sort((a, b) => b.totalCopies - a.totalCopies);
      }
    } else if (sortOrder === 'asc') {
      if (metric === 'value') {
        list.sort((a, b) => a.totalValue - b.totalValue);
      } else if (metric === 'titles') {
        list.sort((a, b) => a.titlesCount - b.titlesCount);
      } else {
        list.sort((a, b) => a.totalCopies - b.totalCopies);
      }
    } else {
      list.sort((a, b) => a.category.localeCompare(b.category, 'th'));
    }

    return list;
  }, [books, totalWarehouseCopies, sortOrder, metric]);

  // Insights / Key Takeaways
  const insights = useMemo(() => {
    if (categoryStats.length === 0) {
      return {
        topCategory: null,
        topTitlesCategory: null,
        avgCopies: 0,
        lowStockAlertCategory: null,
      };
    }

    const sortedByCopies = [...categoryStats].sort((a, b) => b.totalCopies - a.totalCopies);
    const sortedByTitles = [...categoryStats].sort((a, b) => b.titlesCount - a.titlesCount);
    const sortedByNeed = [...categoryStats].sort(
      (a, b) => b.lowStockTitles + b.outOfStockTitles - (a.lowStockTitles + a.outOfStockTitles)
    );

    const totalCopies = categoryStats.reduce((sum, c) => sum + c.totalCopies, 0);
    const avgCopies = Math.round(totalCopies / categoryStats.length);

    return {
      topCategory: sortedByCopies[0] || null,
      topTitlesCategory: sortedByTitles[0] || null,
      avgCopies,
      lowStockAlertCategory: sortedByNeed[0]?.lowStockTitles > 0 ? sortedByNeed[0] : null,
    };
  }, [categoryStats]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-rose-200/90 shadow-xl text-xs space-y-2 min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between gap-2">
            <span className="truncate">{data.category}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              {data.sharePct}% ของคลัง
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-400">จำนวนคงเหลือรวม:</span>
              <span className="font-extrabold text-blue-700 text-sm">
                {formatNumber(data.totalCopies)} เล่ม
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-400">จำนวนชื่อเรื่อง:</span>
              <span className="font-bold text-slate-800">
                {formatNumber(data.titlesCount)} ชื่อเรื่อง
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-400">มูลค่าคงคลังรวม:</span>
              <span className="font-extrabold text-rose-800">
                {formatBaht(data.totalValue)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold">
                <div>พร้อมขาย</div>
                <div className="font-bold text-xs">{data.inStockTitles} เรื่อง</div>
              </div>
              <div className="p-1 rounded-lg bg-amber-50 text-amber-800 font-semibold">
                <div>ใกล้หมด</div>
                <div className="font-bold text-xs">{data.lowStockTitles} เรื่อง</div>
              </div>
              <div className="p-1 rounded-lg bg-rose-50 text-rose-800 font-semibold">
                <div>หมดสต๊อก</div>
                <div className="font-bold text-xs">{data.outOfStockTitles} เรื่อง</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-8 space-y-6">
      {/* 1. Header with Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  กราฟแท่งเปรียบเทียบจำนวนหนังสือคงเหลือแต่ละหมวดหมู่
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200/70">
                  Recharts Overview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                วิเคราะห์การกระจายตัวของสต๊อกสิ่งพิมพ์สำนักพิมพ์ มจร จำแนกตามสาขาวิชาและสถานะคงคลังจริง
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Controls Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Metric Switcher */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-xs font-bold border border-slate-200/70">
            <button
              onClick={() => setMetric('copies')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                metric === 'copies'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="เปรียบเทียบจำนวนเล่มคงเหลือรวม"
            >
              จำนวนเล่มคงเหลือ
            </button>
            <button
              onClick={() => setMetric('status_breakdown')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                metric === 'status_breakdown'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="จำแนกตามสถานะสต๊อก (พร้อมจำหน่าย / ใกล้หมด)"
            >
              จำแนกตามสถานะ
            </button>
            <button
              onClick={() => setMetric('value')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                metric === 'value'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="เปรียบเทียบมูลค่าคงคลังรวม (บาท)"
            >
              มูลค่าคงคลัง (฿)
            </button>
            <button
              onClick={() => setMetric('titles')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                metric === 'titles'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="เปรียบเทียบจำนวนชื่อเรื่องในหมวด"
            >
              จำนวนชื่อเรื่อง
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-xs font-bold border border-slate-200/70">
            <button
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                orientation === 'vertical'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="แท่งแนวตั้ง (Vertical Columns)"
            >
              แนวตั้ง
            </button>
            <button
              onClick={() => setOrientation('horizontal')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                orientation === 'horizontal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="แท่งแนวนอน (Horizontal Bars - อ่านชื่อง่ายขึ้น)"
            >
              แนวนอน
            </button>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => {
              if (sortOrder === 'desc') setSortOrder('asc');
              else if (sortOrder === 'asc') setSortOrder('alpha');
              else setSortOrder('desc');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 text-xs font-bold border border-slate-200/70 transition-colors cursor-pointer"
            title="เปลี่ยนการเรียงลำดับ"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {sortOrder === 'desc'
                ? 'มากไปน้อย'
                : sortOrder === 'asc'
                ? 'น้อยไปมาก'
                : 'ตามชื่อหมวด'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Warehouse Insights KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Top Category by Copies */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>หมวดหมู่สต๊อกคงเหลือสูงสุด</span>
            </div>
            <div className="font-extrabold text-sm text-slate-900 line-clamp-1">
              {insights.topCategory?.category || '-'}
            </div>
            <div className="text-rose-800 font-black text-base mt-1">
              {formatNumber(insights.topCategory?.totalCopies || 0)}{' '}
              <span className="text-xs font-normal text-slate-500">เล่ม</span>
            </div>
          </div>
          {insights.topCategory && (
            <span className="px-2 py-0.5 rounded-md bg-rose-200/70 text-rose-900 font-bold text-[10px]">
              {insights.topCategory.sharePct}%
            </span>
          )}
        </div>

        {/* Most Titles Category */}
        <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>หมวดหมู่ที่มีชื่อเรื่องมากที่สุด</span>
            </div>
            <div className="font-extrabold text-sm text-slate-900 line-clamp-1">
              {insights.topTitlesCategory?.category || '-'}
            </div>
            <div className="text-sky-800 font-black text-base mt-1">
              {formatNumber(insights.topTitlesCategory?.titlesCount || 0)}{' '}
              <span className="text-xs font-normal text-slate-500">ชื่อเรื่อง</span>
            </div>
          </div>
        </div>

        {/* Average Copies per Category */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Boxes className="w-3 h-3" />
            <span>ค่าเฉลี่ยสต๊อกต่อหมวด</span>
          </div>
          <div className="font-extrabold text-sm text-slate-900">
            {categoryStats.length} หมวดหมู่ในระบบ
          </div>
          <div className="text-slate-800 font-black text-base mt-1">
            {formatNumber(insights.avgCopies)}{' '}
            <span className="text-xs font-normal text-slate-500">เล่ม / หมวด</span>
          </div>
        </div>

        {/* Low Stock Alert Category */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>หมวดที่ต้องเฝ้าระวังเติมสต๊อก</span>
          </div>
          <div className="font-extrabold text-sm text-slate-900 line-clamp-1">
            {insights.lowStockAlertCategory?.category || 'ทุกหมวดมีสต๊อกเพียงพอ'}
          </div>
          <div className="text-amber-900 font-bold text-xs mt-1">
            {insights.lowStockAlertCategory
              ? `ใกล้หมด ${insights.lowStockAlertCategory.lowStockTitles} เรื่อง | หมด ${insights.lowStockAlertCategory.outOfStockTitles} เรื่อง`
              : 'สถานะสต๊อกสมบูรณ์'}
          </div>
        </div>
      </div>

      {/* 3. The Recharts Bar Chart Container */}
      <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-200/70">
        {categoryStats.length === 0 ? (
          <div className="h-[240px] flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 border border-rose-100 shadow-2xs">
              <BarChart3 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="text-sm font-bold text-slate-700">ยังไม่มีข้อมูลหมวดหมู่สิ่งพิมพ์</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              เมื่อเริ่มบันทึกหนังสือเล่มแรก กราฟแท่งเปรียบเทียบสัดส่วนสต๊อกแต่ละหมวดหมู่จะประมวลผลขึ้นโดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <>
            <div className="h-[360px] sm:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
            {orientation === 'vertical' ? (
              <BarChart
                data={categoryStats}
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const catName = e.activePayload[0].payload.category;
                    setActiveCategory(catName);
                    if (onFilterByCategory) onFilterByCategory(catName);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayName"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) =>
                    metric === 'value'
                      ? `฿${(val / 1000).toFixed(0)}k`
                      : formatNumber(val)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                {metric === 'status_breakdown' && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                )}

                {metric === 'copies' && (
                  <Bar
                    dataKey="totalCopies"
                    name="จำนวนคงเหลือ (เล่ม)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={600}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          activeCategory === entry.category
                            ? '#be185d'
                            : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="totalCopies"
                      position="top"
                      formatter={(v: any) => (v > 0 ? formatNumber(v) : '')}
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#475569' }}
                    />
                  </Bar>
                )}

                {metric === 'status_breakdown' && (
                  <>
                    <Bar
                      dataKey="inStockCopies"
                      name="พร้อมจำหน่าย (>10 เล่ม)"
                      stackId="a"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="lowStockCopies"
                      name="ใกล้หมด (1-10 เล่ม)"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    />
                  </>
                )}

                {metric === 'value' && (
                  <Bar
                    dataKey="totalValue"
                    name="มูลค่ารวม (บาท)"
                    fill="#9d174d"
                    radius={[8, 8, 0, 0]}
                    animationDuration={600}
                  >
                    <LabelList
                      dataKey="totalValue"
                      position="top"
                      formatter={(v: any) =>
                        v > 0 ? `฿${(v / 1000).toFixed(0)}k` : ''
                      }
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9d174d' }}
                    />
                  </Bar>
                )}

                {metric === 'titles' && (
                  <Bar
                    dataKey="titlesCount"
                    name="จำนวนชื่อเรื่อง"
                    fill="#0284c7"
                    radius={[8, 8, 0, 0]}
                    animationDuration={600}
                  >
                    <LabelList
                      dataKey="titlesCount"
                      position="top"
                      formatter={(v: any) => `${v} เรื่อง`}
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0369a1' }}
                    />
                  </Bar>
                )}
              </BarChart>
            ) : (
              <BarChart
                layout="vertical"
                data={categoryStats}
                margin={{ top: 15, right: 30, left: 40, bottom: 10 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const catName = e.activePayload[0].payload.category;
                    setActiveCategory(catName);
                    if (onFilterByCategory) onFilterByCategory(catName);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) =>
                    metric === 'value'
                      ? `฿${(val / 1000).toFixed(0)}k`
                      : formatNumber(val)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />

                {metric === 'copies' && (
                  <Bar
                    dataKey="totalCopies"
                    name="จำนวนคงเหลือ (เล่ม)"
                    radius={[0, 8, 8, 0]}
                    animationDuration={600}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell
                        key={`cell-h-${index}`}
                        fill={
                          activeCategory === entry.category
                            ? '#be185d'
                            : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="totalCopies"
                      position="right"
                      formatter={(v: any) => `${formatNumber(v)} เล่ม`}
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#334155' }}
                    />
                  </Bar>
                )}

                {metric === 'status_breakdown' && (
                  <>
                    <Bar
                      dataKey="inStockCopies"
                      name="พร้อมจำหน่าย (>10 เล่ม)"
                      stackId="b"
                      fill="#10b981"
                    />
                    <Bar
                      dataKey="lowStockCopies"
                      name="ใกล้หมด (1-10 เล่ม)"
                      stackId="b"
                      fill="#f59e0b"
                      radius={[0, 6, 6, 0]}
                    />
                  </>
                )}

                {metric === 'value' && (
                  <Bar
                    dataKey="totalValue"
                    name="มูลค่ารวม (บาท)"
                    fill="#9d174d"
                    radius={[0, 8, 8, 0]}
                  >
                    <LabelList
                      dataKey="totalValue"
                      position="right"
                      formatter={(v: any) => formatBaht(v)}
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#9d174d' }}
                    />
                  </Bar>
                )}

                {metric === 'titles' && (
                  <Bar
                    dataKey="titlesCount"
                    name="จำนวนชื่อเรื่อง"
                    fill="#0284c7"
                    radius={[0, 8, 8, 0]}
                  >
                    <LabelList
                      dataKey="titlesCount"
                      position="right"
                      formatter={(v: any) => `${v} เรื่อง`}
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0369a1' }}
                    />
                  </Bar>
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
          <div>💡 คลิกที่แท่งกราฟของหมวดหมู่เพื่อดูรายละเอียดหรือเน้นหมวดนั้น ๆ</div>
          <div>* อิงข้อมูลตามตัวกรองปัจจุบัน ({books.length} รายการ)</div>
        </div>
          </>
        )}
      </div>

      {/* 4. Category Breakdown Distribution Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-700" />
            <span>สัดส่วนและรายละเอียดสต๊อกแยกตามหมวดหมู่</span>
          </div>
          <span className="text-[11px] text-slate-400">
            แสดงทั้งหมด {categoryStats.length} หมวดหมู่
          </span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center text-xs text-slate-400">
            ยังไม่มีข้อมูลหมวดหมู่
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStats.map((cat, idx) => {
              const isSelected = activeCategory === cat.category;
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <div
                  key={cat.category}
                  onClick={() => {
                    const newActive = isSelected ? null : cat.category;
                    setActiveCategory(newActive);
                    if (onFilterByCategory) onFilterByCategory(newActive || '');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-2 ring-rose-500/20'
                      : 'border-slate-200/80 bg-white hover:border-rose-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-extrabold text-xs text-slate-900 line-clamp-1">
                      {cat.category}
                    </div>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {cat.sharePct}%
                    </span>
                  </div>

                  {/* Progress proportion bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(3, cat.sharePct))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">คงเหลือ</div>
                      <div className="font-black text-slate-800">
                        {formatNumber(cat.totalCopies)} เล่ม
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">ชื่อเรื่อง</div>
                      <div className="font-bold text-slate-700">
                        {cat.titlesCount} เรื่อง
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100/70 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">มูลค่าคงคลัง:</span>
                    <span className="font-extrabold text-rose-800">
                      {formatBaht(cat.totalValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
