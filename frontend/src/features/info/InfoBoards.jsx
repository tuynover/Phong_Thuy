import React from 'react';
import { Shield, BookOpen, Compass, ChevronLeft } from 'lucide-react';

/**
 * Trang Giới thiệu (About Us)
 */
export function AboutUs({ onBack }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Nút quay lại */}
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-950 font-medium mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>Quay lại</span>
            </button>

            <div className="bg-white/70 backdrop-blur-md border border-amber-100 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-800">
                        <Compass className="w-8 h-8 animate-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-amber-950 font-serif">Giới Thiệu Dự Án</h1>
                        <p className="text-amber-800 text-sm">Sự giao thoa giữa Cổ Học Phương Đông và Trí Tuệ Nhân Tạo</p>
                    </div>
                </div>

                <div className="space-y-6 text-stone-700 leading-relaxed">
                    <p>
                        Chào mừng bạn đến với <strong>Phong Thủy Luận Giải AI</strong>. Đây là một hệ thống nghiên cứu học thuật được phát triển với sứ mệnh mang khoa học cổ học Phương Đông đến gần hơn với đời sống hiện đại thông qua lăng kính công nghệ.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">1. Tầm Nhìn & Sứ Mệnh</h2>
                    <p>
                        Cổ học phương Đông (Kinh Dịch, Bát Tự, Tử Vi Đẩu Số) chứa đựng kho tàng trí tuệ ngàn năm về quy luật vận hành của tự nhiên và con người. Tuy nhiên, rào cản từ ngữ cổ và các thuật toán tính toán phức tạp khiến nhiều người khó tiếp cận. Chúng tôi xây dựng hệ thống này để đơn giản hóa quá trình lập số lý và luận giải, cung cấp cái nhìn chiêm nghiệm sâu sắc và khoa học nhất.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">2. Sự kết hợp Độc đáo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                            <h3 className="font-bold text-amber-950 mb-2 font-serif">Rule Engine Tĩnh (Học Thuật)</h3>
                            <p className="text-sm text-stone-600">
                                Mọi phép tính an sao Tử Vi, tiết khí đại vận Bát Tự hay lập hào quẻ Dịch đều được thực hiện bởi công cụ tính toán chính xác tuyệt đối theo các thư viện học thuật uy tín thế giới. AI không tham gia vào tính toán tĩnh này.
                            </p>
                        </div>
                        <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                            <h3 className="font-bold text-amber-950 mb-2 font-serif">Luận Giải Trí Tuệ Nhân Tạo (AI)</h3>
                            <p className="text-sm text-stone-600">
                                Mô hình ngôn ngữ lớn (LLM) đóng vai trò như một dịch giả, dịch các snapshot tính toán học thuật phức tạp thành các bài giải nghĩa dễ hiểu, sâu sắc và tinh tế bằng tiếng Việt chuẩn phong thủy.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">3. Tuyên bố Nghiên cứu</h2>
                    <p>
                        Mọi dữ liệu tính toán và giải nghĩa trên hệ thống được xây dựng dựa trên các tài liệu cổ thư chính thống. Chúng tôi khuyến khích người dùng tiếp cận hệ thống dưới góc độ nghiên cứu học thuật, tham chiếu bản thân và chiêm nghiệm cuộc sống một cách tích cực, tránh sa đà vào các hoạt động mê tín dị đoan.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Trang Chính sách bảo mật (Privacy Policy)
 */
