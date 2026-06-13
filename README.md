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
- **Giao diện Mai Hoa Dịch Số - Seri Tiền:**
  - Tích hợp 2 phương pháp lập quẻ: **Giờ Động Tâm** (ngày giờ động tâm cụ thể) và **Seri Tiền 8 Số** (dãy số ngẫu nhiên).
  - **Công thức Số Lý Động Tâm:** Hiển thị trực quan và chi tiết ngay trên giao diện các bước tính toán Thượng Quái, Hạ Quái, và Hào Động theo nguyên lý Dịch học Tiên Thiên, giúp tăng tính giáo dục và độ tin cậy.
- **Phân Hệ Mệnh Số Tử Vi (Mới):**
  - **Mệnh Bàn 4x4 Truyền Thống:** Đồ hình 12 cung được xếp vòng quanh Trung Cung theo tọa độ Địa Chi (Dần đến Hợi).
  - **Phân tích Tinh Tú & Ngũ Hành:** Hiển thị chi tiết Chính tinh (kèm đắc hãm Miếu/Vượng/Đắc/Bình/Hãm), Lục cát tinh, Lục sát tinh, tạp tinh được chia cột Cát/Sát rõ ràng. Mỗi sao được tô màu phân biệt theo bản mệnh ngũ hành riêng biệt.
  - **Thông tin Vòng Trường Sinh & Hạn:** Hiển thị số Đại Hạn tuổi khởi đầu, Tiểu Hạn Địa Chi bản cung, Nguyệt Hạn cụ thể.
  - **Chế độ Danh Sách (Mobile List View):** Tự động thu gọn và tối ưu hóa hiển thị thành dạng danh sách cung dọc mượt mà trên thiết bị di động.
  - **Thầy Tử Vi Luận Giải AI:** Tích hợp gọi AI giải đoán chi tiết cát hung các cung và trò chuyện hỏi đáp sâu (follow-up) tương tự Lục Hào/Bát Tự.
- **Tối ưu hóa Trải nghiệm & Giao diện (UX/UI):**
  - **Grid Selector cho Giờ Can Chi:** Thay thế thẻ dropdown cổ điển bằng bảng chọn giờ can chi dạng grid 3 cột trực quan và hiện đại hơn cho cả 3 phân hệ (Tử Vi, Bát Tự, Kinh Dịch).
  - **Tối ưu hóa Thẻ Luận Giải (SectionCard):** Loại bỏ các icon Bookmark/Gradient dẫn đầu tiêu đề giúp giao diện thanh lịch hơn; đưa nhãn tag màu tím (như DỤNG THẦN, CÁCH CỤC...) lên ngang hàng bên phải tiêu đề trên desktop; giảm khoảng trống (padding-top) giữa tiêu đề và nội dung xuống 50% để tăng mật độ thông tin.
  - **Bảo toàn hiển thị viền (Borders & Rings):** Sửa lỗi xén viền cung đặc biệt (Mệnh màu xanh lá, Thân màu tím) bằng cách loại bỏ `overflow-hidden` ở ô cung, loại bỏ `shadow-lg` ở cung Mệnh để tránh xung đột `box-shadow` với `ring-2`, và thêm khoảng đệm `p-2 md:p-3` cho khung cuộn ngang.
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
  - Xem lại lịch sử các quẻ đã gieo, lá số Bát Tự và Tử Vi đã tạo.
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

### 🌟 Kiến trúc Xử lý AI & Logic Học Thuật (Rule Engine + NLG)
Hệ thống sử dụng mô hình kết hợp chặt chẽ giữa thuật toán an sao cổ học và AI thế hệ mới:
1. **`RuleEngineService.js` (Rule Engine cho Lục Hào):**
   - Đóng vai trò bộ não tính toán tĩnh cho Kinh Dịch.
   - Nhận diện Dụng Thần tự động dựa trên **câu hỏi** và **giới tính** của người dùng.
   - Tính toán vượng suy theo ngũ hành ngày/tháng, thế/ứng, hào động, và hiệu ứng biến đổi (Hóa Sinh, Hóa Khắc...).
2. **Hệ Thống An Sao Tử Vi (Tử Vi Module - Mới):**
   - Tích hợp thư viện và thuật toán an sao Bắc Phái chuyên sâu.
   - Tính toán Can Chi ngày giờ sinh, bản mệnh ngũ hành, xác định vị trí Mệnh/Thân.
   - Định Cục (Kim Tứ Cục, Thủy Nhị Cục...), xác định sao chủ Mệnh, chủ Thân.
   - An sao hệ thống chính tinh (Tử Vi, Thiên Phủ...) và phụ tinh phức tạp (Lục cát tinh, Lục sát tinh, vòng Trường Sinh, vòng Bác Sĩ, vòng Tuế Tiền, vòng Tướng Tinh, Tuần Không, Triệt Lộ...).
