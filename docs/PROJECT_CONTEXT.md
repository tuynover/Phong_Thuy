# 📄 PROJECT_CONTEXT.md - Bối cảnh & Tổng quan Dự án

## 1. Mục tiêu Hệ thống
Dự án **Hệ thống Ứng dụng Phong Thủy & Gieo Quẻ** ra đời nhằm số hóa và hiện đại hóa việc tra cứu, thực hành các môn cổ học phương Đông bao gồm **Kinh Dịch (IChing)**, **Tứ Trụ - Bát Tự (Bazi)**, **Lá Số Tử Vi (Ziwei)**, và **Xem Tuổi Kết Hôn (Marriage)**.
Mục tiêu cốt lõi:
- Cung cấp đồ hình học thuật (Mệnh bàn Tử Vi, Sơ đồ Bát Tự, Quẻ Dịch chính/biến) chính xác 100% dựa trên quy tắc an sao và tính toán lịch pháp cổ truyền.
- Sử dụng Trí Tuệ Nhân Tạo (Generative AI - Google Gemini) để giải đoán kết quả tính toán thô thành các bài luận giải tự nhiên, cá nhân hóa sâu sắc bằng tiếng Việt dễ hiểu.
- Tạo ra trải nghiệm tương tác trực tiếp (Follow-up Chat) với "Thầy Dịch / Thầy Tử Vi AI" để người dùng hỏi sâu thêm về lá số của mình mà không mất ngữ cảnh.

---

## 2. Các Thành Phần Chính của Hệ thống

Hệ thống được chia làm hai phân hệ lớn:
1. **Phân hệ Người dùng (User End-User Interface):**
   - **Trang chủ Hệ sinh thái (HomeBoard):** Trang đích sang trọng tối giản theo chuẩn Awwwards tích hợp hiệu ứng Mesh Gradient, SVG Bát Quái xoay và vũ trụ tinh hà tương tác, kết nối 5 môn học thuật và quản lý luồng điều hướng mượt mà.
   - **Kinh Dịch (IChing):** Hỗ trợ gieo quẻ Lục Hào bằng đồng xu ảo, hoặc lập quẻ Mai Hoa Dịch Số dựa trên giờ động tâm/seri tiền. Hiển thị đồ hình quẻ, hào động, và kích hoạt giải đoán AI + Chat.
   - **Bát Tự (Bazi):** Lập lá số Bát Tự và tính toán phân bổ ngũ hành theo thuật toán 4.0 với các cơ chế điều chỉnh điểm tương đối, ưu tiên tổ hợp địa chi, đa thấu phân khí nguyệt lệnh, tiết khí cực đoan (con vượng mẹ kiệt) và phá điểm sàn đối với cách cục Tòng Cách chính xác. Hoàn toàn hiển thị màu sắc tương sinh tương khắc Ngũ Hành trực quan.
   - **Tử Vi (Ziwei):** Lập mệnh bàn 12 cung dạng lưới 4x4 truyền thống hoặc danh sách rút gọn trên di động, hiển thị các sao và đại/tiểu hạn.
   - **Hợp Hôn (Marriage):** Đối chiếu độ hòa hợp Bát Tự, Cung Phi, Mệnh Quái của cặp đôi Nam - Nữ và đưa ra lời khuyên gia đạo từ AI.
   - **Kiến Thức Phong Thủy (BlogBoard):** Trang chia sẻ và tra cứu bài viết học thuật phong thủy công khai. Tích hợp thanh chia sẻ đa nền tảng (Facebook, sao chép link, Web Share API di động), đồng bộ URL Deep-linking `?post={slug}` cho từng bài viết, trình diễn bài viết với `ReactMarkdown` & `remark-gfm` hỗ trợ tự động chuẩn hóa bảng GFM và chèn ảnh minh họa có chú thích.
   - **Hộp thoại Chat (AiChatWidget):** Cửa sổ chat thông minh trượt lên hiển thị stream SSE từ AI kèm các chỉ số Ứng Kỳ, Độ Tin Cậy và Rủi Ro.
   - **Lịch sử & Đánh giá:** Lưu trữ các quẻ và lá số đã xem qua `localStorage` (đối với khách truy cập) và lưu vào Database (đối với tài khoản đã đăng nhập).
