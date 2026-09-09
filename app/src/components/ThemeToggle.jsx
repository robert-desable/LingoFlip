import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center justify-center gap-2 p-2.5 rounded-2xl transition-all duration-200 cursor-pointer select-none border ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-sm shadow-slate-900/40 hover:scale-105 active:scale-95'
          : 'bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-sm hover:scale-105 active:scale-95'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 fill-amber-400/30 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 fill-slate-200 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
      {showLabel && (
        <span className="text-sm font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
