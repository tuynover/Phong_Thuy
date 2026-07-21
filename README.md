# ☯️ Hệ thống Ứng dụng Phong Thủy & Gieo Quẻ (IChing - Bazi - Ziwei - Marriage - Admin)

Dự án này là một hệ thống ứng dụng web cung cấp các công cụ phân tích phong thủy, bao gồm phân tích **Kinh Dịch (IChing)**, **Tứ Trụ - Bát Tự (Bazi)**, **Lá Số Tử Vi (Ziwei)**, và **Xem Tuổi Kết Hôn (Marriage)**, hỗ trợ người dùng xem lá số, gieo quẻ, và nhận luận giải chuyên sâu từ AI tích hợp tính năng hỏi đáp chuyên sâu (Follow-up Chat).

Dự án được chia làm 2 phần chính: **Frontend** (giao diện người dùng) và **Backend** (máy chủ xử lý logic, cơ sở dữ liệu và tích hợp AI).

---

## 🏗️ Cấu trúc dự án

- `/frontend`: Mã nguồn giao diện người dùng (React 19 / Vite / Tailwind CSS).
- `/backend`: Mã nguồn máy chủ (Node.js / Express.js / MongoDB).

---

## 🎨 1. Hệ thống Frontend

### 🛠️ Công nghệ sử dụng
- **Core:** React 19, Vite.
- **Styling:** Tailwind CSS (v3), PostCSS.
- **Icons:** Lucide React.
- **HTTP Client:** Axios.
- **Markdown Renderer:** React Markdown & remark-gfm (hiển thị kết quả luận giải và bài viết phong thủy định dạng Markdown/GFM đẹp mắt, hỗ trợ bảng tự động và chèn ảnh minh họa).
- **Linter:** ESLint.

### 🌟 Chức năng chính theo từng Phân hệ

#### A. Kinh Dịch (IChing Board)
* Giao diện tích hợp 2 bảng điều khiển chính:
  * **Gieo Quẻ Lục Hào (Coin Toss):** Mô phỏng gieo quẻ ảo (tung 3 đồng xu 6 lần), tính toán Quẻ Chính, Quẻ Biến, Hào Động, Vượng Suy, Vòng Trường Sinh (12 giai đoạn), Quái Thân và các mối quan hệ Ngũ Hành.
  * **Mai Hoa Dịch Số (Mai Hoa Input):** Hỗ trợ lập quẻ theo 2 phương thức: **Giờ Động Tâm** (tính toán dựa trên ngày giờ) và **Seri Tiền 8 Số** (dãy số ngẫu nhiên). Công thức Số Lý Động Tâm được hiển thị trực quan và chi tiết ngay trên màn hình.
