import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  Crown,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_USERS } from '../services/storage';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identity.trim()) {
      setErrorMsg('กรุณากรอก Email หรือ Username');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(identity, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    }, 400);
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setIdentity(email);
    setPassword(pass);
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      login(email, pass);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FCE7F3]/60 via-[#FCF8FA] to-[#FFF1F7] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Decorative University Elements */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] bg-[#ED1760] text-white shadow-xl shadow-[#ED1760]/20 ring-4 ring-[#FCE7F3] mb-4 animate-in zoom-in-90 duration-300">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          ระบบจัดการสต๊อกสิ่งพิมพ์
        </h2>
        <p className="mt-2 text-sm font-bold text-[#ED1760]">
          สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
        </p>
        <p className="mt-1 text-xs text-[#64748B]">
          Mahachulalongkornrajavidyalaya University Press Inventory System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_24px_rgba(237,23,96,0.06)]">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identity"
                className="block text-xs sm:text-sm font-bold text-[#111827] mb-1.5"
              >
                อีเมล หรือ ชื่อผู้ใช้งาน (Email / Username) <span className="text-[#ED1760]">*</span>
              </label>
              <div className="relative rounded-[12px] shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identity"
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="admin@mcu.ac.th หรือ somchai"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-[#FCF8FA] border border-[#F3DDE7] rounded-[12px] text-sm text-[#111827] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-bold text-[#111827]"
                >
                  รหัสผ่าน (Password) <span className="text-[#ED1760]">*</span>
                </label>
                <span className="text-[11px] text-[#64748B]">รหัสผ่านเริ่มต้น</span>
              </div>
              <div className="relative rounded-[12px] shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-[#FCF8FA] border border-[#F3DDE7] rounded-[12px] text-sm text-[#111827] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] text-sm font-bold text-white bg-[#ED1760] hover:bg-[#D41456] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED1760] shadow-sm shadow-[#ED1760]/25 transition-all duration-150 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Select for 3 Authorized Personnel */}
          <div className="mt-8 pt-6 border-t border-[#F3DDE7]">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ED1760]" />
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                เข้าสู่ระบบด่วน (เจ้าหน้าที่ 3 คน)
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mb-3 leading-relaxed">
              คลิกเลือกผู้ใช้งานเพื่อทดสอบระบบตามระดับสิทธิ์ RBAC:
            </p>

            <div className="space-y-2">
              {INITIAL_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user.email, user.password || 'staff123')}
                  className="w-full text-left p-3 rounded-[12px] border border-[#F3DDE7] hover:border-[#ED1760]/50 hover:bg-[#FCE7F3]/30 transition-all flex items-center justify-between group bg-[#FCF8FA] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center shadow-2xs flex-shrink-0 ${
                        user.role === 'Admin'
                          ? 'bg-[#FCE7F3] text-[#ED1760] border border-[#F3DDE7]'
                          : user.role === 'Manager'
                          ? 'bg-[#FCE7F3] text-[#D41456] border border-[#F3DDE7]'
                          : 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]'
                      }`}
                    >
                      {user.role === 'Admin' ? (
                        <Crown className="w-4 h-4 text-rose-700" />
                      ) : user.role === 'Manager' ? (
                        <ShieldCheck className="w-4 h-4 text-pink-700" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 group-hover:text-rose-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.department}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        user.role === 'Admin'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : user.role === 'Manager'
                          ? 'bg-pink-50 text-pink-800 border-pink-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-xs text-slate-300 group-hover:text-rose-700">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          สงวนลิขสิทธิ์ © {new Date().getFullYear()} สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
        </div>
      </div>
    </div>
  );
};
