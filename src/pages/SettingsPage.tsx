import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Sparkles,
  BookOpen,
  Type,
  Trash2,
  Zap,
  Copy,
  Check,
  Code,
} from 'lucide-react';
import { storageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { FONT_THEMES, themeService } from '../services/theme';
import {
  subscribeSupabaseStatus,
  SupabaseConnectionStatus,
  SUPABASE_SCHEMA_SQL,
  SUPABASE_URL,
} from '../services/supabase';

interface SettingsPageProps {
  onDataReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataReset }) => {
  const { isAdmin } = useAuth();
  const [notification, setNotification] = useState('');
  const [currentFont, setCurrentFont] = useState(() => themeService.getCurrentFontTheme());
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>('connecting');
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  useEffect(() => {
    const unsub = subscribeSupabaseStatus((status) => {
      setSupabaseStatus(status);
    });
    return () => unsub();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setIsCopiedSql(true);
    setNotification('คัดลอกคำสั่ง SQL Schema สำหรับสร้างตารางบน Supabase เรียบร้อยแล้ว');
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  const handleFontSelect = (themeId: string) => {
    themeService.applyFontTheme(themeId);
    setCurrentFont(themeId);
    const chosen = FONT_THEMES.find((f) => f.id === themeId);
    setNotification(`เปลี่ยนฟอนต์ตัวหนังสือเป็น "${chosen?.name}" สำเร็จ`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleExportBackup = () => {
    const books = storageService.getBooks();
    const txs = storageService.getTransactions();
    const users = storageService.getUsers();

    const backupData = {
      app: 'MCU_PRESS_INVENTORY_SYSTEM',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        books,
        transactions: txs,
        users,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcu_press_inventory_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setNotification('ส่งออกไฟล์สำรองข้อมูล (Backup JSON) สำเร็จ');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && Array.isArray(parsed.data.books)) {
          storageService.saveBooks(parsed.data.books);
          if (Array.isArray(parsed.data.transactions)) {
            localStorage.setItem(
              'mcu_press_transactions_v1',
              JSON.stringify(parsed.data.transactions)
            );
          }
          if (Array.isArray(parsed.data.users)) {
            storageService.saveUsers(parsed.data.users);
          }
          setNotification('กู้คืนข้อมูลสำเร็จ ระบบได้อัปเดตข้อมูลตามไฟล์สำรองเรียบร้อยแล้ว');
          onDataReset();
          setTimeout(() => setNotification(''), 3500);
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับระบบสำนักพิมพ์ มจร');
        }
      } catch {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นของสำนักพิมพ์ มจร?'
      )
    ) {
      storageService.resetToDefaults();
      setNotification('รีเซ็ตข้อมูลกลับสู่ค่ามาตรฐานของสำนักพิมพ์เรียบร้อยแล้ว');
      onDataReset();
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleClearAllBooks = async () => {
    if (
      window.confirm(
        'ยืนยันการลบข้อมูลหนังสือทั้งหมดหรือไม่?\n\nข้อมูลหนังสือและประวัติการเคลื่อนไหวสต๊อกทั้งหมดจะถูกลบออกจากทั้งเครื่องนี้และฐานข้อมูลคลาวด์ เพื่อให้คุณเริ่มกรอกข้อมูลใหม่ได้ทันที'
      )
    ) {
      await storageService.clearAllBooks();
      setNotification('ลบข้อมูลหนังสือและประวัติสต๊อกทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการบันทึกหนังสือใหม่');
      onDataReset();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ตั้งค่าระบบและองค์กร (System Settings)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          ข้อมูลสำนักพิมพ์ เกณฑ์ระดับสต๊อกสิ่งพิมพ์ และการบริหารจัดการสำรองฐานข้อมูล
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. University Press Information Card */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              ข้อมูลสำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h3>
            <p className="text-xs text-slate-400">
              Mahachulalongkornrajavidyalaya University Press (MCU Press)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
              ชื่อหน่วยงาน
            </div>
            <div className="font-extrabold text-slate-900">
              สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
              หน่วยงานต้นสังกัด
            </div>
            <div className="font-extrabold text-slate-900">
              มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (มจร)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1 sm:col-span-2">
            <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>ที่ตั้งสำนักงานใหญ่ (มจร วังน้อย)</span>
            </div>
            <div className="text-slate-800 font-medium leading-relaxed">
              อาคารสำนักพิมพ์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ๗๙ หมู่ที่ ๑ ถนนพหลโยธิน ตำบลลำไทร
              อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา ๑๓๑๗๐
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1 sm:col-span-2">
            <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>ศูนย์ประสานงานและจัดจำหน่าย ท่าพระจันทร์</span>
            </div>
            <div className="text-slate-800 font-medium leading-relaxed">
              วัดมหาธาตุยุวราชรังสฤษฎิ์ราชวรมหาวิหาร แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร ๑๐๒๐๐
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stock Rules & Thresholds Card */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              เกณฑ์สถานะและเงื่อนไขการแจ้งเตือนสต๊อกหนังสือ
            </h3>
            <p className="text-xs text-slate-400">
              กำหนดเกณฑ์ตามระเบียบงานคลังและสิ่งพิมพ์วิชาการ มจร
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>มีสินค้า (In Stock)</span>
            </div>
            <div className="text-xs text-emerald-950 font-black mt-2">
              จำนวนคงเหลือ &gt; 10 เล่ม
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              พร้อมจำหน่าย จ่ายแจก และสนับสนุนการเรียนการสอน
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>ใกล้หมด (Low Stock)</span>
            </div>
            <div className="text-xs text-amber-950 font-black mt-2">
              จำนวนคงเหลือ 1 - 10 เล่ม
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              ระบบแจ้งเตือนเพื่อเตรียมประสานงานจัดพิมพ์เพิ่มเติม
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80">
            <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>หมดสต๊อก (Out of Stock)</span>
            </div>
            <div className="text-xs text-rose-950 font-black mt-2">
              จำนวนคงเหลือ 0 เล่ม
            </div>
            <div className="text-[11px] text-rose-700 mt-1">
              ระงับการเบิกจ่ายและเสนอขออนุมัติพิมพ์ใหม่
            </div>
          </div>
        </div>
      </div>

      {/* 3. Typography & Appearance */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              รูปแบบตัวอักษรและการแสดงผล (Typography & Appearance)
            </h3>
            <p className="text-xs text-slate-400">
              เลือกฟอนต์สำหรับการแสดงผลทั้งระบบ ออกแบบให้อ่านง่าย สบายตา และทันสมัย
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FONT_THEMES.map((theme) => {
            const isSelected = currentFont === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleFontSelect(theme.id)}
                className={`p-5 rounded-[16px] border transition-all cursor-pointer flex flex-col justify-between relative text-left ${
                  isSelected
                    ? 'border-[#ED1760] bg-[#FCE7F3]/40 shadow-sm ring-2 ring-[#ED1760]/20'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] hover:border-[#ED1760]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-base text-[#111827]">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ใช้งานอยู่</span>
                      </span>
                    )}
                  </div>
                  <span className="inline-block text-[11px] font-bold text-[#ED1760] bg-[#FCE7F3] px-2 py-0.5 rounded-md border border-[#F3DDE7] mb-2">
                    {theme.badge}
                  </span>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                    {theme.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F3DDE7] mt-auto">
                  <div className="text-[11px] font-medium text-[#64748B] mb-1">
                    ตัวอย่างข้อความ:
                  </div>
                  <div
                    className="text-sm font-semibold text-[#111827] line-clamp-1"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    สำนักพิมพ์ มจร ๒๕๖๙ (Stock 2026)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Cloud Database & Real-time Sync Status (Supabase) */}
      <div className="bg-white rounded-3xl border border-[#F3DDE7] shadow-[0_2px_14px_rgba(237,23,96,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center border border-[#A7F3D0] shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  ฐานข้อมูลคลาวด์ออนไลน์ (Cloud Database: Supabase PostgreSQL)
                </h3>
                {supabaseStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                    ⚡ เชื่อมต่อสมบูรณ์ ซิงค์อัตโนมัติ
                  </span>
                )}
                {supabaseStatus === 'connecting' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    กำลังเชื่อมต่อ...
                  </span>
                )}
                {supabaseStatus === 'tables_missing' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ยังไม่ได้สร้างตาราง (ต้องการการรัน SQL)
                  </span>
                )}
                {supabaseStatus === 'fallback_local' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    โหมด LocalStorage Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ข้อมูลหนังสือและประวัติการเคลื่อนไหวสต๊อกจะถูกซิงค์ผ่าน Supabase Realtime โดยอัตโนมัติ พร้อมระบบ LocalStorage Fallback ไร้กังวลเรื่องข้อมูลสูญหาย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {isCopiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คัดลอก SQL แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก Schema SQL</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showSqlPreview ? 'ซ่อนโค้ด' : 'ดูคำสั่ง SQL'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#ECFDF5]/60 border border-[#A7F3D0]/60">
            <div className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider mb-1">
              สถานะการเชื่อมต่อ (Supabase Status)
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-[#064E3B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <span className="line-clamp-1">
                {supabaseStatus === 'connected'
                  ? '⚡ เชื่อมต่ออยู่ (Realtime Sync)'
                  : supabaseStatus === 'tables_missing'
                  ? '⚠️ ยังไม่ได้รันสร้างตาราง'
                  : 'ออนไลน์ / โหมด Local'}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#F3DDE7]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Supabase Project Endpoint
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 line-clamp-1" title={SUPABASE_URL}>
              {SUPABASE_URL || 'bofzxwwdzhoebuooeiqx.supabase.co'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#F3DDE7]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              โครงสร้างตาราง (Database Tables)
            </div>
            <div className="text-xs font-bold text-slate-800">
              public.books, transactions, users
            </div>
          </div>
        </div>

        {showSqlPreview && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">คำสั่ง PostgreSQL DDL Schema สำหรับ Supabase:</span>
              <button
                onClick={handleCopySql}
                className="text-[11px] font-bold text-[#ED1760] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>คัดลอกโค้ดทั้งหมด</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#111827] text-slate-100 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* 5. Database Backup & Restore */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              การจัดการฐานข้อมูลและการสำรองไฟล์ (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-400">
              สำรองข้อมูลสิ่งพิมพ์ บันทึกประวัติสต๊อก และบัญชีผู้ใช้เป็น JSON
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:border-rose-300 transition-colors flex flex-col justify-between space-y-4">
            <div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-rose-700" />
                <span>สำรองข้อมูล (Backup JSON)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ดาวน์โหลดข้อมูลหนังสือทั้งหมด ประวัติสต๊อก และบัญชีผู้ใช้เก็บไว้เป็นไฟล์สำรอง
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              ดาวน์โหลดไฟล์สำรองข้อมูล (.json)
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:border-rose-300 transition-colors flex flex-col justify-between space-y-4">
            <div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-700" />
                <span>กู้คืนข้อมูล (Restore JSON)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                นำเข้าข้อมูลจากไฟล์ JSON ที่เคยสำรองไว้เพื่อนำกลับมาใช้งานใหม่
              </p>
            </div>
            <label className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center">
              <span>เลือกไฟล์สำรองเพื่อกู้คืน</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              การจัดการชุดข้อมูล: ลบข้อมูลหนังสือทั้งหมดเพื่อเริ่มกรอกข้อมูลจริง หรือรีเซ็ตเป็นชุดข้อมูลตัวอย่าง
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllBooks}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="ลบหนังสือและประวัติการเคลื่อนไหวสต๊อกทั้งหมด เพื่อเริ่มบันทึกข้อมูลของตนเอง"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>ลบข้อมูลหนังสือทั้งหมด (เริ่มกรอกเอง)</span>
              </button>
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>โหลดตัวอย่าง (Default Demo)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
