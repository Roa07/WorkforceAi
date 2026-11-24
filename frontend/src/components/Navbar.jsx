import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Bell, Search } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0d1136] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* PeopleFirst-style crisp uppercase logo */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center tracking-wider text-lg sm:text-xl">
            <span className="font-black text-white">NEX</span>
            <span className="font-light text-indigo-300">HR</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
            {isAdmin ? 'Admin Console' : 'PeopleFirst Edition'}
          </span>
        </div>

        {user && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:inline-flex"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400"></span>
            </button>

            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <User className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span className="text-xs font-semibold text-white hidden sm:inline">{user.full_name}</span>
              <span className="text-[10px] font-mono text-indigo-200">
                {isAdmin ? 'ADMIN' : user.employee_code}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1 text-xs font-semibold text-slate-300 hover:text-rose-300 hover:bg-white/10 px-2.5 py-1.5 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
