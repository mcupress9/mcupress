import React, { useState } from 'react';
import {
  Menu,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

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
  currentTabTitle = 'หน้าหลัก',
  subtitle = 'ภาพรวมระบบสต๊อกหนังสือ สำนักพิมพ์ มจร.',
}) => {
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F3DDE7] px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5 transition-all">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Current Page Header */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-[#ED1760] hover:bg-[#FCE7F3] transition-colors focus:outline-none cursor-pointer flex-shrink-0"
            aria-label="เปิดเมนูนำทาง"
          >
            <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-xl font-extrabold text-[#111827] tracking-tight leading-tight truncate">
                {currentTabTitle}
              </h1>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-[6px] sm:rounded-[8px] text-[9px] sm:text-[10px] font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7] flex-shrink-0">
                MCU Press
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-normal text-[#64748B] truncate mt-0.2 sm:mt-0.5 max-w-[200px] sm:max-w-none">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Notification & User Profile Card */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 relative flex-shrink-0">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-[14px] text-[#64748B] hover:text-[#ED1760] hover:bg-[#FCE7F3] border border-[#F3DDE7] transition-all duration-150 cursor-pointer shadow-2xs"
              title="การแจ้งเตือน"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
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
        </div>
      </div>
    </header>
  );
};
