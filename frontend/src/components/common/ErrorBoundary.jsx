import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="my-8 max-w-xl mx-auto p-6 sm:p-8 bg-white/95 rounded-3xl border border-rose-200 shadow-xl backdrop-blur-md text-center animate-in zoom-in-95">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
            Đã xảy ra lỗi hiển thị
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            Hệ thống gặp sự cố tạm thời khi vẽ lại khu vực này. Bạn có thể nhấn nút bên dưới để tải lại dữ liệu hoặc thử lại.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử Lại Ngay</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
            >
              Làm Mới Trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
