import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP, getBranchName } from '../lib/config';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const canScan = isAdmin || user?.perms?.scan !== false;
  const canReceive = isAdmin || user?.perms?.scan !== false;

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0E1A] font-bold text-white shadow-sm border border-orange-500/40">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF6B00" strokeWidth="2.4" strokeLinecap="round">
              <rect x="6" y="3" width="12" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{APP.name}</h1>
            <p className="text-xs text-gray-500">{APP.company}</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-gray-900">{user.name}</p>
              <p className="text-[10px] text-gray-500 capitalize">
                {user.role} {user.branch_id ? `• ${getBranchName(user.branch_id)}` : ''}
              </p>
            </div>
            <button
              onClick={() => { void logout(); navigate('/login'); }}
              className="btn-ghost text-xs px-2.5 py-1.5 border rounded-lg text-danger-600 hover:bg-danger-50"
            >
              Keluar
            </button>
          </div>
        )}
      </div>

      {user && (
        <nav className="border-t bg-gray-50/50 px-4 overflow-x-auto">
          <div className="mx-auto flex max-w-7xl gap-1 py-1.5 text-xs font-medium">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/transfers"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Surat Jalan
            </NavLink>

            {canScan && (
              <NavLink
                to="/scan-loading"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Scan Muat
              </NavLink>
            )}

            {canReceive && (
              <NavLink
                to="/scan-receiving"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Scan Bongkar
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/discrepancies"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Approval Selisih
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Kelola User
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};