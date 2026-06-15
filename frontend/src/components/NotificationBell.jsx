import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, CheckSquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function NotificationBell({ onNotificationClick }) {
  const { user, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, hexagramId) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setIsOpen(false);
      if (onNotificationClick) {
        onNotificationClick(hexagramId);
      }
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* CSS Animation for Bell wiggle */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(4deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(2deg); }
          90% { transform: rotate(-2deg); }
        }
        .animate-wiggle {
          animation: wiggle 1.2s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
      
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-amber-800 transition-colors focus:outline-none flex items-center justify-center rounded-full hover:bg-gray-100/50"
        title="Thông báo"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-wiggle" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3.5 bg-amber-50/30 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-amber-950 text-sm">Thông báo Ứng Kỳ</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckSquare size={13} />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id, n.hexagramId)}
                  className={`p-3 text-left cursor-pointer transition-colors hover:bg-gray-50 flex flex-col gap-1.5 ${!n.isRead ? 'bg-amber-50/10' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${!n.isRead ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-500'}`}>
                      {n.title}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
