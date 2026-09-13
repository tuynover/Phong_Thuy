import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, minDate, maxDate, className = '' }) {
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
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        data-testid="datepicker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-xs"
      >
        <span>{displayValue()}</span>
        <Calendar size={16} className="text-emerald-800" />
      </button>
      {isOpen && (
        <div 
          data-testid="datepicker-dropdown"
          className="absolute z-[999] mt-2 p-4 bg-white border border-gray-150 rounded-2xl shadow-xl w-[280px] sm:w-[300px] left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
            <button 
              type="button" 
              data-testid="prev-month"
              onClick={() => changeMonth(-1)} 
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
            >
              <ChevronDown size={16} className="rotate-90" />
            </button>
            <span className="font-extrabold text-sm text-neutral-800">
              Tháng {viewDate.getMonth() + 1} - {viewDate.getFullYear()}
            </span>
            <button 
              type="button" 
              data-testid="next-month"
              onClick={() => changeMonth(1)} 
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
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
                      ? 'bg-emerald-800 text-white font-bold' 
                      : !isDisabled 
                        ? 'hover:bg-emerald-50 text-neutral-700 hover:text-emerald-900' 
                        : 'text-gray-300 pointer-events-none bg-gray-50/50 cursor-not-allowed'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