* **Thầy Dịch Giải AI:** Nút nổi bật (Floating Action Button - FAB) góc dưới khi tạo quẻ thành công, cung cấp luồng xác thực đăng nhập trước khi gọi AI và hiển thị trạng thái phân tích động (Đang xét Nhật Nguyệt, Đang tính Hào Động...).
* Tệp tin liên quan: [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx), [MaiHoaInput.jsx](file:///t:/Phongthuy/frontend/src/components/MaiHoaInput.jsx), [CoinToss.jsx](file:///t:/Phongthuy/frontend/src/components/CoinToss.jsx).

#### B. Mệnh Số Bát Tự (Bazi Board)
* Nhập ngày giờ sinh để lập lá số Tứ Trụ.
* Phân tích bản mệnh ngũ hành, xác định Nhật Chủ (Day Master) mạnh/yếu, định Dụng Thần (Useful God) dựa trên Nguyệt Lệnh, phân tích Thập Thần và vòng Trường Sinh.
* Màu sắc trực quan được tùy biến theo quy luật tương sinh tương khắc của Ngũ Hành.
* Tệp tin liên quan: [BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx), [BaziInput.jsx](file:///t:/Phongthuy/frontend/src/components/BaziInput.jsx).

#### C. Lá Số Tử Vi (Ziwei Board & Chart)
* **Mệnh bàn 4x4 truyền thống:** Đồ hình 12 cung sắp xếp vòng quanh Trung Cung theo tọa độ Địa Chi chuẩn cổ học phương Đông.
* **Phân tích Tinh Tú:** Hiển thị Chính tinh kèm độ sáng (Miếu, Vượng, Đắc, Bình, Hãm), Lục cát tinh, Lục sát tinh và tạp tinh được chia thành các cột Cát/Sát rõ ràng, phân biệt màu sắc ngũ hành từng sao.
* **Vòng Trường Sinh & Hạn:** Hiển thị Đại Hạn, Tiểu Hạn, Nguyệt Hạn tương ứng trên các cung vị.
* **Mobile List View:** Tự động tối ưu hóa và thu gọn bố cục thành danh sách rút gọn mượt mà trên thiết bị di động.
* **Thầy Tử Vi AI:** Gửi yêu cầu giải đoán trực tiếp. Hệ thống hiển thị dòng văn bản luận giải trực quan qua luồng SSE Stream thời gian thực tương tự như Kinh Dịch và Bát Tự.
* Tệp tin liên quan: [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx), [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiChart.jsx).

#### D. Hợp Hôn - Xem Tuổi Kết Hôn (Marriage Board)
* Cho phép nhập đầy đủ thông tin ngày giờ sinh của cả Nam và Nữ để kiểm tra mức độ hòa hợp.
* Đối chiếu bản mệnh ngũ hành, Bát Tự, Mệnh Quái (Đông/Tây tứ mệnh), Cung Phi bát trạch.
* AI hỗ trợ giải đoán chi tiết về hôn nhân gia đạo, ưu nhược điểm của cặp đôi và giải pháp hóa giải xung khắc.
* Tệp tin liên quan: [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx), [MarriageInput.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageInput.jsx).

#### E. Kiến Thức Phong Thủy & Chia Sẻ (Blog Board)
* Trang tin tức và bài viết chiêm nghiệm học thuật công khai với 6 danh mục phong thủy chính.
* Đồng bộ đường dẫn tĩnh Deep-Linking dạng `https://tuynover.ddns.net/?post={slug}` cho từng bài viết.
* Tích hợp thanh chia sẻ đa nền tảng (Sao chép link, Facebook Sharer, Web Share API di động).
* Trình diễn bài viết với `ReactMarkdown` & `remark-gfm`, tự động định dạng bảng GFM (`Vertical Pipe Normalizer`) và chèn ảnh minh họa sắc nét.
* Tệp tin liên quan: [BlogBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BlogBoard.jsx).

#### F. Trang Quản Trị (Admin App)
* Dashboard chuyên sâu dành cho Quản trị viên và Đồng quản trị viên (Admin / Co-Admin).
* Quản lý người dùng, khóa/mở tài khoản, cấp phát Credits/Coins.
* **Quản lý bài viết Blog:** Viết bài mới với bộ chuyển đổi **Soạn Thảo Markdown** vs **Xem Trước (Preview)**, tự động sinh slug thời gian thực, lưu bản nháp/công khai.
* Kiểm tra lịch sử tính toán, khóa/mở hoặc xóa các bản ghi phong thủy vi phạm.
* Quản lý khiếu nại (Ban Appeals) và xem nhật ký hệ thống thời gian thực qua Server-Sent Events (SSE).
* Tệp tin liên quan: [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx).

#### F. Tiện ích Phụ trợ & UI/UX Đột phá
* **Khung Chat Thông Minh (AiChatWidget):** Bounded Slide-in Panel trượt mềm mại từ góc phải màn hình, hỗ trợ hiển thị luồng SSE thời gian thực từ AI, có thanh tiến độ độ tin cậy (Confidence Bar), Ứng Kỳ (Timing), Cảnh báo rủi ro (Risk) và bộ đếm cooldown 10s tránh spam.
* **State Persistence:** Sử dụng `localStorage` lưu trữ trạng thái phân hệ, quẻ hiện tại, lá số hiện tại và lịch sử chat để tránh mất dữ liệu khi Refresh/F5.
* **Tránh trùng lặp Lá số Bản thân:** Tự động so khớp ngày sinh, giờ sinh và giới tính khi click "Xem Lá Số Của Bản Thân" ở Bát Tự và Tử Vi, nạp lại bản ghi cũ đã liên kết nếu khớp hoàn toàn thay vì sinh mới để tối ưu hóa quota credit AI và tránh rác lịch sử.
* **Xóa mềm (Soft Delete) & Hủy liên kết:** Danh sách lịch sử gieo quẻ/lá số được xóa dưới dạng xóa mềm (`isDeleted: true`). Nếu bản ghi bị xóa trùng khớp với liên kết lá số bản thân của người dùng, hệ thống sẽ tự động hủy liên kết đó trong hồ sơ cá nhân (`ownBaziRecordId`/`ownZiweiRecordId` đặt về `null`).
* **Grid Selector:** Thay thế dropdown chọn giờ sinh bằng bảng chọn Can Chi 3 cột trực quan.
* Tệp tin liên quan: [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx), [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx), [NotificationBell.jsx](file:///t:/Phongthuy/frontend/src/components/NotificationBell.jsx).

---

## ⚙️ 2. Hệ thống Backend

### 🛠️ Công nghệ sử dụng
- **Core:** Node.js, Express.js (v5).
- **Database & Cache:** MongoDB (Mongoose v9), Redis (`ioredis`, Redis Alpine).
- **Security:** JWT, bcryptjs, CORS, creditCheck Middleware, antiSpamLock Middleware (Distributed Mutex Lock).
- **AI Engine:** Google Gemini API (`@google/generative-ai` model `gemini-1.5-pro`).
- **Phong thủy Logic:** `lunar-javascript` (Lịch pháp âm dương, Can Chi, Bát Tự).


### 🌟 Kiến trúc lõi & Các dịch vụ xử lý chuyên sâu

1. **Rule Engine chuyên sâu (`RuleEngineService.js`):**
   * Tính toán các tham số học thuật tĩnh cho Kinh Dịch: tự động tìm Dụng Thần (dựa trên câu hỏi và giới tính), phân tích tương quan Nhật/Nguyệt (Ngày/Tháng gieo quẻ) tác động lên các hào.
   * Tệp tin: [RuleEngineService.js](file:///t:/Phongthuy/backend/src/services/RuleEngineService.js).
2. **Hệ Thống An Sao Tử Vi (`ZiweiFormatter.js` & `ZiweiValidators.js`):**
   * Xây dựng đồ hình Tử Vi, xác định Cung Mệnh/Thân, Cục, sao chủ và an hệ thống phụ tinh phong phú (Bác Sĩ, Trường Sinh, Tuế Tiền, Tướng Tinh, Tuần, Triệt...).
   * Tệp tin: [ZiweiFormatter.js](file:///t:/Phongthuy/backend/src/services/ZiweiFormatter.js).
3. **Phân Tích Bát Tự Ngũ Hành (`BaziAnalyzer.js`):**
   * Xử lý tính toán ngũ hành Bát Tự theo thuật toán 4.0 với các cơ chế điều chỉnh phần trăm tương đối, quy tắc hợp giải xung (ưu tiên tổ hợp địa chi), đa thấu phân khí, tiết khí cực đoan (con vượng mẹ kiệt) và cơ chế phá điểm sàn phục vụ nhận diện cách cục Tòng Cách chính xác.
   * Tệp tin: [BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js).
4. **Hợp nhất Lược đồ Chat:**
   * Thay thế các bảng chat riêng rẽ bằng cấu trúc dùng chung [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js) (phân loại qua trường `system`: `'iching' | 'bazi' | 'ziwei' | 'marriage'`) và [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js) để tối ưu lưu trữ.
5. **Gộp Controller Core xử lý AI và Lịch sử:**
   * [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js): Xử lý stream SSE luận đoán ban đầu và trò chuyện follow-up cho toàn bộ các phân hệ.
   * [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js): Xem lịch sử bản ghi, xếp hạng đánh giá (rate), liên kết dữ liệu guest vào tài khoản (link), xóa bản ghi.
6. **Quản lý Prompt động:**
   * Tách biệt các bộ prompt chuyên môn bằng tiếng Anh giúp nâng cao chất lượng phản hồi từ Gemini: [IChingPrompts.js](file:///t:/Phongthuy/backend/src/services/IChingPrompts.js), [BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js), [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js), [MarriagePrompts.js](file:///t:/Phongthuy/backend/src/services/MarriagePrompts.js).
7. **Hệ thống Nhật ký cao cấp (`LoggerService.js`):**
   * Hoạt động song song: In console có mã màu ANSI và ghi tệp log vật lý (`logs/app.log`, `logs/errors.log`). Tự động truy quét định danh JWT để ghi nhận IP, Email người dùng và ẩn mật khẩu bảo mật.
   * Tệp tin: [LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js).
8. **Duy trì kết nối SSE Keepalive Ping:**
   * Gửi gói tin heartbeat định kỳ mỗi 15 giây ngăn chặn lỗi ngắt kết nối rác do Idle Timeout khi phân phối qua Nginx, Render hoặc Vercel.
9. **Cơ chế Cache Tối ưu & Redis Hybrid (L1 RAM + L2 Redis):**
   * Đệm thông tin Profile User trong bộ nhớ RAM L1 (`userProfileRamCache`) giúp phản hồi auth dưới 1ms, gộp các lệnh RateLimiter trong 1 Redis Pipeline duy nhất, bọc Fast Fail Timeout (`withTimeout` max 300ms-500ms) và kích hoạt `family: 4` chống trễ DNS AAAA trên AWS EC2. Tự động lưu snapshot luận giải (`analysisSnapshot`) và lưu trữ đệm qua [MemoryCacheService.js](file:///t:/Phongthuy/backend/src/services/MemoryCacheService.js) để tái sử dụng, giúp giảm thiểu tối đa chi phí gọi Gemini API.

---

## 📡 3. Bản đồ API (RESTful Endpoints)

Hệ thống API Backend sử dụng tiền tố `/api` và phân chia thành các cụm chức năng sau:

### 🔐 Xác thực & Người dùng (`/api/auth`)
* `POST /api/auth/register`: Đăng ký tài khoản.
* `POST /api/auth/login`: Đăng nhập nhận JWT.
* `PUT /api/auth/bazi`: Lưu thông tin ngày sinh mặc định của người dùng.
* `PUT /api/auth/profile`: Cập nhật thông tin hồ sơ cá nhân.
* `PUT /api/auth/change-password`: Thay đổi mật khẩu người dùng.

### ☯️ Gieo Quẻ Kinh Dịch
* `POST /api/iching/calculate` (và các alias `/api/hexagrams/calculate`, `/api/calculate`): Tính toán thông số quẻ Kinh Dịch từ dữ liệu tung xu hoặc số lý Mai Hoa.

### 🌌 Lá Số Tứ Trụ Bát Tự
* `POST /api/bazi/analyze`: Lập lá số Bát Tự dựa trên ngày giờ sinh.

### 👫 Xem Tuổi Kết Hôn
* `POST /api/marriage/analyze`: So khớp Bát Tự Nam - Nữ và tính toán điểm tương hợp sơ bộ.

### 🌠 Hệ thống Tử Vi (`/api/ziwei` & `/api/tu-vi`)
* `POST /api/ziwei/`: Tạo lập đồ hình Tử Vi thô.
* `GET /api/ziwei/:id`: Chi tiết bản ghi Tử Vi.

### ☯️ Tra cứu khái niệm học thuật (`/api/concept`)
* `GET /api/concept/:term`: Tra cứu chi tiết một thuật ngữ phong thủy/gieo quẻ (Lục Thân, Lục Thú, hào Thế/Ứng) phục vụ hiển thị Tooltip giải thích.

### 🤖 Luận Giải AI & Trò chuyện Chat (`/api/ai` hoặc thông qua `/api/history`)
* `POST /api/ai/iching/:id/interpret` (hoặc `/api/history/iching/:id/interpret`): Stream kết quả phân tích quẻ Kinh Dịch (SSE).
* `POST /api/ai/iching/:id/chat` (hoặc `/api/history/iching/:id/chat`): Chat hỏi đáp sâu về quẻ Kinh Dịch (SSE).
* `POST /api/ai/bazi/:id/interpret` (hoặc `/api/history/bazi/:id/interpret`): Stream luận giải lá số Bát Tự.
* `POST /api/ai/bazi/:id/chat` (hoặc `/api/history/bazi/:id/chat`): Chat hỏi đáp về Bát Tự.
* `POST /api/ai/ziwei/:id/interpret` (hoặc `/api/history/ziwei/:id/interpret`): Stream kết quả luận giải lá số Tử Vi (SSE).
* `POST /api/ai/ziwei/:id/chat` (hoặc `/api/history/ziwei/:id/chat`): Chat hỏi đáp về Tử Vi.
* `POST /api/history/marriage/:id/interpret`: Stream luận đoán kết hôn/hợp hôn.
* `POST /api/history/marriage/:id/chat`: Chat hỏi đáp về kết hôn/hợp hôn.

### 🗂️ Lịch sử & Đánh giá (`/api/history`)
* `GET /api/history/iching/:userId`: Lấy lịch sử gieo quẻ Kinh Dịch.
* `GET /api/history/bazi/:userId`: Lấy lịch sử lập lá số Bát Tự.
* `GET /api/history/ziwei/:userId`: Lấy lịch sử lập lá số Tử Vi.
* `GET /api/history/marriage/:userId`: Lấy lịch sử xem tuổi kết hôn.
* `PUT /api/history/:type/:id/rate`: Đánh giá 1-5 sao cho bản ghi tương ứng.
* `PUT /api/history/:type/:id/link`: Liên kết bản ghi guest vào userId cụ thể sau khi đăng nhập.
* `DELETE /api/history/calculations/:type/:id`: Xóa bản ghi (chuyển trạng thái `isDeleted = true`).

### 🛠️ Quản trị hệ thống (`/api/admin`)
* `GET /api/admin/users`: Danh sách người dùng hệ thống.
* `PUT /api/admin/users/:id/role`: Cập nhật phân quyền (Admin / Co-Admin / User).
* `PUT /api/admin/users/:id/credits`: Cộng/trừ tiền ảo (Credits) của người dùng.
* `POST /api/admin/users/:id/lock` / `unlock`: Khóa/Mở khóa tài khoản.
* `GET /api/admin/calculations`: Xem toàn bộ các lượt tính toán của hệ thống.
* `DELETE /api/admin/calculations/:type/:id`: Xóa/Khóa bản ghi tính toán của người dùng.
* `GET /api/admin/analytics`: Thống kê tổng hợp hoạt động của máy chủ.
* `GET /api/admin/notifications`: Lấy danh sách thông báo hệ thống và khiếu nại.
* `POST /api/admin/appeals/:id/resolve`: Giải quyết đơn khiếu nại mở khóa.
* `GET /api/admin/events`: Đăng ký luồng sự kiện quản trị thời gian thực (SSE).

### 🔔 Thông báo Người dùng (`/api/notifications`)
* `GET /api/notifications`: Lấy danh sách thông báo nhắc nhở Ứng Kỳ của người dùng hiện tại.
* `PUT /api/notifications/read-all`: Đánh dấu đọc tất cả thông báo.
* `PUT /api/notifications/:id/read`: Đánh dấu đọc một thông báo cụ thể.

---

---

## 🚀 Hướng dẫn khởi chạy dự án tại địa phương

### Bước 1: Khởi động MongoDB
Đảm bảo MongoDB đã chạy trên máy của bạn (mặc định tại `mongodb://localhost:27017`).

### Bước 2: Cài đặt và cấu hình Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` tại thư mục `/backend` với nội dung mẫu:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/phongthuy
   JWT_SECRET=your_secret_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Khởi chạy máy chủ:
   ```bash
   npm run dev
   ```
5. Khởi chạy Unit Test Suite (Jest - 19 Test Suites, 86/86 Tests PASSED):
   ```bash
   npm test
   ```

### Bước 3: Cài đặt và cấu hình Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` tại thư mục `/frontend` nếu cần chỉ định API URL:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
4. Khởi chạy giao diện nhà phát triển:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập `http://localhost:5173`.

### 🐳 Cách 2: Khởi chạy bằng Docker Compose (Khuyên dùng cho AWS VM hoặc môi trường đóng gói)

Nếu bạn muốn chạy đóng gói toàn bộ hệ thống (Frontend và Backend) cùng Nginx Reverse Proxy (lắng nghe ở cổng 80), hãy làm theo các bước sau:

1. Đảm bảo đã tạo và cấu hình tệp `.env` tại thư mục `/backend` (kết nối MongoDB Atlas, cấu hình JWT_SECRET, GEMINI_API_KEY...).
2. Tại thư mục gốc của dự án, khởi chạy Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Toàn bộ hệ thống sẽ được phục vụ qua cổng `80` (HTTP) của máy host thông qua Nginx:
    - Truy cập `http://localhost/` hoặc địa chỉ IP public của máy ảo AWS để trải nghiệm giao diện người dùng (Frontend).
    - Truy cập `http://localhost/health` để kiểm tra trạng thái hoạt động của Backend.

---

## 💾 4. Hệ thống Sao lưu & Đồng bộ Google Drive Tự động

Dự án cung cấp sẵn một bộ công cụ tự động hóa sao lưu cơ sở dữ liệu MongoDB Atlas và tải lên Google Drive của bạn định kỳ để phòng ngừa sự cố mất mát dữ liệu.

### 📁 Các Script hỗ trợ (Thư mục `/scripts`)
* [backup.sh](file:///t:/Phongthuy/scripts/backup.sh): Khởi chạy container `mongo:8` chạy `mongodump` theo URI trong `.env`, nén file thành `.tar.gz` lưu trữ tại `backups/` và giới hạn tối đa 7 bản lưu cục bộ. Tự động gọi tiếp `upload_drive.sh` và `cleanup_drive.sh`.
* [upload_drive.sh](file:///t:/Phongthuy/scripts/upload_drive.sh): Sử dụng cấu hình `rclone` (trong `config/rclone/rclone.conf`) đồng bộ bản sao lưu lên tài khoản Google Drive đã liên kết.
* [cleanup_drive.sh](file:///t:/Phongthuy/scripts/cleanup_drive.sh): Tự động xóa các bản sao lưu cũ trên Google Drive, chỉ giữ lại **30 bản gần nhất**.
* [restore.sh](file:///t:/Phongthuy/scripts/restore.sh): Khôi phục dữ liệu từ tệp tin backup `.tar.gz`.

### ⏱️ Tự động hóa qua Host-level Cronjob (GMT+7)
Thiết lập cronjob chạy tự động vào **00:00 đêm hàng ngày** trên hệ điều hành của máy chủ AWS/VPS:
1. Đăng nhập vào Server qua SSH.
2. Cấp quyền chạy cho các script:
   ```bash
   chmod +x scripts/*.sh
   ```
3. Mở cấu hình cronjob của Server:
   ```bash
   crontab -e
   ```
4. Thêm cấu hình chạy lúc 00:00 hàng ngày (đảm bảo Server đã được đổi múi giờ Việt Nam qua lệnh `sudo timedatectl set-timezone Asia/Ho_Chi_Minh`):
   ```cron
   0 0 * * * /bin/bash /home/ubuntu/phongthuy/Phong_Thuy/scripts/backup.sh >> /home/ubuntu/phongthuy/Phong_Thuy/logs/backup.log 2>&1
   ```
5. Theo dõi nhật ký chạy tại `/home/ubuntu/phongthuy/Phong_Thuy/logs/backup.log`.
