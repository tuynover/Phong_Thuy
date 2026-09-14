# 📦 DEPENDENCIES.md - Danh mục Thư viện & Phụ thuộc của Hệ thống

Dưới đây là danh mục toàn bộ các thư viện bên thứ ba (Dependencies) được sử dụng trong hệ thống cùng với mục đích sử dụng và các thông tin liên quan.

---

## ⚙️ 1. Thư viện Backend (`/backend/package.json`)

### Dependencies chính:
| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích / Chức năng chính trong hệ thống |
| :--- | :--- | :--- | :--- |
| `express` | `^5.2.1` | MIT | Framework xây dựng API. Sử dụng phiên bản 5.x hỗ trợ xử lý lỗi Promise bất đồng bộ tự động mà không cần wrapper. |
| `mongoose` | `^9.6.2` | MIT | ODM kết nối cơ sở dữ liệu MongoDB, cung cấp Schema, Validation và Hooks. |
| `ioredis` | `^5.4.2` | MIT | Client Redis hiệu năng cao phục vụ Anti-Spam lock, Rate limiting, OTP storage, Blacklist tokens và Caching L2. |
| `lunar-javascript` | `1.7.7` | MIT | Lõi tính toán lịch pháp âm dương, can chi, nhật nguyệt phục vụ cho cả Kinh Dịch, Bát Tự và Hợp Hôn. |
| `iztro` | `2.5.8` | MIT | Thư viện chuyên biệt dành cho Tử Vi Bắc Phái, hỗ trợ an sao 12 cung vị. |
| `@google/generative-ai`| `^0.24.1` | Apache-2.0 | SDK gọi mô hình Gemini 1.5 Pro / Gemini 2.0 / 3.1 Flash để sinh văn bản luận giải AI. |
| `jsonwebtoken` | `^9.0.3` | MIT | Tạo và xác thực mã JWT phục vụ cho hệ thống Authentication. |
| `bcrypt` | `^5.1.1` | MIT | Mã hóa một chiều (hashing) mật khẩu người dùng với salt rounds trước khi lưu MongoDB. |
| `uuid` | `^14.0.0` | MIT | Sinh mã định danh duy nhất theo chuẩn UUIDv7 làm khóa chính `_id` cho cơ sở dữ liệu. |
| `nodemailer` | `^9.0.0` | MIT | Xử lý gửi email thông báo sự kiện Ứng Kỳ và mã xác thực Email OTP. |
| `cors` | `^2.8.6` | MIT | Cho phép các yêu cầu HTTP từ frontend truy cập tài nguyên của backend an toàn. |
| `dotenv` | `^17.4.1` | BSD-2-Clause | Nạp cấu hình từ tệp `.env` vào biến môi trường `process.env`. |
| `mongoose-sequence` | `^6.0.1` | MIT | Hỗ trợ tự động tăng số thứ tự (Auto-increment) nếu cần thiết. |
| `helmet` | `^8.3.0` | MIT | Bảo mật ứng dụng Express thông qua các HTTP headers tiêu chuẩn (CSP, HSTS...). |
| `compression` | `^1.7.5` | MIT | Nén dữ liệu HTTP phản hồi (gzip/deflate) giúp giảm 70% băng thông mạng truyền tải. |
| `express-mongo-sanitize` | `^2.2.0` | MIT | Ngăn chặn các cuộc tấn công NoSQL Injection bằng cách lọc các ký tự nguy hiểm (`$` và `.`). |
| `winston` | `^3.19.0` | MIT | Thư viện ghi log chuyên nghiệp đa kênh (Console, File, Rotating file). |
| `winston-daily-rotate-file` | `^5.0.0` | MIT | Cơ chế xoay vòng tệp log vật lý hàng ngày (`maxFiles: '14d'`, `maxSize: '20m'`). |
| `firebase-admin` | `^14.1.0` | Apache-2.0 | Tích hợp xác thực Firebase Auth & thông báo đẩy (FCM Push Notifications). |
| `google-auth-library` | `^10.7.0` | Apache-2.0 | Xác thực OAuth2 Google và hỗ trợ tự động ping Google Indexing API. |
| `msedge-tts` | `^2.0.7` | MIT | Lõi chuyển đổi văn bản luận giải thành giọng nói đọc bài phong thủy (Text-to-Speech). |
| `puppeteer` | `^25.10.0` | Apache-2.0 | Trình duyệt không đầu (Headless browser) phục vụ xuất ảnh/PDF lá số phân giải cao. |
| `swagger-ui-express` | `^5.0.1` | MIT | Trực quan hóa và chạy thử nghiệm API tài liệu RESTful trên trình duyệt web. |