2. **Phân hệ Quản trị (Admin Dashboard):**
   - **Quản lý người dùng:** Theo dõi danh sách, phân quyền (Admin, Co-Admin, User, VIP), nạp/trừ credit sử dụng AI, khóa/mở khóa tài khoản.
   - **Quản lý bài viết Blog:** Soạn thảo bài viết học thuật với bộ chuyển đổi tab **Soạn Thảo Markdown** vs **Xem Trước (Preview)**, tự động sinh slug thời gian thực, quản lý bài viết nháp/công khai/xóa mềm.
   - **Giám sát tính toán:** Kiểm tra toàn bộ lịch sử lập lá số/gieo quẻ trong hệ thống, khóa các bản ghi vi phạm chính sách hoặc spam.
   - **Báo cáo phân tích (Analytics):** Thống kê số lượng người dùng, tổng lượt chạy API, chi phí token AI.
   - **Xử lý khiếu nại (Ban Appeals):** Tiếp nhận và phê duyệt/từ chối đơn xin mở khóa tài khoản từ người dùng bị khóa.

---

## 3. Tech Stack & Dependencies Chính

### Backend
- **Node.js & Express.js (v5):** Nền tảng server chính.
- **MongoDB & Mongoose (v9):** Lưu trữ dữ liệu dạng tài liệu JSON-like (tất cả primary key `_id` theo chuẩn UUIDv7).
- **lunar-javascript:** Thư viện tính toán âm lịch, Can Chi, ngũ hành nạp âm.
- **iztro:** Thư viện tính toán tọa độ sao và lập mệnh bàn Tử Vi Bắc Phái.
- **@google/generative-ai:** SDK kết nối và tương tác với Gemini API.

### Frontend
- **React (v19) & Vite:** Thư viện phát triển UI và công cụ build tối ưu.
- **Tailwind CSS (v3):** Framework thiết kế giao diện theo tiện ích.
- **Recharts:** Thư viện biểu đồ phục vụ cho Dashboard Admin.
- **React Markdown & remark-gfm:** Biên dịch văn bản định dạng Markdown/GFM từ AI và bài viết blog, tự động xử lý bảng và ảnh minh họa.

---

## 4. Quá trình Phát triển & Các quyết định Thiết kế Lịch sử

### 4.1 Chuẩn hóa Ngôn ngữ & Tên gọi (Refactoring)
Ban đầu, mã nguồn có sự pha trộn giữa tiếng Việt và tiếng Anh trong cách đặt tên mô hình, controller (ví dụ: `DivinationController`, `TuViRecord`, `Kinhdich`). 
Hệ thống đã thực hiện một đợt tái cấu trúc lớn:
- Thống nhất thuật ngữ tiếng Anh chuẩn quốc tế: `IChing` đại diện cho Kinh Dịch và `Ziwei` đại diện cho Tử Vi.
- Đổi tên và hợp nhất toàn bộ bảng dữ liệu liên quan.

### 4.2 Hợp nhất Lược đồ Trò chuyện (Chat Schema)
Trước đây, mỗi phân hệ có các bảng hội thoại và tin nhắn riêng biệt (như `HexagramConversation`, `TuViMessage`...). Để tối ưu hóa truy vấn và đơn giản hóa mã nguồn, hệ thống đã loại bỏ 6 bộ sưu tập cũ và thay thế bằng hai bảng dùng chung:
- `Conversation`: Quản lý bối cảnh chat, phân biệt qua trường `system` (`iching | bazi | ziwei | marriage`).
- `Message`: Lưu trữ chi tiết nội dung tin nhắn và cấu trúc trả về từ AI.

### 4.3 Đồng bộ hóa luồng Luận giải Tử Vi qua SSE
Để tối ưu hóa mã nguồn và loại bỏ mã dư thừa (Dead Code), hệ thống đã thực hiện **xóa bỏ hoàn toàn** tệp hàng đợi `JobQueueService.js` và bảng dữ liệu `AstrologyJob`. Toàn bộ phân hệ Tử Vi hiện tại hoạt động đồng bộ qua luồng **SSE Stream thời gian thực** giống như Bát Tự và Kinh Dịch, nâng cao trải nghiệm người dùng bằng cách truyền tải kết quả giải đoán tức thời dạng chữ chạy thay vì cơ chế Polling chờ đợi job chạy ngầm.

