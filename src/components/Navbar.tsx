import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP } from '../lib/config';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-sm">
            GH
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
              <p className="text-[10px] text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
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
                `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/transfers"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Surat Jalan (TO)
            </NavLink>

            {(user.role === 'admin' || user.role === 'gudang_pengirim') && (
              <NavLink
                to="/scan-loading"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Scan Muat (Gudang Asal)
              </NavLink>
            )}

            {(user.role === 'admin' || user.role === 'gudang_penerima') && (
              <NavLink
                to="/scan-receiving"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Scan Bongkar (Blind Receive)
              </NavLink>
            )}

            {user.role === 'admin' && (
              <>
                <NavLink
                  to="/discrepancies"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                  }
                >
                  Approval Selisih
                </NavLink>

                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`
                  }
                >
                  Master Produk & Barcode
                </NavLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
