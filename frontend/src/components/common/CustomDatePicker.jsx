import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export default function CustomDatePicker({ 
  value, 
  onChange, 
  label, 
  activeTheme, 
  activeTab, 
  align = 'left', 
  minDate, 
  maxDate, 
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate);
  
  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

  const selectDate = (day) => {
    const newD = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const y = newD.getFullYear();
    const m = String(newD.getMonth() + 1).padStart(2, '0');
    const d = String(newD.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleClear = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleToday = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];
    onChange(todayStr);
    setIsOpen(false);
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const cells = [];
  
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, isCurrentMonth: true });
  }
  const totalCells = 42;
  const nextMonthPadding = totalCells - cells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    cells.push({ day: i, isCurrentMonth: false });
  }

  const displayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Dynamic theme colors for Tab mode (IChing / Bazi / Ziwei / Marriage)
  const themeBg = activeTab === 'iching' 
    ? 'bg-amber-800 text-white hover:bg-amber-900' 
    : activeTab === 'bazi' 
      ? 'bg-blue-800 text-white hover:bg-blue-900' 
      : activeTab === 'ziwei' 
        ? 'bg-purple-800 text-white hover:bg-purple-900' 
        : activeTab === 'marriage'
          ? 'bg-rose-800 text-white hover:bg-rose-900'
          : 'bg-emerald-800 text-white hover:bg-emerald-900';

  const themeText = activeTab === 'iching' 
    ? 'text-amber-800 hover:bg-amber-50' 
    : activeTab === 'bazi' 
      ? 'text-blue-800 hover:bg-blue-50' 
      : activeTab === 'ziwei' 
        ? 'text-purple-800 hover:bg-purple-50' 
        : activeTab === 'marriage'
          ? 'text-rose-800 hover:bg-rose-50'
          : 'text-emerald-800 hover:bg-emerald-50';

  const themeBorder = activeTab === 'iching' 
    ? 'focus:border-amber-600 focus:ring-amber-500/20' 
    : activeTab === 'bazi' 
      ? 'focus:border-blue-600 focus:ring-blue-500/20' 
      : activeTab === 'ziwei' 
        ? 'focus:border-purple-600 focus:ring-purple-500/20' 
        : activeTab === 'marriage'
          ? 'focus:border-rose-600 focus:border-rose-500/20'
          : 'focus:border-emerald-500 focus:ring-emerald-500/20';

  // Align position classes
  const alignClass = align === 'right' 
    ? 'sm:right-0 sm:left-auto' 
    : align === 'center' 
      ? 'sm:left-1/2 sm:-translate-x-1/2' 
      : 'sm:left-0 sm:right-auto';

  return (
    <div ref={containerRef} className={`relative ${label ? 'flex-1 sm:flex-none' : 'w-full'} ${className}`}>
      {label && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none z-10">
          {label}
        </span>
      )}

      <button
        type="button"
        data-testid="datepicker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={label 
          ? `w-full sm:w-44 text-left pl-11 pr-3 py-2.5 text-sm border border-gray-200 rounded-2xl bg-white shadow-sm transition-all duration-300 flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-4 ${themeBorder}`
          : "w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-xs"
        }
      >
        <span className={value ? (label ? 'text-gray-800 font-semibold' : '') : (label ? 'text-gray-405' : 'text-gray-400')}>
          {displayValue() || (label ? 'Chọn ngày...' : 'Chọn ngày')}
        </span>
        <Calendar size={label ? 14 : 16} className={label ? "text-gray-400 ml-1.5 flex-shrink-0" : "text-emerald-800"} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop blur overlay for Mobile only */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-50 sm:hidden animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          <div 
            data-testid="datepicker-dropdown"
            className={`fixed sm:absolute z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-full sm:translate-y-0 sm:mt-2 p-4 bg-white border border-gray-150 rounded-2xl shadow-2xl sm:shadow-xl w-[290px] sm:w-[300px] animate-in fade-in zoom-in-95 sm:zoom-in-100 duration-200 ${alignClass}`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <button 
                type="button" 
                data-testid="prev-month"
                onClick={() => changeMonth(-1)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <span className="font-extrabold text-sm text-neutral-800 font-[Montserrat]">
                Tháng {viewDate.getMonth() + 1} - {viewDate.getFullYear()}
              </span>
              <button 
                type="button" 
                data-testid="next-month"
                onClick={() => changeMonth(1)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {daysOfWeek.map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {cells.map((cell, idx) => {
                let isDisabled = !cell.isCurrentMonth;
                if (cell.isCurrentMonth) {
                  const dateStr = viewDate.getFullYear() + '-' + 
                    String(viewDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(cell.day).padStart(2, '0');
                  if (minDate && dateStr < minDate) isDisabled = true;
                  if (maxDate && dateStr > maxDate) isDisabled = true;
                }

                const isSelected = cell.isCurrentMonth && 
                  selectedDate.getDate() === cell.day && 
                  selectedDate.getMonth() === viewDate.getMonth() && 
                  selectedDate.getFullYear() === viewDate.getFullYear();
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !isDisabled && selectDate(cell.day)}
                    disabled={isDisabled}
                    className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? `${themeBg} font-bold shadow-xs` 
                        : !isDisabled 
                          ? `hover:bg-slate-100 text-neutral-700 ${themeText}` 
                          : 'text-gray-300 pointer-events-none bg-gray-50/50 cursor-not-allowed'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer: Xóa & Hôm nay */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-red-500 px-2 py-1 rounded-md transition-colors"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={handleToday}
                className={`${themeText} px-2 py-1 rounded-md transition-colors font-bold`}
              >
                Hôm nay
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
