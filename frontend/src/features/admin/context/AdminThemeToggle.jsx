import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminThemeToggle({ className = '' }) {
  const { theme, isLight, toggleTheme } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer select-none shrink-0 ${
        isLight
          ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-300 shadow-sm'
          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 shadow-sm'
      } ${className}`}
      title={isLight ? 'Chuyển sang giao diện Tối (Dark Mode)' : 'Chuyển sang giao diện Sáng (Light Mode)'}
      aria-label="Toggle Admin Theme"
    >
      <div className={`p-1 rounded-lg transition-transform duration-300 ${
        isLight ? 'rotate-180 bg-amber-500 text-white' : 'rotate-0 bg-slate-800 text-amber-400'
      }`}>
        {isLight ? <Sun size={14} className="text-white" /> : <Moon size={14} />}
      </div>
      <span className="text-xs font-bold tracking-wide">
        {isLight ? 'Nền Sáng' : 'Nền Tối'}
      </span>
    </button>
  );
}
