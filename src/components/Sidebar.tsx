import React from 'react';
import {
  LayoutDashboard,
  BookMarked,
  PlusCircle,
  PackageCheck,
  BarChart4,
  Settings2,
  X,
  GraduationCap,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'books'
  | 'add-book'
  | 'stock'
  | 'summary'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'หน้าหลัก',
      icon: LayoutDashboard,
      description: 'ภาพรวมระบบสต๊อก',
    },
    {
      id: 'books' as NavTab,
      label: 'หนังสือ',
      icon: BookMarked,
      description: 'แคตตาล็อก & รายการหนังสือ',
    },
    {
      id: 'add-book' as NavTab,
      label: 'เพิ่มหนังสือ',
      icon: PlusCircle,
      description: 'ลงทะเบียนสิ่งพิมพ์ใหม่',
    },
    {
      id: 'stock' as NavTab,
      label: 'สต๊อก',
      icon: PackageCheck,
      description: 'รับเข้า / ปรับปรุงสต๊อก',
    },
    {
      id: 'summary' as NavTab,
      label: 'สรุปข้อมูล',
      icon: BarChart4,
      description: 'รายงาน & ส่งออก Excel',
    },
    {
      id: 'settings' as NavTab,
      label: 'ตั้งค่าระบบ',
      icon: Settings2,
      description: 'ข้อมูลสำนักพิมพ์ & สำรอง',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#F3DDE7] w-[272px] select-none shadow-[2px_0_12px_rgba(237,23,96,0.03)]">
      {/* Top Header in Sidebar */}
      <div className="p-5 border-b border-[#F3DDE7] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo MCU Press */}
            <div className="relative">
              <div className="w-10 h-10 rounded-[12px] bg-[#ED1760] text-white flex items-center justify-center shadow-sm shadow-[#ED1760]/30 ring-2 ring-[#FCE7F3]">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-extrabold text-[#111827] tracking-tight truncate">
                  สำนักพิมพ์ มจร.
                </span>
                <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]">
                  PRESS
                </span>
              </div>
              <div className="text-[11px] font-medium text-[#64748B] truncate mt-0.5" title="มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </div>
            </div>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-[#ED1760] hover:bg-[#FCE7F3] transition-colors"
              aria-label="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>เมนูระบบ</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-150 text-left relative cursor-pointer group ${
                isActive
                  ? 'bg-[#ED1760] text-white shadow-sm shadow-[#ED1760]/25 font-bold'
                  : 'text-[#475569] hover:bg-[#FCE7F3] hover:text-[#ED1760]'
              }`}
            >
              {/* Subtle active left bar indicator */}
              {isActive && (
                <span className="absolute -left-1 top-2 bottom-2 w-1.5 bg-[#D41456] rounded-r-full shadow-xs" />
              )}

              <div
                className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-[#64748B] group-hover:text-[#ED1760]'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="leading-tight truncate font-medium">
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-white z-10 animate-in slide-in-from-left duration-200 shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
