import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminConfigs,
  updateAdminConfigs,
  testAdminAiConnection,
  testAdminSmtpConnection
} from '@/services/api';
import {
  Cpu,
  Shield,
  Database,
  Mail,
  Server,
  Key,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAdminTheme } from '@/features/admin/context/AdminThemeContext';

const CATEGORIES = [
  { id: 'ai', label: 'Trí Tuệ Nhân Tạo (AI)', icon: Cpu, desc: 'Mô hình Google Gemini, xoay tua khóa API & giới hạn điều phối' },
  { id: 'security', label: 'Bảo Mật & Xác Thực', icon: Shield, desc: 'Ký mã phiên JWT & định danh Google OAuth2' },
  { id: 'database', label: 'Cơ Sở Dữ Liệu & Cache', icon: Database, desc: 'Kết nối MongoDB cụm chính & RAM L1 + Redis L2' },
  { id: 'email', label: 'Dịch Vụ Email SMTP', icon: Mail, desc: 'Máy chủ gửi thư mã OTP khôi phục mật khẩu' },
  { id: 'system', label: 'Hạ Tầng Mạng Chung', icon: Server, desc: 'Cổng HTTP Server, môi trường chạy & tên miền CORS' }
];

const GEMINI_ALLOWED_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Ưu tiên số 1 - Khuyến nghị)' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Ưu tiên số 2 - Fallback chính)' },
  { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite (Dự phòng sâu)' },
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Dự phòng hiệu năng cao)' },
  { id: 'gemini-flash-lite-latest', label: 'gemini-flash-lite-latest (Phiên bản mới nhất)' }
];

