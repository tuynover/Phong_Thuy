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
   - **Kinh Dịch (IChing):** Hỗ trợ gieo quẻ Lục Hào bằng đồng xu ảo, hoặc lập quẻ Mai Hoa Dịch Số dựa trên giờ động tâm/seri tiền. Hiển thị đồ hình quẻ, hào động, và kích hoạt giải đoán AI + Chat.
   - **Bát Tự (Bazi):** Lập lá số Bát Tự, tính Thập Thần, tìm Dụng Thần và hiển thị tương sinh tương khắc Ngũ Hành trực quan.
   - **Tử Vi (Ziwei):** Lập mệnh bàn 12 cung dạng lưới 4x4 truyền thống hoặc danh sách rút gọn trên di động, hiển thị các sao và đại/tiểu hạn.
   - **Hợp Hôn (Marriage):** Đối chiếu độ hòa hợp Bát Tự, Cung Phi, Mệnh Quái của cặp đôi Nam - Nữ và đưa ra lời khuyên gia đạo từ AI.
   - **Hộp thoại Chat (AiChatWidget):** Cửa sổ chat thông minh trượt lên hiển thị stream SSE từ AI kèm các chỉ số Ứng Kỳ, Độ Tin Cậy và Rủi Ro.
   - **Lịch sử & Đánh giá:** Lưu trữ các quẻ và lá số đã xem qua `localStorage` (đối với khách truy cập) và lưu vào Database (đối với tài khoản đã đăng nhập).
2. **Phân hệ Quản trị (Admin Dashboard):**
   - **Quản lý người dùng:** Theo dõi danh sách, phân quyền (Admin, Co-Admin, User, VIP), nạp/trừ credit sử dụng AI, khóa/mở khóa tài khoản.
   - **Giám sát tính toán:** Kiểm tra toàn bộ lịch sử lập lá số/gieo quẻ trong hệ thống, khóa các bản ghi vi phạm chính sách hoặc spam.
   - **Báo cáo phân tích (Analytics):** Thống kê số lượng người dùng, tổng lượt chạy API, chi phí token AI.
   - **Xử lý khiếu nại (Ban Appeals):** Tiếp nhận và phê duyệt/từ chối đơn xin mở khóa tài khoản từ người dùng bị khóa.

---

## 3. Tech Stack & Dependencies Chính

### Backend
- **Node.js & Express.js (v5):** Nền tảng server chính.
- **MongoDB & Mongoose (v9):** Lưu trữ dữ liệu dạng tài liệu JSON-like.
- **lunar-javascript:** Thư viện tính toán âm lịch, Can Chi, ngũ hành nạp âm.
- **iztro:** Thư viện tính toán tọa độ sao và lập mệnh bàn Tử Vi Bắc Phái.
- **@google/generative-ai:** SDK kết nối và tương tác với Gemini API.

### Frontend
- **React (v19) & Vite:** Thư viện phát triển UI và công cụ build tối ưu.
- **Tailwind CSS (v3):** Framework thiết kế giao diện theo tiện ích.
- **Recharts:** Thư viện biểu đồ phục vụ cho Dashboard Admin.
- **React Markdown:** Render văn bản định dạng markdown trả về từ AI.

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
