import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

export default function AdminConfirmModal({ notification, onClose }) {
    if (!notification) return null;

    const { type, message, onConfirm } = notification;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all scale-100">
                <div className="flex items-center space-x-3 mb-4">
                    {type === 'confirm' && (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    )}
                    {type === 'error' && (
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                            <X className="w-5 h-5" />
                        </div>
                    )}
                    {type === 'success' && (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Check className="w-5 h-5" />
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-800">
                        {type === 'confirm' ? 'Xác nhận thao tác' : type === 'error' ? 'Có lỗi xảy ra' : 'Thông báo'}
                    </h3>
                </div>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end space-x-3">
                    {type === 'confirm' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    onClose();
                                }}
                                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all"
                            >
                                Đồng ý
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
