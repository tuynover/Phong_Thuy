# 📦 DEPENDENCIES.md - Danh mục Thư viện & Phụ thuộc của Hệ thống

Dưới đây là danh mục toàn bộ các thư viện bên thứ ba (Dependencies) được sử dụng trong hệ thống cùng với mục đích sử dụng và các thông tin liên quan.

---

## ⚙️ 1. Thư viện Backend (`/backend/package.json`)

| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích / Chức năng chính trong hệ thống |
| :--- | :--- | :--- | :--- |
| `express` | `^5.2.1` | MIT | Framework xây dựng API. Sử dụng phiên bản 5.x hỗ trợ xử lý lỗi Promise bất đồng bộ tự động mà không cần wrapper. |
| `mongoose` | `^9.6.2` | MIT | ODM kết nối cơ sở dữ liệu MongoDB, cung cấp Schema, Validation và Hooks. |
| `lunar-javascript` | `1.7.7` | MIT | Lõi tính toán lịch pháp âm dương, can chi, nhật nguyệt phục vụ cho cả Kinh Dịch, Bát Tự và Hợp Hôn. |
| `iztro` | `2.5.8` | MIT | Thư viện chuyên biệt dành cho Tử Vi Bắc Phái, hỗ trợ an sao 12 cung vị. |
| `@google/generative-ai`| `^0.24.1` | Apache-2.0 | SDK gọi mô hình Gemini 1.5 Pro / Gemini 3.1 Flash để sinh văn bản giải đoán tự nhiên. |
| `jsonwebtoken` | `^9.0.3` | MIT | Tạo và xác thực mã JWT phục vụ cho hệ thống Authentication. |
| `bcryptjs` | `^3.0.3` | MIT | Mã hóa một chiều (hashing) mật khẩu người dùng trước khi lưu trữ vào MongoDB. |
| `uuid` | `^14.0.0` | MIT | Sinh mã định danh duy nhất theo chuẩn UUIDv7 làm khóa chính `_id` cho cơ sở dữ liệu. |
| `nodemailer` | `^9.0.0` | MIT | Xử lý gửi thư điện tử (email) thông báo sự kiện Ứng Kỳ cho người dùng cuối. |
| `cors` | `^2.8.6` | MIT | Cho phép các yêu cầu HTTP từ frontend (cổng khác) truy cập tài nguyên của backend. |
| `dotenv` | `^17.4.1` | BSD-2-Clause | Nạp cấu hình từ tệp `.env` vào biến môi trường `process.env`. |
| `mongoose-sequence` | `^6.0.1` | MIT | Hỗ trợ tự động tăng số thứ tự (Auto-increment) nếu cần thiết. |

---

## 🎨 2. Thư viện Frontend (`/frontend/package.json`)

| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích / Chức năng chính trong hệ thống |
| :--- | :--- | :--- | :--- |
| `react` | `^19.2.4` | MIT | Thư viện xây dựng giao diện người dùng. Sử dụng React 19 tối ưu hóa hiệu năng render. |
| `react-dom` | `^19.2.4` | MIT | Cầu nối tương tác giữa React và cây DOM của trình duyệt. |
| `vite` | `^8.0.4` | MIT | Công cụ build và chạy môi trường dev cực nhanh thay thế cho Webpack truyền thống. |
| `tailwindcss` | `^3.4.19` | MIT | Framework CSS dạng tiện ích giúp thiết kế giao diện nhanh chóng, tương thích responsive. |
| `axios` | `^1.15.0` | MIT | Thư viện HTTP Client để gửi request lên Backend và đính kèm JWT token. |
| `react-markdown` | `^10.1.0` | MIT | Biên dịch chuỗi văn bản Markdown trả về từ AI thành định dạng HTML sạch đẹp. |
| `recharts` | `^3.8.1` | MIT | Vẽ các biểu đồ thống kê (API usage, active users...) trên Trang quản trị Admin. |
| `lucide-react` | `^1.7.0` | ISC | Bộ sưu tập biểu tượng (icons) hiện đại, nhẹ nhàng dùng cho giao diện. |
| `lunar-javascript` | `1.7.7` | MIT | An lịch âm dương trực tiếp trên giao diện để hỗ trợ chọn lịch chọn giờ. |
| `tailwind-merge` | `^3.5.0` | MIT | Gộp các lớp class Tailwind CSS động mà không bị ghi đè thuộc tính xung đột. |
| `clsx` | `^2.1.1` | MIT | Tiện ích ghép nối các chuỗi class CSS có điều kiện. |
| `postcss` | `^8.5.9` | MIT | Bộ tiền xử lý CSS đi kèm với Tailwind để tối ưu hóa output style. |
```
