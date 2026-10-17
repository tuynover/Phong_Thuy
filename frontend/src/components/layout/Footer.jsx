import React from 'react';

export default function Footer({ onSelectModule }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full max-w-6xl mx-auto px-4 border-t border-slate-200/80 pt-5 pb-4 md:pb-6 mt-6 md:mt-8 font-sans bg-transparent">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 md:gap-6">
                {/* Cột 1: Logo & Slogan */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 md:w-7 md:h-7 rounded-lg object-cover shadow-sm" />
                        <span className="font-extrabold text-slate-900 tracking-wider text-xs md:text-sm font-[Montserrat] uppercase">PHONG THỦY</span>
                    </div>
                    <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-medium">
                        Nền tảng ứng dụng mệnh lý học cổ học Đông Phương chính thống kết hợp phương pháp khoa học hiện đại vào đời sống.
                    </p>
                    <p className="text-[10px] md:text-[11px] text-slate-400/80 font-medium">
                        © {currentYear} PHONG THỦY.
                    </p>
                </div>

                {/* Cột 2: Dịch Vụ */}
                <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Dịch Vụ</h4>
                    <ul className="space-y-1.5 text-xs text-slate-500 font-bold">
                        <li>
                            <a href="/iching" onClick={(e) => { e.preventDefault(); onSelectModule('iching'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Kinh Dịch Lục Hào
                            </a>
                        </li>
                        <li>
                            <a href="/bazi" onClick={(e) => { e.preventDefault(); onSelectModule('bazi'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Tứ Trụ Bát Tự
                            </a>
                        </li>
                        <li>
                            <a href="/ziwei" onClick={(e) => { e.preventDefault(); onSelectModule('ziwei'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Mệnh Số Tử Vi
                            </a>
                        </li>
                        <li>
                            <a href="/marriage" onClick={(e) => { e.preventDefault(); onSelectModule('marriage'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Bát Tự Hợp Hôn
                            </a>
                        </li>
                        <li>
                            <a href="/xemngay" onClick={(e) => { e.preventDefault(); onSelectModule('xemngay'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Chọn Ngày Hoàng Đạo
                            </a>
                        </li>
                        <li>
                            <a href="/feixing" onClick={(e) => { e.preventDefault(); onSelectModule('feixing'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Huyền Không Phi Tinh
                            </a>
                        </li>
                        <li>
                            <a href="/numerology" onClick={(e) => { e.preventDefault(); onSelectModule('numerology'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Phong Thủy Số Học
                            </a>
                        </li>
                        <li>
                            <a href="/blog" onClick={(e) => { e.preventDefault(); onSelectModule('blog'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Kiến Thức Phong Thủy
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Cột 3: Liên Kết */}
                <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Liên Kết</h4>
                    <ul className="space-y-1.5 text-xs text-slate-500 font-bold">
                        <li>
                            <a href="/about" onClick={(e) => { e.preventDefault(); onSelectModule('about'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Về chúng tôi
                            </a>
                        </li>
                        <li>
                            <a href="/terms" onClick={(e) => { e.preventDefault(); onSelectModule('terms'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Điều khoản dịch vụ
                            </a>
                        </li>
                        <li>
                            <a href="/privacy" onClick={(e) => { e.preventDefault(); onSelectModule('privacy'); }} className="hover:text-indigo-600 transition-colors text-left block">
                                Chính sách bảo mật
                            </a>
                        </li>
                        <li>
                            <a href="mailto:support@tuynover.id.vn" className="hover:text-indigo-600 transition-colors text-left">
                                Liên hệ báo cáo
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Cột 4: Cộng Đồng */}
                <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Cộng Đồng</h4>
                    <ul className="space-y-1.5 text-xs text-slate-500 font-bold">
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
        </footer>
    );
}