export default function AdminConfigTab({ showAlert, showConfirm }) {
  const { isLight } = useAdminTheme();
  const [configs, setConfigs] = useState([]);
  const [originalConfigs, setOriginalConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ai');
  const [revealedKeys, setRevealedKeys] = useState({}); // key -> boolean
  const [dirtyKeys, setDirtyKeys] = useState(new Set());

  // Test Connection States
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminConfigs();
      if (res.data && res.data.configs) {
        setConfigs(res.data.configs);
        setOriginalConfigs(JSON.parse(JSON.stringify(res.data.configs)));
        setDirtyKeys(new Set());
      }
    } catch (err) {
      console.error('[AdminConfigTab] Lỗi khi tải cấu hình:', err);
      if (showAlert) showAlert('Không thể tải danh sách cấu hình. Vui lòng kiểm tra quyền hạn.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleInputChange = (key, newValue) => {
    setConfigs(prev => prev.map(cfg => {
      if (cfg.key === key) {
        return { ...cfg, value: newValue };
      }
      return cfg;
    }));

    setDirtyKeys(prev => {
      const updated = new Set(prev);
      const original = originalConfigs.find(c => c.key === key);
      if (original && original.value === newValue) {
        updated.delete(key);
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  const toggleReveal = (key) => {
    setRevealedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (dirtyKeys.size === 0) {
      if (showAlert) showAlert('Không có thông số cấu hình nào thay đổi.', 'info');
      return;
    }

    const configsToSend = configs.filter(c => dirtyKeys.has(c.key)).map(c => ({
      key: c.key,
      value: c.value
    }));

    const hasRestartRequired = configs.some(c => dirtyKeys.has(c.key) && c.requiresRestart);

    const proceedSave = async () => {
      setSaving(true);
      try {
        const res = await updateAdminConfigs(configsToSend);
        if (showAlert) {
          showAlert(res.data.message || 'Cập nhật cấu hình thành công!', res.data.requiresRestart ? 'warning' : 'success');
        }
        await fetchConfigs();
      } catch (err) {
        console.error('[AdminConfigTab] Lỗi khi lưu cấu hình:', err);
        const errMsg = err.response?.data?.error || 'Lỗi khi cập nhật cấu hình hệ thống.';
        if (showAlert) showAlert(errMsg, 'error');
      } finally {
        setSaving(false);
      }
    };

    if (hasRestartRequired && showConfirm) {
      showConfirm(
        'Bạn đang thay đổi cấu hình hạ tầng mạng cốt lõi (như Port hoặc Database URI). Những cấu hình này sẽ yêu cầu khởi động lại tiến trình server để áp dụng hoàn toàn. Bạn có muốn tiếp tục lưu?',
        proceedSave
      );
    } else {
      await proceedSave();
    }
  };

  const handleTestAi = async () => {
    const geminiKeyConfig = configs.find(c => c.key === 'GEMINI_API_KEYS');
    const modelConfig = configs.find(c => c.key === 'GEMINI_MODEL');
    
    setAiTesting(true);
    setAiTestResult(null);

    try {
      const res = await testAdminAiConnection(geminiKeyConfig?.value, modelConfig?.value);
      setAiTestResult(res.data);
    } catch (err) {
      setAiTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Lỗi kết nối tới AI service.'
      });
    } finally {
      setAiTesting(false);
    }
  };

  const handleTestSmtp = async () => {
    const host = configs.find(c => c.key === 'SMTP_HOST')?.value;
    const port = configs.find(c => c.key === 'SMTP_PORT')?.value;
    const user = configs.find(c => c.key === 'SMTP_USER')?.value;
    const pass = configs.find(c => c.key === 'SMTP_PASS')?.value;

    setSmtpTesting(true);
    setSmtpTestResult(null);

    try {
      const res = await testAdminSmtpConnection(host, port, user, pass);
      setSmtpTestResult(res.data);
    } catch (err) {
      setSmtpTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Lỗi kết nối tới máy chủ SMTP.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const currentCategoryConfigs = configs.filter(c => c.category === activeCategory);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border-amber-200/90 shadow-sm text-slate-800'
          : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/20 shadow-lg text-slate-100'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border transition-colors ${
            isLight
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Key size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base sm:text-lg font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Quản Trị Cấu Hình Hệ Thống & Hot-Reload
              </h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-red-950/60 border-red-800/40 text-red-400'
              }`}>
                Super Admin Only
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Thay đổi các thông số môi trường, API keys, AI models và áp dụng tức thời vào RAM mà không cần restart server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchConfigs}
            disabled={loading || saving}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Tải lại giá trị gốc"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || dirtyKeys.size === 0}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer ${
              dirtyKeys.size > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 animate-pulse'
                : (isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700')
            }`}
          >
            <Save size={16} />
            <span>{saving ? 'Đang Lưu...' : `Lưu & Áp Dụng (${dirtyKeys.size})`}</span>
          </button>
        </div>
      </div>

      {/* CATEGORY SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const hasDirty = configs.some(c => c.category === cat.id && dirtyKeys.has(c.key));

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isActive
                  ? (isLight ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-sm' : 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/30')
                  : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600' : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400')
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className={`p-2 rounded-xl ${
                  isActive
                    ? (isLight ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-500/20 text-amber-400')
                    : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/60 text-slate-400')
                }`}>
                  <Icon size={18} />
                </div>
                {hasDirty && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" title="Có thay đổi chưa lưu" />
                )}
              </div>
              <div>
                <h4 className={`text-xs font-bold ${
                  isActive
                    ? (isLight ? 'text-amber-950' : 'text-slate-100')
                    : (isLight ? 'text-slate-700' : 'text-slate-300')
                }`}>{cat.label}</h4>
                <p className={`text-[10px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE CATEGORY SETTINGS PANEL */}
      <div className={`border rounded-3xl p-5 sm:p-7 space-y-6 transition-colors ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-850'
          : 'bg-slate-900/80 border-slate-800/80 shadow-xl text-slate-100'
      }`}>
        
        {/* PANEL HEADER WITH ACTIONS (e.g., TEST AI / TEST SMTP) */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h4 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-slate-200'
            }`}>
              <span>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {CATEGORIES.find(c => c.id === activeCategory)?.desc}
            </p>
          </div>

          {/* Test Buttons */}
          {activeCategory === 'ai' && (
            <button
              onClick={handleTestAi}
              disabled={aiTesting}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              <Zap size={14} className={aiTesting ? 'animate-bounce' : ''} />
              <span>{aiTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối AI (Ping Gemini)'}</span>
            </button>
          )}

          {activeCategory === 'email' && (
            <button
              onClick={handleTestSmtp}
              disabled={smtpTesting}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              <Zap size={14} className={smtpTesting ? 'animate-bounce' : ''} />
              <span>{smtpTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Máy Chủ SMTP'}</span>
            </button>
          )}
        </div>

        {/* AI TEST FEEDBACK BANNER */}
        {aiTestResult && activeCategory === 'ai' && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            aiTestResult.success 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}>
            {aiTestResult.success ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />}
            <div className="flex-1 space-y-1">
              <div className="font-bold">{aiTestResult.message || (aiTestResult.success ? 'Kiểm tra thành công!' : 'Kiểm tra thất bại')}</div>
              {aiTestResult.latencyMs && <div>Độ trễ phản hồi: <span className="font-mono font-bold">{aiTestResult.latencyMs}ms</span> (Model: {aiTestResult.model})</div>}
              {aiTestResult.error && <div className="font-mono text-[11px] bg-red-950/60 p-2 rounded-lg border border-red-900/40">{aiTestResult.error}</div>}
            </div>
            <button onClick={() => setAiTestResult(null)} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
        )}

        {/* SMTP TEST FEEDBACK BANNER */}
        {smtpTestResult && activeCategory === 'email' && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            smtpTestResult.success 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}>
            {smtpTestResult.success ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />}
            <div className="flex-1 space-y-1">
              <div className="font-bold">{smtpTestResult.message || (smtpTestResult.success ? 'Kiểm tra thành công!' : 'Kiểm tra thất bại')}</div>
              {smtpTestResult.error && <div className="font-mono text-[11px] bg-red-950/60 p-2 rounded-lg border border-red-900/40">{smtpTestResult.error}</div>}
            </div>
            <button onClick={() => setSmtpTestResult(null)} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
        )}

        {/* CONFIG INPUTS LIST */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <RotateCcw className="animate-spin text-amber-500" size={24} />
            <span>Đang tải các thông số cấu hình...</span>
          </div>
        ) : currentCategoryConfigs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Không tìm thấy thông số nào trong nhóm này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {currentCategoryConfigs.map(cfg => {
              const isDirty = dirtyKeys.has(cfg.key);
              const isSecret = cfg.isSecret;
              const isRevealed = Boolean(revealedKeys[cfg.key]);

              return (
                <div
                  key={cfg.key}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isDirty
                      ? (isLight ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200 shadow-sm' : 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20')
                      : (isLight ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300' : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <label className={`text-xs sm:text-sm font-bold font-mono ${
                        isLight ? 'text-slate-900' : 'text-slate-200'
                      }`}>
                        {cfg.key}
                      </label>
                      <span className={`text-[11px] font-sans font-semibold ${
                        isLight ? 'text-amber-700' : 'text-amber-400'
                      }`}>
                        ({cfg.label})
                      </span>
                      {isDirty && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                          isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          Đã sửa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {cfg.requiresRestart ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isLight ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-rose-400 bg-rose-950/50 border-rose-900/40'
                        }`}>
                          <AlertCircle size={10} /> Cần Restart
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' : 'text-emerald-400 bg-emerald-950/50 border-emerald-900/40'
                        }`}>
                          <Zap size={10} /> Hot-Reload Ngay
                        </span>
                      )}

                      {isSecret && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isLight ? 'text-purple-700 bg-purple-50 border-purple-200 font-bold' : 'text-purple-400 bg-purple-950/50 border-purple-900/40'
                        }`}>
                          Bảo Mật
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-xs mb-3 flex items-center gap-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <HelpCircle size={13} className={`shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span>{cfg.description}</span>
                  </p>

                  {/* INPUT CONTROLS */}
                  {cfg.key === 'GEMINI_MODEL' ? (
                    // Select Dropdown for Model
                    <div className="relative">
                      <select
                        value={cfg.value}
                        onChange={(e) => handleInputChange(cfg.key, e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200'
                            : 'bg-slate-900 border-slate-700/80 text-slate-200 focus:outline-none focus:border-amber-500'
                        }`}
                      >
                        {GEMINI_ALLOWED_MODELS.map(m => (
                          <option key={m.id} value={m.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-200'}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : cfg.key === 'NODE_ENV' ? (
                    // Select for Environment
                    <div className="relative">
                      <select
                        value={cfg.value}
                        onChange={(e) => handleInputChange(cfg.key, e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200'
                            : 'bg-slate-900 border-slate-700/80 text-slate-200 focus:outline-none focus:border-amber-500'
                        }`}
                      >
                        <option value="development" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900'}>development (Môi trường phát triển nội bộ)</option>
                        <option value="production" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900'}>production (Môi trường máy chủ chính thức)</option>
                      </select>
                    </div>
                  ) : (
                    // Text or Password Input
                    <div className="relative flex items-center">
                      <input
                        type={isSecret && !isRevealed ? 'password' : 'text'}
                        value={cfg.value || ''}
                        onChange={(e) => handleInputChange(cfg.key, e.target.value)}
                        placeholder={`Nhập ${cfg.label}...`}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200'
                            : 'bg-slate-900 border-slate-700/80 text-slate-200 focus:outline-none focus:border-amber-500'
                        } ${isSecret ? 'pr-12' : ''}`}
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleReveal(cfg.key)}
                          className={`absolute right-3 p-1 transition-colors cursor-pointer ${
                            isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={isRevealed ? 'Che giấu' : 'Hiển thị'}
                        >
                          {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  )}

                  {isSecret && !isDirty && (
                    <div className={`mt-1.5 text-[11px] italic ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      * Giá trị nhạy cảm đã được che giấu mặt nạ an toàn. Để thay đổi, vui lòng xóa và nhập giá trị mới.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