3. **Tiến Trình AI Tử Vi Luận Giải Ngầm (Background Queues & Polling):**
   - Vì nội dung luận đoán lá số Tử Vi cực kỳ lớn và cần nhiều tài nguyên, hệ thống triển khai hàng đợi tác vụ ngầm (Background Job Queue).
   - Khi người dùng gửi yêu cầu giải đoán, hệ thống trả về ngay lập tức mã tiến trình `jobId`. Frontend thực hiện polling ngầm để kiểm tra tiến độ của "Đại sư". Khi hoàn thành, AI lưu đệm snapshot luận giải giúp tối ưu hóa chi phí API.
4. **`HexagramDataService.js` (Tối ưu hóa Database):**
   - Dựng lại (reconstruct) các hào động/hào tĩnh on-the-fly khi truy vấn lịch sử hoặc luận giải, giúp MongoDB không cần lưu trữ mảng Hào nặng nề.
5. **`PromptTemplateManager.js` (Template Manager):**
   - Quản lý các cấu trúc Prompt động. Nhận JSON từ Rule Engine hoặc thông tin lá số Tử Vi thô để sinh ra Prompt có cấu trúc nghiêm ngặt gửi cho AI.
6. **`AiService.js` (NLG - Natural Language Generator):**
   - Đưa Prompt đã tối ưu hóa cho mô hình `gemini-1.5-pro` để sinh văn bản giải nghĩa tự nhiên và đưa ra lời khuyên cải mệnh chi tiết.
   - Tích hợp cơ chế Timeout (20 giây), Retry (2 lần) và bắt các lỗi quá tải hoặc vi phạm chính sách an toàn.
7. **`ConversationContextService.js` (Quản Lý Bối Cảnh Hội Thoại & Bảo Vệ Quota):**
   - **Xác định Intent (`isDivinationRelated`):** Từ chối tức thì (HTTP 400) các câu hỏi lạc đề trước khi chuyển tới AI. Cho phép đặc cách hỏi về thời tiết/mưa nắng để chọn ngày cát lợi.
   - **Tóm tắt động (`updateConversationSummary`):** Thực hiện tiến trình bất đồng bộ sinh tóm tắt 3-4 dòng hội thoại lưu trữ trực tiếp tại `Conversation` nhằm tối ưu hóa kích thước Context của Gemini API.
8. **`LoggerService.js` (Nhật Ký Kiểm Toán Cao Cấp):**
   - **Hoạt động kép:** Ghi đồng thời ra console (mã màu ANSI) và lưu file vật lý (`logs/app.log`, `logs/errors.log`).
   - **Middleware tự động:** Tự động giải mã token JWT để truy quét danh tính người dùng thực tế (Tên, Email), IP, thời gian xử lý, hành động phong thủy.
   - **Bảo mật:** Tự động ẩn mật khẩu đăng nhập/đăng ký trong log.
9. **Cơ Chế SSE Keepalive Ping:**
   - Server duy trì kết nối SSE liên tục bằng cách phát heartbeat ping mỗi 15 giây, ngăn chặn triệt để tình trạng Idle Timeout khi triển khai trên Nginx, Render hoặc Vercel.
10. **Cache Lõi Tính Toán (`analysisSnapshot`):**
   - Lưu đệm snapshot dữ liệu Rule Engine vào cơ sở dữ liệu ngay sau lần luận giải đầu tiên. Mọi thắc mắc chat follow-up tiếp theo sẽ tái sử dụng snapshot này mà không cần tính toán lại từ đầu.

---

## 📡 3. Hệ thống API (RESTful)

Dưới đây là danh sách các API Endpoint mà Backend cung cấp cho Frontend sử dụng:

### 🔐 Xác thực & Người dùng (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập và nhận JWT token.
- `PUT /api/auth/bazi`: Cập nhật thông tin Bát Tự (ngày giờ sinh) vào hồ sơ người dùng.

### ☯️ Gieo Quẻ & Bát Tự (`/api`)
- `POST /api/calculate`: Tính toán và trả về kết quả Gieo quẻ Lục Hào (Quẻ chính, quẻ biến, phân tích hào).
- `POST /api/bazi/analyze`: Phân tích và tạo lá số Bát Tự dựa trên thông tin ngày, giờ, tháng, năm sinh.

### 🌌 Hệ thống Tử Vi (`/api/tu-vi`)
- `POST /api/tu-vi`: Tạo lá số Tử Vi thô bản mệnh.
- `POST /api/tu-vi/:id/interpret`: Kích hoạt AI giải đoán chuyên sâu (Chạy không đồng bộ qua hàng đợi).
- `GET /api/tu-vi/jobs/:jobId`: Kiểm tra trạng thái tiến trình luận giải ngầm (Progress & status).
- `GET /api/tu-vi/history/:userId`: Lấy lịch sử tạo lá số Tử Vi của người dùng.
- `GET /api/tu-vi/:id`: Lấy chi tiết lá số Tử Vi.
- `PUT /api/tu-vi/:id/rate`: Đánh giá chất lượng của bài giải đoán Tử Vi.
- `GET /api/tu-vi/:id/messages`: Lấy danh sách các tin nhắn đã trò chuyện liên quan đến lá số.
- `POST /api/tu-vi/:id/chat`: Hỏi thầy Tử Vi thêm (luồng SSE stream phản hồi thắc mắc follow-up).

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
