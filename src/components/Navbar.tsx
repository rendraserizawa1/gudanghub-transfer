import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ScanLine, PackageCheck, ClipboardCheck,
  Users, Package, BarChart3, KeyRound, History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const itemCls = (isActive: boolean) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors whitespace-nowrap ${
    isActive
      ? 'bg-orange-500/10 font-semibold text-orange-600 dark:text-orange-400'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
  }`;

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canScan = isAdmin || user?.perms?.scan !== false;

  return (
    <nav className="border-t border-gray-200 dark:border-[#232840] bg-gray-50/60 dark:bg-[#0A0E1A]/60 px-4 overflow-x-auto">
      <div className="mx-auto flex max-w-7xl gap-1 py-1.5 text-xs font-medium">
        <NavLink to="/dashboard" className={({ isActive }) => itemCls(isActive)}>
          <LayoutDashboard size={14} /> Dashboard
        </NavLink>
        <NavLink to="/transfers" className={({ isActive }) => itemCls(isActive)}>
          <FileText size={14} /> Surat Jalan
        </NavLink>
        {canScan && (
          <NavLink to="/scan-loading" className={({ isActive }) => itemCls(isActive)}>
            <ScanLine size={14} /> Scan Muat
          </NavLink>
        )}
        {canScan && (
          <NavLink to="/scan-receiving" className={({ isActive }) => itemCls(isActive)}>
            <PackageCheck size={14} /> Scan Bongkar
          </NavLink>
        )}
        <NavLink to="/reports" className={({ isActive }) => itemCls(isActive)}>
          <BarChart3 size={14} /> Laporan
        </NavLink>
        {isAdmin && (
          <NavLink to="/discrepancies" className={({ isActive }) => itemCls(isActive)}>
            <ClipboardCheck size={14} /> Approval Selisih
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/products" className={({ isActive }) => itemCls(isActive)}>
            <Package size={14} /> Katalog
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => itemCls(isActive)}>
            <Users size={14} /> Kelola User
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/audit" className={({ isActive }) => itemCls(isActive)}>
            <History size={14} /> Audit Trail
          </NavLink>
        )}
        <NavLink to="/password" className={({ isActive }) => itemCls(isActive)}>
          <KeyRound size={14} /> Password
        </NavLink>
      </div>
    </nav>
  );
};