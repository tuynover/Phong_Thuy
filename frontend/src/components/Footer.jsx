import React from 'react';

export default function Footer({ onSelectModule }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full max-w-6xl mx-auto px-4 border-t border-slate-200/80 pt-12 mt-12 font-sans bg-transparent">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {/* Cột 1: Logo & Slogan */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
                        <span className="font-extrabold text-slate-900 tracking-wider text-sm font-[Montserrat] uppercase">PHONG THỦY</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
                        Nền tảng ứng dụng mệnh lý học cổ học Đông Phương chính thống kết hợp phương pháp khoa học hiện đại vào đời sống.
                    </p>
                </div>

                {/* Cột 2: Dịch Vụ */}
                <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Dịch Vụ</h4>
                    <ul className="space-y-2 text-xs text-slate-500 font-bold">
                        <li>
                            <button onClick={() => onSelectModule('iching')} className="hover:text-indigo-600 transition-colors text-left">
                                Kinh Dịch Lục Hào
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('bazi')} className="hover:text-indigo-600 transition-colors text-left">
                                Tứ Trụ Bát Tự
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('ziwei')} className="hover:text-indigo-600 transition-colors text-left">
                                Mệnh Số Tử Vi
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('marriage')} className="hover:text-indigo-600 transition-colors text-left">
                                Bát Tự Hợp Hôn
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('xemngay')} className="hover:text-indigo-600 transition-colors text-left">
                                Chọn Ngày Hoàng Đạo
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('blog')} className="hover:text-indigo-600 transition-colors text-left">
                                Kiến Thức Phong Thủy
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Cột 3: Liên Kết */}
                <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Liên Kết</h4>
                    <ul className="space-y-2 text-xs text-slate-500 font-bold">
                        <li>
                            <button onClick={() => onSelectModule('about')} className="hover:text-indigo-600 transition-colors text-left">
                                Về chúng tôi
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('terms')} className="hover:text-indigo-600 transition-colors text-left">
                                Điều khoản dịch vụ
                            </button>
                        </li>
                        <li>
                            <button onClick={() => onSelectModule('privacy')} className="hover:text-indigo-600 transition-colors text-left">
                                Chính sách bảo mật
                            </button>
                        </li>
                        <li>
                            <a href="mailto:support@tuynover.ddns.net" className="hover:text-indigo-600 transition-colors text-left">
                                Liên hệ báo cáo
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Cột 4: Cộng Đồng */}
                <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Cộng Đồng</h4>
                    <ul className="space-y-2 text-xs text-slate-500 font-bold">
                        <li>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                                Github
                            </a>
                        </li>
                        <li>
                            <a href="https://zalo.me/0868960506" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                                Zalo Hỗ Trợ
                            </a>
                        </li>
                        <li>
                            <a href="mailto:trinhtuyen270804@gmail.com" className="hover:text-indigo-600 transition-colors">
                                Email Liên Hệ
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Chân trang bản quyền */}
            <div className="border-t border-slate-200/50 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold">
                <p>© {currentYear} PHONG THỦY. Tất cả quyền được bảo lưu.</p>
                <div className="flex gap-4">
                    <span>Bản quyền học thuật phương Đông</span>
                    <span>•</span>
                    <span>Hệ thống phân tích logic học thuật</span>
                </div>
            </div>
        </footer>
    );
}
