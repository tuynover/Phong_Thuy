# ☯️ Hệ thống Ứng dụng Phong Thủy & Gieo Quẻ (Bát Tự - Lục Hào)

Dự án này là một hệ thống ứng dụng web cung cấp các công cụ phân tích phong thủy, cụ thể là phân tích Tứ Trụ/Bát Tự và gieo quẻ Lục Hào, hỗ trợ người dùng xem lá số, gieo quẻ, và nhận luận giải chuyên sâu từ AI.

Dự án được chia làm 2 phần chính: **Frontend** (giao diện người dùng) và **Backend** (máy chủ xử lý logic, cơ sở dữ liệu và tích hợp AI).

---

## 🏗️ Cấu trúc dự án

- `/frontend`: Mã nguồn giao diện người dùng (React/Vite).
- `/backend`: Mã nguồn máy chủ (Node.js/Express).

---

## 🎨 1. Hệ thống Frontend

### 🛠️ Công nghệ sử dụng
- **Core:** React 19, Vite.
- **Styling:** Tailwind CSS (v3), PostCSS.
- **Icons:** Lucide React.
- **HTTP Client:** Axios.
- **Markdown Renderer:** React Markdown (dành cho phần hiển thị kết quả AI).
- **Linter:** ESLint.

### 🌟 Chức năng chính
- **Giao diện Gieo Quẻ Lục Hào:**
  - Mô phỏng gieo quẻ (tung xu).
  - Hiển thị chi tiết Quẻ Chính, Quẻ Biến, Hào động.
  - Phân tích chi tiết các chỉ số: Vượng Suy, Vòng Trường Sinh (12 giai đoạn), Quái Thân, và so sánh giữa quẻ chính/quẻ biến.
- **Thầy Dịch Giải Chi Tiết (Nâng cấp từ AI Luận Giải):**
  - Cung cấp nút nổi bật (Floating Action Button - FAB) góc dưới bên phải màn hình khi tạo quẻ thành công.
  - Tích hợp luồng xác thực: Yêu cầu đăng nhập trước khi cho phép gọi Thầy Dịch Giải.
  - Giao diện xác nhận (Modal) mang đậm nét truyền thống Dịch Lý, phối màu nâu/vàng đất cao cấp.
  - Hiển thị trạng thái phân tích động (Đang xét Nhật Nguyệt, Đang tính Hào Động...) giúp cải thiện UX.
  - Hiển thị nội dung luận giải thông qua giao diện Markdown trực quan, chia theo bố cục: Tổng quan, Thế Ứng, Biến Cố, Lời Khuyên.
- **Phân Hệ Hỏi Đáp Luận Giải Sâu (AiChatWidget):**
  - Khung chat thông minh, trượt lên mềm mại từ góc dưới bên phải (FAB + Bounded Slide-in Panel), không che khuất đồ hình quẻ Dịch hay sơ đồ Bát Tự phía sau.
  - Thuật toán **Incremental JSON Stream Parser** lọc lấy nội dung chữ trả lời và chạy hiển thị thời gian thực theo dòng dữ liệu truyền tải (SSE).
  - Trượt hiển thị (micro-animations) các thẻ thông tin chuyên biệt khi kết thúc stream: **Ứng kỳ cát lợi (Timing)**, **Cảnh báo rủi ro (Risk)**, và thước đo **Độ tin cậy số học (Confidence Progress Bar)**.
  - Tích hợp bộ hồi chiêu (10 giây đếm ngược) ngăn chặn hành vi spam click.
- **Lưu trữ Trạng thái Liên tục (State Persistence):**
  - Sử dụng `localStorage` để giữ nguyên trạng thái ứng dụng (Phân hệ đang xem, Quẻ hiện tại, Lá số hiện tại, Câu hỏi) kể cả khi người dùng Refresh/F5 lại trang. Mọi thứ được đồng bộ mượt mà không làm mất luồng trải nghiệm.
- **Giao diện Phân tích Bát Tự (Tứ Trụ):**
  - Nhập thông tin ngày tháng năm sinh để lập lá số.
  - Phân tích Tứ Trụ, Thập Thần, vòng Trường Sinh.
  - Phân tích Dụng Thần (dựa trên Nguyệt Lệnh).
  - Màu sắc được thiết kế trực quan theo quy luật Ngũ Hành.
