import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

export const DEFAULT_USER: User = {
  id: 'staff-mcu',
  name: 'เจ้าหน้าที่สำนักพิมพ์ มจร',
  email: 'pressmcu51@gmail.com',
  role: 'Admin',
  status: 'active',
  created_at: new Date().toISOString(),
  department: 'สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
};

interface AuthContextType {
  currentUser: User;
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
  const [currentUser] = useState<User>(DEFAULT_USER);

  const login = () => {
    return { success: true };
  };

  const logout = () => {
    // No-op: Login system disabled, user always has access
  };

  const switchUser = () => {
    // No-op: Equal access for all
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: true,
    isAdmin: true,
    isManager: true,
    isStaff: true,
    login,
    logout,
    switchUser,
    canDeleteBook: true,
    canManageUsers: true,
    canAddBook: true,
    canEditBook: true,
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
