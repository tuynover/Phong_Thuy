import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Sparkles, HeartHandshake } from 'lucide-react';

export default function ThankYouModal({
  isOpen,
  onClose,
  title = "Cảm Ơn Quý Khách!",
  message = "Thao tác của quý khách đã được hệ thống ghi nhận thành công.",
  subtext = "Hệ thống Phong Thủy Luận Giải AI luôn sẵn sàng đồng hành và hỗ trợ quý khách.",
  actionLabel = "Đã Hiểu & Đóng",
  onAction = null
}) {
  if (!isOpen) return null;

  const handleActionClick = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200/80 z-10 text-center font-sans overflow-hidden"
        >
          {/* Decorative Corner Lights */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-red-200/30 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-amber-50 flex items-center justify-center shadow-lg shadow-amber-900/20 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
            >
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </motion.div>
            <Sparkles className="w-4 h-4 absolute top-2 right-2 text-amber-200 animate-pulse" />
          </div>

          {/* Header & Content */}
          <h3 className="text-2xl font-serif font-bold text-amber-950 mb-2">
            {title}
          </h3>

          <p className="text-sm sm:text-base text-slate-700 font-medium mb-3 leading-relaxed">
            {message}
          </p>

          {subtext && (
            <p className="text-xs text-slate-500 mb-6 bg-amber-50/70 p-3 rounded-2xl border border-amber-100/80">
              {subtext}
            </p>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleActionClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              {actionLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