- **Quản lý Tài khoản (Xác thực):**
  - Đăng ký, đăng nhập tài khoản.
  - Cập nhật thông tin ngày giờ sinh mặc định vào hồ sơ.
- **Lịch sử & Theo dõi:**
  - Xem lại lịch sử các quẻ đã gieo và lá số Bát Tự đã tạo.
  - Chức năng đánh giá (rate) kết quả của quẻ/lá số.
  - Tự động liên kết (link) các dữ liệu gieo quẻ/lá số dưới quyền khách (guest) vào tài khoản sau khi đăng nhập/đăng ký.
- **Từ điển Khái niệm:** Tra cứu các thuật ngữ chuyên ngành phong thủy trực tiếp trên giao diện.

---

## ⚙️ 2. Hệ thống Backend

### 🛠️ Công nghệ sử dụng
- **Core:** Node.js, Express.js (v5).
- **Database:** MongoDB, Mongoose (v9).
- **Authentication & Security:** JSON Web Token (JWT), bcryptjs, CORS.
- **AI Integration:** `@google/generative-ai` (Google Gemini API).
- **Phong thủy/Lịch pháp Logic:** `lunar-javascript` (Thư viện tính toán âm lịch, can chi, bát tự).
- **Environment Management:** dotenv.

### 🌟 Kiến trúc Xử lý AI & Logic Lục Hào (Rule Engine + NLG)
Hệ thống sử dụng mô hình kết hợp chặt chẽ giúp tránh hiện tượng ảo giác (hallucination) của AI:
1. **`RuleEngineService.js` (Rule Engine):**
   - Đóng vai trò bộ não tính toán tĩnh.
   - Nhận diện Dụng Thần tự động dựa trên **câu hỏi** và **giới tính** của người dùng (ví dụ: Nữ hỏi về chồng -> Quan Quỷ, Nam hỏi về vợ -> Thê Tài).
   - Tính toán vượng suy theo ngũ hành ngày (Nhật) và tháng (Nguyệt).
   - Xác định hào thế/ứng, hào động và hiệu ứng biến đổi (Hóa Tiến, Hóa Thoái, Hóa Sinh, Hóa Khắc...).
   - Xuất dữ liệu đã xử lý ra định dạng JSON chuẩn.
2. **`HexagramDataService.js` (Tối ưu hóa Database):**
   - Đóng vai trò dựng lại (reconstruct) các hào động/hào tĩnh on-the-fly khi truy vấn lịch sử hoặc luận giải, giúp MongoDB hoàn toàn không cần lưu mảng Hào nặng nề như cấu trúc cũ.
3. **`PromptTemplateManager.js` (Template Manager):**
   - Quản lý các cấu trúc Prompt động. Nhận JSON từ Rule Engine để sinh ra Prompt có cấu trúc nghiêm ngặt gửi cho AI.
4. **`AiService.js` (NLG - Natural Language Generator):**
   - Đưa Prompt đã tối ưu hóa cho mô hình `gemini-1.5-pro` (đóng vai "Thầy Dịch Giải") để sinh văn bản giải nghĩa tự nhiên và đưa ra lời khuyên.
   - Tích hợp cơ chế Timeout (20 giây), Retry (2 lần) và bắt các lỗi quá tải hoặc vi phạm chính sách an toàn. Tự động lưu cache kết quả luận giải vào Database để không tốn API call khi xem lại.
5. **`ConversationContextService.js` (Quản Lý Bối Cảnh Hội Thoại & Bảo Vệ Quota):**
   - **Xác định Intent (`isDivinationRelated`):** Từ chối tức thì (HTTP 400) các câu hỏi lạc đề (React, lập trình, viết code, giải toán, dịch tiếng Anh...) trước khi chuyển tới AI. Cho phép đặc cách hỏi về thời tiết/mưa nắng để phục vụ chọn ngày lành tháng cát.
   - **Tóm tắt động (`updateConversationSummary`):** Thực hiện tiến trình bất đồng bộ sinh tóm tắt 3-4 dòng hội thoại lưu trữ trực tiếp tại `Conversation` nhằm tối ưu hóa kích thước Context của Gemini API.
   - **Bối cảnh hội thoại (`buildConversationContext`):** Đóng gói 3-4 tin nhắn gần nhất với định dạng sạch sẽ, giúp duy trì tính liền mạch của buổi đối thoại.
