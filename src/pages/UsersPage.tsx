import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Plus,
  Edit2,
  Lock,
  Power,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Shield,
  Check,
  Sparkles,
  ArrowRightLeft,
  KeyRound,
  Crown,
  Briefcase,
  Layers,
} from 'lucide-react';
import { User, Role, UserStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';

interface UsersPageProps {
  users: User[];
  onRefresh: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, onRefresh }) => {
  const { currentUser, isAdmin, switchUser } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setRole('Staff');
    setDepartment('เจ้าหน้าที่สำนักพิมพ์');
    setPassword('staff123');
    setFormError('');
    setFormSuccess('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department || '');
    setPassword(user.password || '');
    setFormError('');
    setFormSuccess('');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim()) {
      setFormError('กรุณากรอกชื่อและ Email ให้ครบถ้วน');
      return;
    }

    if (editingUser) {
      storageService.updateUser(editingUser.id, {
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim(),
        password: password.trim() || editingUser.password,
      });
      setFormSuccess('อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
      setTimeout(() => {
        setEditingUser(null);
        onRefresh();
      }, 700);
    } else {
      storageService.addUser({
        name: name.trim(),
        email: email.trim(),
        role,
        status: 'active',
        department: department.trim(),
        password: password.trim() || 'staff123',
      });
      setFormSuccess('เพิ่มผู้ใช้งานใหม่เรียบร้อยแล้ว');
      setTimeout(() => {
        setIsAddModalOpen(false);
        onRefresh();
      }, 700);
    }
  };

  const handleToggleStatus = (user: User) => {
    if (!isAdmin) return;
    if (user.id === currentUser?.id) {
      alert('ไม่สามารถปิดการใช้งานบัญชีปัจจุบันของท่านเองได้');
      return;
    }
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    storageService.updateUser(user.id, { status: newStatus });
    onRefresh();
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // Get specific 3 users for the 3 prominent RBAC cards
  const adminUser = users.find((u) => u.role === 'Admin') || users[0];
  const managerUser = users.find((u) => u.role === 'Manager') || users[1];
  const staffUser = users.find((u) => u.role === 'Staff') || users[2];

  const threeUsers = [
    {
      user: adminUser,
      roleBadge: 'Admin (ผู้ดูแลระบบสูงสุด)',
      roleBg: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeColor: 'bg-rose-800 text-white',
      desc: 'มีอำนาจการจัดการเต็มรูปแบบทุกโมดูลในระบบ',
      permissions: [
        { label: 'ดูข้อมูลสิ่งพิมพ์ & แคตตาล็อก', granted: true },
        { label: 'บันทึกรับเข้า & เบิกจ่ายสต๊อก', granted: true },
        { label: 'เพิ่มหนังสือใหม่เข้าสู่ระบบ', granted: true },
        { label: 'แก้ไขรายละเอียดสิ่งพิมพ์', granted: true },
        { label: 'ลบหนังสือออกจากระบบ', granted: true },
        { label: 'จัดการบัญชีและกำหนดสิทธิ์ผู้ใช้', granted: true },
      ],
    },
    {
      user: managerUser,
      roleBadge: 'Manager (หัวหน้างานคลังสิ่งพิมพ์)',
      roleBg: 'bg-pink-50/70 border-pink-200 text-pink-900',
      badgeColor: 'bg-pink-700 text-white',
      desc: 'เพิ่ม/แก้ไข/ปรับสต๊อกได้ (ไม่มีสิทธิ์ลบข้อมูล)',
      permissions: [
        { label: 'ดูข้อมูลสิ่งพิมพ์ & แคตตาล็อก', granted: true },
        { label: 'บันทึกรับเข้า & เบิกจ่ายสต๊อก', granted: true },
        { label: 'เพิ่มหนังสือใหม่เข้าสู่ระบบ', granted: true },
        { label: 'แก้ไขรายละเอียดสิ่งพิมพ์', granted: true },
        { label: 'ลบหนังสือออกจากระบบ', granted: false },
        { label: 'จัดการบัญชีและกำหนดสิทธิ์ผู้ใช้', granted: false },
      ],
    },
    {
      user: staffUser,
      roleBadge: 'Staff (เจ้าหน้าที่ธุรการ/คลัง)',
      roleBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      badgeColor: 'bg-emerald-700 text-white',
      desc: 'ดูข้อมูลและบันทึกการรับเข้า-เบิกจ่ายสต๊อกเท่านั้น',
      permissions: [
        { label: 'ดูข้อมูลสิ่งพิมพ์ & แคตตาล็อก', granted: true },
        { label: 'บันทึกรับเข้า & เบิกจ่ายสต๊อก', granted: true },
        { label: 'เพิ่มหนังสือใหม่เข้าสู่ระบบ', granted: false },
        { label: 'แก้ไขรายละเอียดสิ่งพิมพ์', granted: false },
        { label: 'ลบหนังสือออกจากระบบ', granted: false },
        { label: 'จัดการบัญชีและกำหนดสิทธิ์ผู้ใช้', granted: false },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              จัดการผู้ใช้งานและสิทธิ์การเข้าถึง (RBAC)
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              {users.length} บัญชีในระบบ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            โครงสร้างการบริหารจัดการ 3 ตำแหน่งหน้าที่ภายในสำนักพิมพ์ มจร
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#ED1760]/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        )}
      </div>

      {/* 3 Prominent User Cards (Admin, Manager, Staff) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {threeUsers.map((item, idx) => {
          const u = item.user;
          if (!u) return null;
          const isCurrent = currentUser?.id === u.id;

          return (
            <div
              key={u.id || idx}
              className={`bg-white rounded-[20px] border transition-all p-6 sm:p-7 flex flex-col justify-between relative shadow-[0_4px_16px_rgba(237,23,96,0.03)] ${
                isCurrent
                  ? 'border-[#ED1760] ring-2 ring-[#ED1760]/20'
                  : 'border-[#F3DDE7] hover:border-[#ED1760]/40'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#ED1760] text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>กำลังใช้งานในบทบาทนี้</span>
                </div>
              )}

              <div className="space-y-5">
                {/* User Profile Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-[14px] flex items-center justify-center shadow-xs ring-2 ring-[#FCE7F3] ${
                        u.role === 'Admin'
                          ? 'bg-[#ED1760] text-white'
                          : u.role === 'Manager'
                          ? 'bg-[#D41456] text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {u.role === 'Admin' ? (
                        <Crown className="w-7 h-7" />
                      ) : u.role === 'Manager' ? (
                        <ShieldCheck className="w-7 h-7" />
                      ) : (
                        <UserCheck className="w-7 h-7" />
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white ${
                        u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={u.status === 'active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {u.name}
                    </h3>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {u.department}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      {u.email}
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.roleBg}`}
                  >
                    {u.role === 'Admin' ? (
                      <Crown className="w-3.5 h-3.5 text-rose-700" />
                    ) : u.role === 'Manager' ? (
                      <Briefcase className="w-3.5 h-3.5 text-pink-700" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>{item.roleBadge}</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    {item.desc}
                  </p>
                </div>

                {/* Permissions Checklist */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200/60">
                    ขอบเขตสิทธิ์การใช้งาน (Permissions)
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {item.permissions.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className={`text-xs flex items-center justify-between gap-2 ${
                          p.granted ? 'text-slate-800' : 'text-slate-400 opacity-60'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {p.granted ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Switch User Demo Button (Section 14 requirement) */}
              <div className="pt-5 mt-4 border-t border-slate-100">
                {isCurrent ? (
                  <div className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold text-center border border-rose-200/80 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-700" />
                    <span>เข้าใช้งานอยู่ในบัญชีนี้แล้ว</span>
                  </div>
                ) : (
                  <button
                    onClick={() => switchUser(u.id)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-rose-900 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>สลับเป็นผู้ใช้นี้ (ทดสอบระบบ)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Users Table */}
      <div className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(190,24,93,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900">
            รายชื่อผู้ใช้งานทั้งหมดในฐานข้อมูลสำนักพิมพ์
          </div>
          <span className="text-xs text-slate-400">
            * สิทธิ์การแก้ไขและปิดใช้งานสงวนไว้สำหรับ Admin
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">ผู้ใช้งาน</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">สิทธิ์การใช้งาน (Role)</th>
                <th className="px-4 py-3.5">ตำแหน่ง / ฝ่ายงาน</th>
                <th className="px-4 py-3.5">สถานะ</th>
                <th className="px-4 py-3.5">วันที่ลงทะเบียน</th>
                <th className="px-4 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-rose-50/20 transition-colors ${
                      u.status === 'inactive' ? 'opacity-60 bg-slate-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ring-1 ring-slate-200/80 flex-shrink-0 ${
                            u.role === 'Admin'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : u.role === 'Manager'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role === 'Admin' ? (
                            <Crown className="w-4 h-4 text-rose-700" />
                          ) : u.role === 'Manager' ? (
                            <ShieldCheck className="w-4 h-4 text-pink-700" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-slate-700" />
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                คุณ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-mono text-xs">
                      {u.email}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.role === 'Admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <Crown className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      ) : u.role === 'Manager' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-800 border border-pink-200">
                          <Briefcase className="w-3 h-3" />
                          <span>Manager</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          <span>Staff</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {u.department || 'สำนักพิมพ์ มจร'}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>เปิดใช้งาน</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>ปิดใช้งาน</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="สลับเป็นผู้ใช้นี้"
                        >
                          สลับผู้ใช้
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลผู้ใช้งาน"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.status === 'active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={
                                u.status === 'active'
                                  ? 'ปิดใช้งานบัญชี'
                                  : 'เปิดใช้งานบัญชี'
                              }
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุล / สมณศักดิ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น พระมหาดนัย สุเมโธ, ดร."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (Email) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mcu.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สิทธิ์การใช้งาน (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                  >
                    <option value="Admin">Admin (เต็มรูปแบบ)</option>
                    <option value="Manager">Manager (เพิ่ม/แก้/สต๊อก)</option>
                    <option value="Staff">Staff (สต๊อก/ดูข้อมูล)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Demo)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านเข้าสู่ระบบ"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ฝ่ายงาน / ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น ฝ่ายคลังและจัดจำหน่าย"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 text-white text-xs font-black shadow-xs hover:from-rose-700 hover:to-pink-800 cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
