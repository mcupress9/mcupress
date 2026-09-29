import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Zap,
  Crown,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeSupabaseStatus,
  SupabaseConnectionStatus,
  SUPABASE_SCHEMA_SQL,
  SUPABASE_URL,
} from '../services/supabase';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  lowStockCount: number;
  onNavigateToStock: () => void;
  currentTabTitle?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  lowStockCount,
  onNavigateToStock,
  currentTabTitle = 'Dashboard',
  subtitle = 'ภาพรวมระบบสต๊อกหนังสือ สำนักพิมพ์ มจร.',
}) => {
  const { currentUser } = useAuth();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>('connecting');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSupabaseStatus((status) => {
      setSupabaseStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F3DDE7] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Current Page Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#ED1760] hover:bg-[#FCE7F3] transition-colors focus:outline-none cursor-pointer"
            aria-label="เปิดเมนูนำทาง"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight leading-tight">
                {currentTabTitle}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
                MCU Press
              </span>
            </div>
            <p className="text-xs font-normal text-[#64748B] line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Supabase Status Badge, Notification & User Profile Card */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Supabase Connection Status Badge */}
          {supabaseStatus === 'connected' && (
            <button
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-bold select-none shadow-2xs hover:bg-[#D1FAE5] transition-colors cursor-pointer"
              title="Supabase: เชื่อมต่อฐานข้อมูลคลาวด์และซิงค์เรียลไทม์ (คลิกเพื่อดู Schema SQL)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </span>
              <span className="text-[11px] font-bold tracking-tight">⚡ SUPABASE: เชื่อมต่ออยู่</span>
            </button>
          )}

          {supabaseStatus === 'connecting' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold select-none shadow-2xs"
              title="กำลังเชื่อมต่อ Supabase..."
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
              </span>
              <span className="text-[11px] font-bold tracking-tight">⚡ SUPABASE: กำลังเชื่อมต่อ</span>
            </div>
          )}

          {supabaseStatus === 'tables_missing' && (
            <button
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold select-none shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer animate-pulse"
              title="ตาราง Supabase ยังไม่ได้ถูกสร้าง คลิกเพื่อคัดลอกคำสั่ง SQL สร้างตาราง"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold tracking-tight">⚠️ SUPABASE: ยังไม่ได้สร้างตาราง</span>
            </button>
          )}

          {supabaseStatus === 'fallback_local' && (
            <button
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] text-slate-700 border border-slate-200 text-xs font-bold select-none shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
              title="ทำงานในโหมด LocalStorage Fallback (คลิกเพื่อดูการตั้งค่า Supabase)"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
              </span>
              <span className="text-[11px] font-bold tracking-tight">⚡ SUPABASE: โหมด Local</span>
            </button>
          )}

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="relative p-2.5 rounded-[14px] text-[#64748B] hover:text-[#ED1760] hover:bg-[#FCE7F3] border border-[#F3DDE7] transition-all duration-150 cursor-pointer shadow-2xs"
              title="การแจ้งเตือน"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-4.5 h-4.5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED1760] opacity-75"></span>
                  <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-[#ED1760] text-white text-[9px] font-bold">
                    {lowStockCount > 9 ? '9+' : lowStockCount}
                  </span>
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotificationPopup && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[20px] border border-[#F3DDE7] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#ED1760]" />
                    <span className="text-xs font-bold text-[#111827]">
                      การแจ้งเตือนสต๊อกหนังสือ
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-full">
                    {lowStockCount} รายการ
                  </span>
                </div>

                <div className="py-3 space-y-2 max-h-60 overflow-y-auto">
                  {lowStockCount > 0 ? (
                    <div className="p-3 rounded-[14px] bg-[#FFFBEB] border border-[#FDE68A] text-xs">
                      <div className="flex items-center gap-2 font-bold text-[#B45309]">
                        <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                        <span>หนังสือใกล้หมด / หมดสต๊อก</span>
                      </div>
                      <p className="text-[#92400E] text-[11px] mt-1">
                        มีหนังสือจำนวน {lowStockCount} ชื่อเรื่อง ที่ต้องการการรับเข้าหรือพิมพ์เพิ่ม
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                      <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                      <span>สต๊อกหนังสือทุกรายการอยู่ในเกณฑ์ปกติ</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowNotificationPopup(false);
                      onNavigateToStock();
                    }}
                    className="w-full py-2 px-3 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-[#ED1760]/20 transition-all cursor-pointer"
                  >
                    <span>เปิดหน้าจัดการสต๊อก</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card: พระมหาคณัย สุมน, ดร. / ผู้ดูแลระบบ (Admin) */}
          {currentUser && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-[#F3DDE7] hover:border-[#ED1760]/40 rounded-[16px] shadow-2xs transition-colors">
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                    currentUser.role === 'Admin'
                      ? 'bg-[#ED1760]'
                      : currentUser.role === 'Manager'
                      ? 'bg-[#D41456]'
                      : 'bg-slate-700'
                  }`}
                >
                  {currentUser.role === 'Admin' ? (
                    <Crown className="w-4 h-4 text-white" />
                  ) : currentUser.role === 'Manager' ? (
                    <ShieldCheck className="w-4 h-4 text-white" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#111827] line-clamp-1 max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-medium text-[#64748B]">
                  {currentUser.role === 'Admin'
                    ? 'ผู้ดูแลระบบ (Admin)'
                    : currentUser.role === 'Manager'
                    ? 'หัวหน้างาน (Manager)'
                    : 'เจ้าหน้าที่ (Staff)'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Schema / Database Info Modal */}
      {showSqlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowSqlModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#F3DDE7] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FCF8FA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ED1760]/10 text-[#ED1760] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    คำสั่งสร้างตารางฐานข้อมูล Supabase (SQL Schema)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    MCU Press Book Inventory • PostgreSQL Database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">สถานะ Supabase: {supabaseStatus === 'connected' ? 'เชื่อมต่อเรียบร้อยแล้ว' : supabaseStatus === 'tables_missing' ? 'ยังไม่ได้รัน SQL สร้างตาราง' : 'โหมด LocalStorage Fallback'}</div>
                  <div className="text-[11px] text-[#047857] mt-0.5">
                    Endpoint: <code className="bg-emerald-100 px-1 py-0.5 rounded text-[10px] font-mono">{SUPABASE_URL || 'bofzxwwdzhoebuooeiqx.supabase.co'}</code>
                  </div>
                </div>
              </div>

              {supabaseStatus === 'tables_missing' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>คำแนะนำ: ตารางยังไม่ได้ถูกสร้างใน Supabase</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    โปรดกดปุ่ม <strong>"คัดลอกคำสั่ง SQL"</strong> ด้านล่าง แล้วนำไปเปิดที่ <strong>Supabase Dashboard &gt; SQL Editor</strong> แล้วกด Run เพียงครั้งเดียว ระบบจะสร้างตาราง `books`, `transactions`, `users` พร้อม RLS และ Realtime ให้ทันที
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#111827]">PostgreSQL Schema Script:</span>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-[10px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกคำสั่ง SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#111827] text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-[#FCF8FA] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                ระบบมีระบบแคช LocalStorage ทำงานอัตโนมัติ ข้อมูลไม่สูญหาย
              </span>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