6. **`LoggerService.js` (Nhật Ký Kiểm Toán Cao Cấp):**
   - **Hoạt động kép:** Ghi đồng thời ra console (mã màu ANSI: Xanh lá cho INFO, Vàng cho WARN, Đỏ cho ERROR kèm Stack Trace) và lưu file vật lý (`logs/app.log`, `logs/errors.log`).
   - **Middleware tự động:** Tự động giải mã token JWT để truy quét danh tính người dùng thực tế (Tên, Email), IP, thời gian xử lý (duration theo ms), hành động phong thủy thuần Việt (như "Thầy Luận Giải Bát Tự").
   - **Bảo mật:** Tự động ẩn mật khẩu đăng nhập/đăng ký trong log (`password: "******"`).
7. **Cơ Chế SSE Keepalive Ping:**
   - Server duy trì kết nối SSE liên tục bằng cách phát heartbeat ping (`event: ping`, `data: keepalive`) mỗi 15 giây, ngăn chặn triệt để tình trạng Idle Timeout khi triển khai trên Nginx, Render hoặc Vercel.
8. **Cache Lõi Tính Toán (`analysisSnapshot`):**
   - Lưu đệm snapshot dữ liệu Rule Engine vào cơ sở dữ liệu ngay sau lần luận giải đầu tiên. Mọi thắc mắc chat follow-up tiếp theo sẽ tái sử dụng snapshot này mà không cần tính toán lại từ đầu.

---

## 📡 3. Hệ thống API (RESTful)

Dưới đây là danh sách các API Endpoint mà Backend cung cấp cho Frontend sử dụng:

### 🔐 Xác thực & Người dùng (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập và nhận JWT token.
- `PUT /api/auth/bazi`: Cập nhật thông tin Bát Tự (ngày giờ sinh) vào hồ sơ người dùng.

### ☯️ Gieo Quẻ & Bát Tự
- `POST /api/calculate`: Tính toán và trả về kết quả Gieo quẻ Lục Hào (Quẻ chính, quẻ biến, phân tích hào).
- `POST /api/bazi/analyze`: Phân tích và tạo lá số Bát Tự dựa trên thông tin ngày, giờ, tháng, năm sinh.

### 📖 Tra cứu khái niệm
- `GET /api/concept/:term`: Lấy thông tin giải thích chi tiết cho một thuật ngữ phong thủy cụ thể.

### 🗂️ Lịch sử & Đánh giá & AI (`/api/history`)
- `GET /api/history/hexagrams/:userId`: Lấy danh sách lịch sử gieo quẻ của người dùng.
- `GET /api/history/bazi/:userId`: Lấy danh sách lịch sử lập Bát Tự của người dùng.
- `PUT /api/history/hexagrams/:id/rate`: Đánh giá độ chính xác/phản hồi cho một quẻ đã gieo.
- `PUT /api/history/bazi/:id/rate`: Đánh giá phản hồi cho một lá số Bát Tự.
- `PUT /api/history/hexagrams/:id/link`: Liên kết quẻ gieo của khách với một tài khoản người dùng cụ thể.
- `PUT /api/history/bazi/:id/link`: Liên kết lá số Bát Tự của khách với một tài khoản người dùng cụ thể.
- `POST /api/history/hexagrams/:id/interpret`: Gọi Rule Engine phân tích và kích hoạt AI sinh bài luận giải chuyên sâu cho quẻ Kinh Dịch (Stream SSE).
- `POST /api/history/bazi/:id/interpret`: Kích hoạt AI sinh bài luận giải chuyên sâu cho bản đồ Bát Tự (Stream SSE).
- `POST /api/history/hexagrams/:id/chat`: Gọi AI phản hồi thắc mắc chuyên sâu (follow-up) dạng JSON về quẻ Dịch (Stream SSE).
- `POST /api/history/bazi/:id/chat`: Gọi AI phản hồi thắc mắc chuyên sâu (follow-up) dạng JSON về lá số Bát Tự (Stream SSE).

---

## 🚀 Hướng dẫn chạy dự án

### Chạy Backend
1. Di chuyển vào thư mục backend: `cd backend`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Cấu hình biến môi trường: Tạo file `.env` chứa:
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/phongthuy
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Khởi động server: `npm run dev` (hoặc `npm start`)

### Chạy Frontend
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Cấu hình biến môi trường: Tạo file `.env` chứa `VITE_API_URL=http://localhost:3001/api` (nếu cần đổi cổng).
4. Khởi động môi trường dev: `npm run dev`
