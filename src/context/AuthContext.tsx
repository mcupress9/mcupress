import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  login: (identity: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  canDeleteBook: boolean;
  canManageUsers: boolean;
  canAddBook: boolean;
  canEditBook: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Attempt to restore user or default to Admin for immediate friendly access if exists
    const active = storageService.getActiveUser();
    if (active) return active;
    // Default to the first user (Admin) for frictionless first impression
    const users = storageService.getUsers();
    return users[0] || null;
  });

  useEffect(() => {
    storageService.setActiveUser(currentUser);
  }, [currentUser]);

  const login = (identity: string, password?: string): { success: boolean; message?: string } => {
    const trimmed = identity.trim().toLowerCase();
    const users = storageService.getUsers();

    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.name.toLowerCase().includes(trimmed) ||
        (trimmed === 'admin' && u.role === 'Admin') ||
        (trimmed === 'staff' && u.role === 'Staff') ||
        (trimmed === 'somchai' && u.email.includes('somchai')) ||
        (trimmed === 'waraporn' && u.email.includes('waraporn'))
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ โปรดตรวจสอบ Email หรือ Username',
      };
    }

    if (matchedUser.status === 'inactive') {
      return {
        success: false,
        message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ',
      };
    }

    // Check password if provided and user has password
    if (password && matchedUser.password && matchedUser.password !== password) {
      return {
        success: false,
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
      };
    }

    setCurrentUser(matchedUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    storageService.setActiveUser(null);
  };

  const switchUser = (userId: string) => {
    const users = storageService.getUsers();
    const found = users.find((u) => u.id === userId);
    if (found && found.status === 'active') {
      setCurrentUser(found);
    }
  };

  const isAdmin = currentUser?.role === 'Admin';
  const isManager = currentUser?.role === 'Manager';
  const isStaff = currentUser?.role === 'Staff';

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin,
    isManager,
    isStaff,
    login,
    logout,
    switchUser,
    canDeleteBook: isAdmin,
    canManageUsers: isAdmin,
    canAddBook: isAdmin || isManager,
    canEditBook: isAdmin || isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