export function PrivacyPolicy({ onBack }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-950 font-medium mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>Quay lại</span>
            </button>

            <div className="bg-white/70 backdrop-blur-md border border-amber-100 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-800">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-amber-950 font-serif">Chính Sách Bảo Mật</h1>
                        <p className="text-amber-800 text-sm">Cam kết bảo vệ tuyệt đối thông tin riêng tư của bạn</p>
                    </div>
                </div>

                <div className="space-y-6 text-stone-700 leading-relaxed">
                    <p className="italic">
                        Cập nhật lần cuối: 22 tháng 7 năm 2026. Chúng tôi hiểu rằng thông tin ngày giờ sinh, họ tên là những dữ liệu cá nhân rất riêng tư và nhạy cảm. Chúng tôi cam kết bảo vệ thông tin này theo các tiêu chuẩn cao nhất.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">1. Thu thập dữ liệu</h2>
                    <p>
                        Hệ thống chỉ thu thập các thông tin do bạn chủ động nhập vào để thực hiện lập lá số/quẻ dịch, bao gồm: Họ tên, Ngày tháng năm sinh, Giờ sinh, Giới tính và các nội dung câu hỏi gieo quẻ.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">2. Cam kết Bảo mật & Quyền riêng tư</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Không bán dữ liệu:</strong> Chúng tôi tuyệt đối KHÔNG bán, cho thuê hay chia sẻ dữ liệu ngày giờ sinh cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hay thương mại.</li>
                        <li><strong>Mặc định riêng tư:</strong> Mọi lá số do bạn lập ra đều được đặt ở chế độ riêng tư mặc định (`isPublic: false`). Chỉ có bạn (khi đăng nhập tài khoản) mới có quyền xem lại các bản ghi này trong lịch sử.</li>
                        <li><strong>Chủ động chia sẻ:</strong> Lá số chỉ được công khai trên mạng internet khi và chỉ khi bạn nhấn nút "Chia sẻ công khai". Bạn có thể tắt chia sẻ bất cứ lúc nào và hệ thống sẽ lập tức chặn truy cập bên ngoài và yêu cầu Google gỡ chỉ mục.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">3. Lưu trữ và Xóa dữ liệu</h2>
                    <p>
                        Dữ liệu của bạn được lưu trữ an toàn trên hệ thống máy chủ cơ sở dữ liệu được mã hóa. Bạn có toàn quyền xóa các bản ghi này khỏi lịch sử của mình bất cứ lúc nào. Khi bạn thực hiện xóa, hệ thống sẽ thực hiện xóa mềm ngay lập tức và tiến hành xóa vĩnh viễn khỏi máy chủ định kỳ.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">4. Liên hệ hỗ trợ</h2>
                    <p>
                        Nếu bạn có bất kỳ câu hỏi nào liên quan đến bảo mật hoặc muốn yêu cầu xóa toàn bộ thông tin tài khoản của mình, vui lòng liên hệ Ban quản trị qua email: <span className="text-amber-800 font-semibold">support@tuynover.ddns.net</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Trang Điều khoản sử dụng & Miễn trừ trách nhiệm (Terms of Service)
 */
export function TermsOfService({ onBack }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-950 font-medium mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>Quay lại</span>
            </button>

            <div className="bg-white/70 backdrop-blur-md border border-amber-100 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-800">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-amber-950 font-serif">Điều Khoản & Miễn Trừ</h1>
                        <p className="text-amber-800 text-sm">Các quy định và tuyên bố miễn trừ trách nhiệm pháp lý</p>
                    </div>
                </div>

                <div className="space-y-6 text-stone-700 leading-relaxed">
                    <p>
                        Bằng việc sử dụng các dịch vụ tính toán, luận giải phong thủy và tương tác AI trên website này, bạn đồng ý tuân thủ các điều khoản sử dụng dưới đây.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">1. Bản quyền & Quyền sở hữu trí tuệ</h2>
                    <p>
                        Toàn bộ giao diện, cấu trúc mã nguồn, giải thuật an sao và các bài viết học thuật trên hệ thống đều thuộc bản quyền của **Phong Thủy Luận Giải AI**. Bạn được phép chia sẻ các đường dẫn lá số công khai của bản thân lên các mạng xã hội nhưng không được sao chép nguyên mẫu hoặc sử dụng thương mại hóa mã nguồn của hệ thống mà không có sự đồng ý bằng văn bản.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">2. Tuyên bố Miễn trừ Trách nhiệm (Disclaimer)</h2>
                    <div className="p-5 bg-red-50/50 border border-red-100 text-stone-700 rounded-2xl my-4">
                        <h3 className="font-bold text-red-950 mb-2 font-serif">⚠️ THÔNG BÁO QUAN TRỌNG</h3>
                        <p className="text-sm leading-relaxed">
                            Mọi thông tin giải đoán về lá số Tử Vi, Bát Tự, tuổi hợp hôn, gieo quẻ dịch hay ngày tốt/xấu do hệ thống này cung cấp chỉ mang tính chất <strong>chiêm nghiệm khoa học cổ học, tham khảo học thuật cá nhân</strong>. 
                            Chúng tôi KHÔNG đảm bảo tính chính xác tuyệt đối cho cuộc sống thực tế của bạn và không chịu bất kỳ trách nhiệm nào đối với những quyết định cá nhân, bao gồm nhưng không giới hạn ở: tài chính, gia đạo, sức khỏe, pháp luật, hôn nhân.
                        </p>
                    </div>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">3. Quản lý Tín dụng (Credits) & Quota</h2>
                    <p>
                        Các lượt gọi AI luận giải chuyên sâu yêu cầu sử dụng Credit tài khoản. Người dùng cam kết sử dụng hệ thống đúng mục đích học thuật, không cố tình gửi các yêu cầu có nội dung bạo lực, xúc phạm, đồi trụy hoặc spam tấn công làm nghẽn hạ tầng của hệ thống.
                    </p>

                    <h2 className="text-xl font-bold text-amber-900 font-serif mt-6">4. Thay đổi điều khoản</h2>
                    <p>
                        Ban quản trị có quyền điều chỉnh, bổ sung các điều khoản này bất cứ lúc nào để phù hợp với pháp luật hiện hành và định hướng nghiên cứu học thuật của dự án.
                    </p>
                </div>
            </div>
        </div>
    );
}