### 4.4 Tăng cường Bảo mật Quyền riêng tư & Bộ chọn ngày Lịch sử Tùy biến (07/2026)
Để đáp ứng yêu cầu khắt khe về bảo vệ dữ liệu người dùng và trải nghiệm giao diện cao cấp:
- **Bảo vệ quyền riêng tư dữ liệu:** Tích hợp hệ thống middleware bảo vệ quyền riêng tư dữ liệu chéo (`checkRecordOwnership.js`, `checkHistoryOwnership.js`). Người dùng thông thường không thể sử dụng ID để truy cập các lá số/quẻ hoặc lịch sử chat AI của người khác. Phiên đăng nhập được kiểm soát chặt chẽ qua cơ chế `tokenVersion` trên máy chủ, hết hạn sau 7 ngày và bị thu hồi lập tức khi người dùng bấm đăng xuất.
- **Custom Date Picker (React):** Thiết kế component `CustomDatePicker` viết riêng trên React 19 thay thế hoàn toàn cho lịch chọn ngày mặc định thô ráp của các trình duyệt. Component hỗ trợ đổi màu chủ đạo (theme) động theo Tab môn học thuật, chuyển tháng bằng ChevronLeft/ChevronRight mượt mà, hiển thị dạng Modal Dialog ở chính giữa màn hình kèm phủ nền tối mờ ảo trên Mobile, và dock sát viền phải chống tràn trên Desktop.
- **Bố cục bộ lọc tối ưu:** Thiết kế thanh lọc dạng hàng song song xếp chồng bên phải (`lg:items-end`) giúp phân tách cụm chọn nhanh (Hôm nay, Hôm qua, 7 ngày, 30 ngày) và cụm chọn ngày thủ công, triệt tiêu khoảng trống thừa và tối ưu cuộn ngang cho thiết bị di động.

### 4.5 Loại bỏ Firebase Phone OTP & Tích hợp Quên Mật Khẩu qua Email OTP (07/2026)
Để tối ưu hóa chi phí vận hành và loại bỏ các ràng buộc thẻ thanh toán quốc tế của Firebase:
- **Gỡ bỏ Firebase Phone Authentication:** Xóa bỏ hoàn toàn Firebase Client/Admin SDK, dọn dẹp các trường OTP điện thoại trong database và giao diện `ProfileBoard.jsx` (đưa giao diện quản lý trạng thái tài khoản về grid 2 cột sạch sẽ).
- **Sửa đổi Prompt & UI Tử Vi:** Gỡ bỏ các trường dự đoán phụ không cần thiết như `timing` (Ứng kỳ) và `risk` (Cảnh báo) khỏi prompt hệ thống Tử Vi, đảm bảo trải nghiệm chat luận giải Tử Vi tập trung vào nội dung học thuật cốt lõi.
- **Tích hợp Quên mật khẩu qua Email OTP:** Viết mới luồng gửi mã xác thực OTP 6 số qua email (sử dụng mẫu email HTML sang trọng) và cho phép đặt lại mật khẩu mới. Áp dụng cơ chế tăng `tokenVersion` khi đổi mật khẩu để thu hồi token cũ trên mọi thiết bị.
- **Tối ưu hóa UI/UX AuthModal:** Nâng cấp form Quên mật khẩu 2 bước, tự động chuyển sang trang nhập OTP ngay lập tức khi bấm gửi mã để tăng trải nghiệm người dùng, ẩn các nút mạng xã hội gây nhiễu, và hiển thị thông báo thành công nguyên màn hình kèm hiệu ứng nhún (bounce) sinh động khi hoàn tất thành công.

### 4.6 Tích hợp Mô-đun Tin tức & Kiến thức Học thuật (Blog) (07/2026)
Để bổ sung giá trị nội dung học thuật cho người dùng và nâng cao điểm SEO cho dự án:
- **Database Schema & Automatic Seeding:** Tạo bảng dữ liệu `BlogPost` (sử dụng UUIDv7) lưu trữ các bài viết phong thủy được biên soạn kỹ lưỡng. Viết hàm tự động seed 4 bài viết mẫu chuyên sâu về Bát Tự, Tử Vi, Kinh Dịch và Trạch Cát khi cơ sở dữ liệu trống.
- **Client State Routing Integration:** Tích hợp chế độ hiển thị `'blog'` vào `appMode` của `UserApp.jsx`. Bổ sung tab "Blog" lên đầu trang và dưới chân trang để chuyển mạch mượt mà mà không ảnh hưởng tới kết cấu cũ của Landing page.
- **Markdown & Related Posts Rendering:** Hiển thị bài viết bằng React Markdown với bộ quy chuẩn thẩm mỹ Premium (bo tròn góc, font chữ Montserrat và Lora, trích dẫn nổi bật). Trả về 3 bài viết liên quan cùng danh mục bên dưới trang chi tiết cùng với các nút CTA chuyển đổi nhanh tới mô-đun Bát Tự, Tử Vi, Kinh Dịch tương ứng.
- **Admin Management Portal:** Xây dựng tab quản lý bài viết đầy đủ trong `AdminApp.jsx` cho phép tìm kiếm, lọc danh mục, sửa, xóa mềm (soft-delete), và khôi phục bài viết. Tích hợp form modal soạn thảo tiêu đề, tóm tắt, nội dung Markdown, tags và ảnh bìa trực quan, thống nhất giao diện tối sang trọng của Admin App.