### DevDependencies (Backend):
| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích |
| :--- | :--- | :--- | :--- |
| `jest` | `^30.4.2` | MIT | Framework kiểm thử tự động (Unit Test / Integration Test) với 35 test suites / 257 tests. |

---

## 🎨 2. Thư viện Frontend (`/frontend/package.json`)

### Dependencies chính:
| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích / Chức năng chính trong hệ thống |
| :--- | :--- | :--- | :--- |
| `react` | `^19.2.4` | MIT | Thư viện xây dựng giao diện người dùng. Sử dụng React 19 tối ưu hóa hiệu năng render. |
| `react-dom` | `^19.2.4` | MIT | Cầu nối tương tác giữa React và cây DOM của trình duyệt. |
| `vite` | `^8.0.4` | MIT | Công cụ build và chạy môi trường dev cực nhanh thay thế cho Webpack truyền thống. |
| `tailwindcss` | `^3.4.19` | MIT | Framework CSS dạng tiện ích giúp thiết kế giao diện nhanh chóng, tương thích responsive. |
| `axios` | `^1.15.0` | MIT | Thư viện HTTP Client để gửi request lên Backend và đính kèm JWT token. |
| `react-markdown` | `^10.1.0` | MIT | Biên dịch chuỗi văn bản Markdown trả về từ AI thành định dạng HTML sạch đẹp. |
| `remark-gfm` | `^4.0.1` | MIT | Plugin mở rộng GFM cho `react-markdown` hỗ trợ định dạng bảng, gạch ngang và danh sách kiểm tra. |
| `rehype-sanitize` | `^6.0.0` | MIT | Lọc và làm sạch HTML độc hại (XSS prevention) khi hiển thị nội dung Markdown. |
| `recharts` | `^3.8.1` | MIT | Vẽ các biểu đồ thống kê (API usage, active users...) trên Trang quản trị Admin. |
| `lucide-react` | `^1.7.0` | ISC | Bộ sưu tập biểu tượng (icons) hiện đại, nhẹ nhàng dùng cho giao diện. |
| `framer-motion` | `^12.42.2` | MIT | Thư viện hiệu ứng diễn hoạt (animations) mượt mà cho modal, transition và tab. |
| `event-source-polyfill`| `^1.0.31` | Apache-2.0 | Hỗ trợ kết nối SSE (Server-Sent Events) truyền custom Authorization header. |
| `firebase` | `^12.16.0` | Apache-2.0 | SDK phía Client tích hợp đăng nhập mạng xã hội và dịch vụ Firebase. |
| `lunar-javascript` | `1.7.7` | MIT | An lịch âm dương trực tiếp trên giao diện để hỗ trợ chọn lịch chọn giờ. |
| `tailwind-merge` | `^3.5.0` | MIT | Gộp các lớp class Tailwind CSS động mà không bị ghi đè thuộc tính xung đột. |
| `clsx` | `^2.1.1` | MIT | Tiện ích ghép nối các chuỗi class CSS có điều kiện. |
| `postcss` | `^8.5.9` | MIT | Bộ tiền xử lý CSS đi kèm với Tailwind để tối ưu hóa output style. |
| `autoprefixer` | `^10.4.27` | MIT | Tự động thêm tiền tố vendor CSS cho các trình duyệt khác nhau. |

### DevDependencies (Frontend):
| Tên thư viện | Phiên bản | Bản quyền (License) | Mục đích |
| :--- | :--- | :--- | :--- |
| `vitest` | `^5.0.0` | MIT | Test runner tốc độ cao tích hợp chặt chẽ với Vite (29 tests PASS). |
| `@testing-library/react` | `^16.3.3` | MIT | Thư viện kiểm thử render và tương tác người dùng trên React components. |
| `@testing-library/jest-dom` | `^7.0.1` | MIT | Mở rộng các hàm matcher DOM (toBeInTheDocument, toHaveClass...). |
| `jsdom` | `^29.1.1` | MIT | Môi trường giả lập DOM trên Node.js phục vụ chạy Vitest. |
| `eslint` | `^9.39.4` | MIT | Linter kiểm tra tĩnh cú pháp và chất lượng mã nguồn JavaScript/React. |

