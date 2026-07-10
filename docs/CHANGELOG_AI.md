# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.

---

## 📅 Phiên bản: Bảo mật Quyền riêng tư, Hủy Token khi Đăng xuất & Bộ lọc Thời gian Lịch sử (10/07/2026)

### Backend (Bảo mật & Quyền riêng tư)
- **Bảo mật Quyền sở hữu Bản ghi:**
  - Tạo mới middleware [checkRecordOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkRecordOwnership.js) kiểm tra quyền truy cập của người dùng đối với các bản ghi chi tiết, đánh giá sao, liên kết tài khoản và trò chuyện AI theo ID của 4 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân). Bản ghi của `guest` được cho phép xem công khai, còn bản ghi của người dùng đã đăng ký chỉ cho phép chính chủ sở hữu hoặc tài khoản Admin/Co-Admin truy cập (trả về `403 Forbidden` nếu vi phạm).
  - Tạo mới middleware [checkHistoryOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkHistoryOwnership.js) bảo vệ danh sách lịch sử theo `userId` (chỉ cho phép bản thân user đó hoặc Admin/Co-Admin lấy dữ liệu).
  - Tạo mới middleware [optionalAuth.js](file:///t:/Phongthuy/backend/src/middleware/optionalAuth.js) giải mã JWT token một cách tùy chọn để lấy hồ sơ người dùng mà không chặn các request của khách vãng lai (guest).
  - Áp dụng 3 middleware này trên tất cả các route lịch sử, AI giải đoán và chat trong [history.js](file:///t:/Phongthuy/backend/src/routes/history.js), [ai.js](file:///t:/Phongthuy/backend/src/routes/ai.js), và [ziwei.js](file:///t:/Phongthuy/backend/src/routes/ziwei.js).
- **Hủy bỏ mã Token khi Đăng xuất (Server-side Token Invalidation):**
  - Thêm trường `tokenVersion` (kiểu số nguyên, mặc định là `0`) vào lược đồ [User.js](file:///t:/Phongthuy/backend/src/models/User.js).
  - Cập nhật [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) để đưa `tokenVersion` vào payload của JWT token khi Đăng ký, Đăng nhập thường và Đăng nhập bằng Google.
  - Viết mới API `/api/auth/logout` tăng `tokenVersion` của User trong Database thêm 1 đơn vị, vô hiệu hóa ngay lập tức mọi token đã được cấp trước đó của người dùng.
  - Cập nhật middleware xác thực [auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js) để so khớp `tokenVersion` trong token gửi lên với giá trị hiện tại trong Database. Trả về `401 Unauthorized` nếu không trùng khớp (ép đăng xuất trên client).
- **Lọc Lịch sử theo Thời gian ở Backend:**
  - Cập nhật 4 phương thức lấy lịch sử trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) hỗ trợ tham số query `startDate` và `endDate`.
  - Thực hiện lọc trực tiếp trên MongoDB Atlas thông qua điều kiện `$gte` và `$lte` trên trường `createdAt` (hoặc `dateCast` đối với Kinh Dịch).
  - Đồng bộ cập nhật cache key để chứa các khoảng ngày lọc, ngăn chặn việc lấy sai dữ liệu từ in-memory cache.

### Frontend (Giao diện & Đồng bộ)
- **Tích hợp Logout Server-side:**
  - Cập nhật hàm `logout` trong [AuthContext.jsx](file:///t:/Phongthuy/frontend/src/context/AuthContext.jsx) gửi yêu cầu `POST /api/auth/logout` trước khi xóa thông tin cục bộ nhằm vô hiệu hóa token trên máy chủ hoàn toàn.
- **Bộ lọc Lịch sử theo Ngày tháng & Custom Datepicker (React):**
  - Cập nhật [api.js](file:///t:/Phongthuy/frontend/src/services/api.js) để hỗ trợ truyền tham số params (startDate, endDate) cho 4 hàm gọi lịch sử.
  - Tự xây dựng component **`CustomDatePicker`** thay thế hoàn toàn cho input date mặc định của trình duyệt để hiển thị popup lịch chọn ngày (date picker calendar popup) cực kỳ mềm mại, bo tròn, đồng bộ màu sắc động theo Tab theme, có nút chuyển tháng bằng ChevronLeft/ChevronRight mượt mà.
  - Thiết kế thanh điều khiển Lọc theo ngày lập ở phía dưới Tab selector trong [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx) sử dụng component lịch mới này.
  - Bổ sung cụm phím tắt chọn nhanh (Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua) tiện lợi với thuật toán tính toán ngày theo múi giờ địa phương (local time) tránh bị lệch ngày do múi giờ UTC.
  - Tối ưu bố cục phân bổ các khối điều khiển (Lọc nhanh bên trái, Chọn ngày & Đặt lại bên phải) trên cùng một hàng ngang để triệt tiêu các khoảng trống dư thừa, tự động co giãn và xuống hàng linh hoạt trên Mobile.
  - Tích hợp trạng thái Active sáng lên đồng bộ theo Tab theme (Amber, Blue, Purple, Rose) cho các nút lọc nhanh khi được kích hoạt, tự động tắt khi người dùng tùy chọn ngày thủ công hoặc bấm Đặt lại.
  - Khi thay đổi ngày lọc, ứng dụng tự động fetch lại danh sách từ server theo ngày lập thực tế và reset số trang phân loại về trang `1`.

---

## 📅 Phiên bản: Tích hợp Thử nghiệm API với Swagger UI & Postman Collection (09/07/2026)

### Backend (Định cấu hình & Route mới)
- **Tích hợp Swagger UI:**
  - Cài đặt thư viện `swagger-ui-express` để dựng giao diện tài liệu API trực quan.
  - Tạo tệp tin đặc tả OpenAPI 3.0 [swagger.json](file:///t:/Phongthuy/backend/src/config/swagger.json) mô tả chi tiết toàn bộ các endpoints của hệ thống bao gồm: Các tham số, cấu trúc Body, Headers và dữ liệu mẫu đầy đủ để hỗ trợ test nhanh (như lập quẻ, lập lá số Bát Tự, Tử Vi, Trạch Cát).
  - Tích hợp route `/api-docs` vào [index.js](file:///t:/Phongthuy/backend/src/index.js) để phục vụ giao diện Swagger UI khi ứng dụng khởi chạy.
- **Kiểm tra cú pháp:** Đã chạy lệnh `node --check src/index.js` và xác minh mã nguồn hoạt động chính xác.

### Tài liệu & Công cụ Kiểm thử
- **Tạo Postman Collection:**
  - Viết tệp cấu hình Postman [PhongThuy_API.postman_collection.json](file:///t:/Phongthuy/docs/PhongThuy_API.postman_collection.json) bao gồm đầy đủ 7 thư mục tương ứng với các phân hệ chính của hệ thống.
  - Cấu hình sẵn dữ liệu mẫu thực tế trong phần request body cho mọi API.
  - Tích hợp **Test Scripts** tự động lưu token JWT và `userId` vào Collection Variables sau khi gọi Đăng nhập/Đăng ký để tự động điền cho các API tiếp theo, đồng thời tự động lưu `recordId` sau khi gieo quẻ/lập lá số để chat AI liền mạch.
- **Cập nhật [API.md](file:///t:/Phongthuy/docs/API.md):** Bổ sung mục `🚀 Hướng dẫn Kiểm thử & Thử nghiệm API (Testing Guides)` hướng dẫn chi tiết cách truy cập Swagger UI cục bộ tại `/api-docs` và cách import, vận hành file Postman Collection.

---

## 📅 Phiên bản: Bổ sung Footer & Phân trang Lịch sử (06/07/2026)

### Frontend (Giao diện & Tính năng)
- **Bổ sung Footer toàn trang:** Thiết kế và thêm chân trang **Footer** ở cuối [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) chứa Logo chữ 'PT' cách điệu, thông tin Email (`trinhtuyen270804@gmail.com`), SĐT Zalo (`0868960506`) cùng liên kết chuyển đổi phân hệ trang trí. Footer hiển thị ở tất cả các tab người dùng, bao gồm cả Lịch sử.
- **Phân trang Lịch sử 15 bản ghi:** Tích hợp logic phân trang client-side tại [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx), giới hạn hiển thị tối đa 15 bản ghi/trang cho cả 4 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân). Thêm bộ điều hướng Pagination Controls trực quan, tự động chuyển màu theo từng chủ đề của Tab, đồng thời tự động cuộn lên đầu trang mượt mà (`window.scrollTo`) khi thay đổi trang.

---

## 📅 Phiên bản: Tự động hóa Backup & Đồng bộ Google Drive qua Cronjob (06/07/2026)

### 1. Phân tích & Kiến trúc Vận hành
- Nghiên cứu hiện trạng dự án, so sánh 3 giải pháp tự động hóa tác vụ backup MongoDB Atlas và đồng bộ Google Drive:
  1. Host-level Cronjob (Độc lập, tối ưu tài nguyên, an toàn cao).
  2. Application-level Scheduler (Tích hợp trong backend Node.js, rủi ro bảo mật leo thang đặc quyền khi phải mount Docker Socket).
  3. Docker Sidecar Container (Ofelia scheduler, đóng gói hạ tầng tốt).
- Thống nhất chọn **Giải pháp 1 (Host-level Cronjob)** để tối ưu bảo mật, tận dụng các shell script sẵn có và đảm bảo tính cô lập tuyệt đối của web server.

### 2. Cập nhật Tài liệu & Hướng dẫn Vận hành
- **Tạo tài liệu hướng dẫn mới:** Viết tệp hướng dẫn setup chi tiết [setup_cronjob_guide.md](file:///C:/Users/cobat/.gemini/antigravity/brain/59c2d2c2-da08-45fc-bd4d-da5722a00d82/setup_cronjob_guide.md) chỉ dẫn cài đặt crontab, kiểm tra múi giờ, phân quyền chạy docker cho user non-root, debug log và tích hợp cảnh báo qua Telegram Webhook.
- **Cập nhật [README.md](file:///t:/Phongthuy/README.md):** Thêm phần `## 💾 4. Hệ thống Sao lưu & Đồng bộ Google Drive Tự động` mô tả chức năng của các script backup và các bước cấu hình cronjob chạy lúc 00:00 hàng ngày.
- **Cập nhật [docs/ARCHITECTURE.md](file:///t:/Phongthuy/docs/ARCHITECTURE.md):** Thêm phần `## 5. Cơ chế Sao lưu & Đồng bộ Google Drive (Backup System)` tích hợp biểu đồ luồng hoạt động bằng Mermaid và phân tích lợi ích thiết kế kiến trúc cô lập tiến trình.

---

## 📅 Phiên bản: Việt hóa Lỗi Đăng Nhập & Cập nhật Default Credits (06/07/2026)

### 1. Hệ thống Đăng nhập (Trải nghiệm Người dùng)
- **Backend:** Cập nhật [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) để trả về `'Tài khoản hoặc mật khẩu không đúng'` thay vì `'Invalid Credentials'` khi sai thông tin đăng nhập.
- **Frontend:** Cập nhật [AuthModal.jsx](file:///t:/Phongthuy/frontend/src/components/AuthModal.jsx) dịch lỗi từ `'Invalid Credentials'` sang tiếng Việt giúp giao diện đồng bộ hơn.

### 2. Quản lý Credit
- **Cập nhật Default Credits khi đăng ký:** Thay đổi số lượng credit khởi tạo mặc định cho người dùng mới từ `1` thành `2` ở cả API đăng ký thường, Google đăng ký và kích hoạt lại tài khoản trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) cũng như Schema mặc định trong [User.js](file:///t:/Phongthuy/backend/src/models/User.js).

---

## 📅 Phiên bản: Ẩn Tính Năng Hỏi Thêm Thầy Khi Người Dùng Đăng Xuất (05/07/2026)

### Frontend (Bảo mật & Tối ưu hóa Token)
- **Ẩn nút chat follow-up và chat widget khi logout:**
  - Cập nhật [BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx): Nút "Hỏi Thêm Thầy" và `AiChatWidget` chỉ hiển thị khi `user` tồn tại trong `AuthContext`.
  - Cập nhật [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx): Đồng bộ `user` từ `AuthContext` thông qua `activeUser` và chỉ render nút "Hỏi Thêm Thầy" cũng như `AiChatWidget` khi đã đăng nhập.
  - Cập nhật [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx): Nút "Hỏi Đáp AI" và `AiChatWidget` chỉ hiển thị khi `user` tồn tại.
  - Cập nhật [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx): Điều chỉnh nút "Hỏi Thêm Thầy" và `AiChatWidget` chỉ hiển thị khi `activeUser` đã đăng nhập (thay vì cho phép bấm rồi mở form đăng nhập), ngăn chặn triệt để hành vi spam API chat sau khi đăng xuất.

---

## 📅 Phiên bản: Docker hóa Frontend & Tái cấu trúc Đa Container (05/07/2026)

### 1. Frontend (Cấu hình Container hóa)
- **Tạo Dockerfile cho Frontend:**
  - Thiết kế quy trình Multi-stage build: Giai đoạn 1 biên dịch React/Vite bằng Node 20; Giai đoạn 2 phục vụ các tệp giao diện tĩnh bằng image nhẹ `nginx:alpine`.
  - Hỗ trợ truyền biến môi trường thông qua ARG (`VITE_API_URL` mặc định là `/api` và `VITE_GOOGLE_CLIENT_ID`).
- **Tạo .dockerignore cho Frontend:** Bỏ qua `node_modules`, `dist` và các tệp cấu hình docker cục bộ để tăng tốc độ build image.
- **Tạo cấu hình `nginx.conf` cho Frontend:** Thiết lập khối server lắng nghe trên cổng `80` và cấu hình `try_files $uri $uri/ /index.html` nhằm giải quyết triệt để lỗi 404 khi người dùng tải lại trang (SPA Router fallback).

### 2. Định tuyến Nginx Gateway
- **Cập nhật `nginx/default.conf` ở gốc:**
  - Phân chia định tuyến: Chuyển tiếp `/api` và `/health` sang container backend (`http://backend:3001`).
  - Chuyển tiếp tất cả các đường dẫn giao diện còn lại `/` sang container frontend (`http://frontend:80`).
  - Giữ nguyên tối ưu hóa SSE cho các luồng xử lý AI.

### 3. Docker Compose (Hợp nhất Đa Container)
- **Cập nhật `docker-compose.yml` ở gốc:**
  - Bổ sung service `frontend` build trực tiếp từ `./frontend`.
  - Cập nhật dependency của service `nginx` thành `depends_on` cả `backend` và `frontend`.

### 4. Cập nhật Tài liệu
- **Cập nhật README.md & DEVELOPMENT_GUIDE.md:** Cập nhật hướng dẫn chạy trọn gói cả 2 phân hệ Frontend và Backend bằng Docker Compose và truy cập qua cổng 80 của Nginx.

---

## 📅 Phiên bản: Docker hóa Backend & Thiết lập Nginx cho AWS VM (04/07/2026)

### 1. Backend (Cấu hình Container hóa)
- **Tạo Dockerfile cho Backend:**
  - Sử dụng base image `node:20-slim` để giảm dung lượng image và tương thích sẵn với binary của thư viện native `bcrypt`.
  - Thực hiện cài đặt dependency bằng `npm ci --omit=dev` để loại bỏ các thư viện phát triển (devDependencies).
  - Khai báo mở cổng `3001` và chạy ứng dụng thông qua `node src/index.js`.
- **Tạo .dockerignore cho Backend:** Loại trừ các file cục bộ không cần thiết như `node_modules`, `logs`, `.env` giúp tối ưu hóa dung lượng build context truyền lên Docker daemon.

### 2. Nginx (Cấu hình Reverse Proxy & SSE Stream)
- **Tạo thư mục `nginx` và cấu hình `default.conf`:**
  - Thiết lập Nginx lắng nghe ở cổng `80` của máy host.
  - Chuyển tiếp các yêu cầu client đến `http://backend:3001` thông qua mạng ảo Docker.
  - Tích hợp cấu hình đặc biệt cho **Server-Sent Events (SSE)**: Tắt bộ đệm (`proxy_buffering off;`), tắt cache (`proxy_cache off;`) và mở rộng thời gian chờ (`proxy_read_timeout 86400s;`) nhằm đảm bảo luồng giải đoán từ Gemini AI không bị chặn đệm hay ngắt kết nối giữa chừng.

### 3. Docker Compose (Điều phối dịch vụ AWS)
- **Tạo `docker-compose.yml` tại thư mục gốc:**
  - Định nghĩa dịch vụ `backend` tự động build từ thư mục `./backend` và nạp các biến môi trường trực tiếp từ tệp `.env` hiện tại để kết nối với cơ sở dữ liệu MongoDB Atlas của dự án.
  - Định nghĩa dịch vụ `nginx` chạy image `nginx:alpine`, ánh xạ cổng `80:80` ra ngoài máy ảo AWS, mount tệp cấu hình `nginx/default.conf` và liên kết phụ thuộc `depends_on` với `backend`.

### 4. Cập nhật Tài liệu
- **Cập nhật README.md:** Bổ sung hướng dẫn ngắn gọn cách khởi động toàn bộ cụm backend và Nginx chỉ bằng một lệnh docker compose.
- **Cập nhật DEVELOPMENT_GUIDE.md:** Bổ sung hướng dẫn chi tiết cách cấu hình cổng Security Group AWS, kiểm tra Logs và chạy thử health-check qua Nginx proxy.

---

## 📅 Phiên bản: Bổ sung Phân Hệ Xem Ngày & Tư Vấn Ngày Hoàng Đạo (03/07/2026)

### 1. Backend (Thuật toán Trạch cát & Router)
- **Xây dựng DateService.js:**
  - Tích hợp công cụ chuyển đổi Dương lịch sang Âm lịch dựa trên `lunar-javascript`.
  - Phân tích tương sinh/khắc can chi tuổi người dùng (**Lục Xung, Lục Hại, Thiên Can khắc, Nạp Âm khắc**).
  - Tích hợp đánh giá hệ thống **Thập Nhị Thần Hoàng Đạo/Hắc Đạo** (12 vị thần) và **Thập Nhị Kiến Trừ** (12 Trực) cho từng nhóm việc (Đại sự, Khởi nghiệp, Xây dựng).
  - Thiết kế thang điểm đánh giá chi tiết chia thành **4 cấp độ**: **Rất tốt**, **Nên**, **Không nên**, **Không được**.
  - Tính toán và đề xuất dải giờ hoàng đạo cát lợi cùng ngày không xung khắc với tuổi.
- **Xây dựng DateController.js:** Expose hai API endpoints: `/api/date/check` (xem một ngày) và `/api/date/consult` (tư vấn ngày tốt trong khoảng thời gian). Các API này chạy hoàn toàn trên bộ nhớ (in-memory) và không ghi dữ liệu vào database.
- **Đăng ký Route:** Liên kết các endpoints mới trong [routes/index.js](file:///t:/Phongthuy/backend/src/routes/index.js).

### 2. Frontend (Giao diện người dùng)
- **Tích hợp API endpoints:** Khai báo hàm `checkAuspiciousDate` và `consultAuspiciousDates` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
- **Xây dựng component DateSelectionBoard.jsx:**
  - Tạo giao diện 2 sub-tabs chuyển đổi: "Xem ngày cụ thể" và "Tư vấn ngày hoàng đạo".
  - Hiển thị kết quả trực quan bằng màu sắc và huy hiệu (Badge) tương ứng với 4 cấp độ đánh giá.
  - Hỗ trợ lưu trữ tự động các lựa chọn năm sinh và công việc vào `localStorage` để đồng bộ giữa hai tab.
  - Cung cấp nút chuyển đổi nhanh (CTA) tự động pre-fill năm sinh và công việc khi chuyển từ Xem ngày sang Tư vấn ngày.
- **Bổ sung tab Xem Ngày:** Tích hợp liên kết điều hướng mượt mà, hỗ trợ Lazy Loading trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx).

### 3. Cập nhật Tài liệu
- Cập nhật đặc tả chi tiết API trong [API.md](file:///t:/Phongthuy/docs/API.md).

---

## 📅 Phiên bản: Tích hợp Nén HTTP Compression toàn cục (02/07/2026)

### Backend (Mã hóa & Truyền tải)
- **Tích hợp nén HTTP Compression:** 
  - Đã thêm dependency `"compression": "^1.7.5"` trong [package.json](file:///t:/Phongthuy/backend/package.json).
  - Cấu hình sử dụng middleware `compression` toàn cục trong [index.js](file:///t:/Phongthuy/backend/src/index.js) để nén tự động dữ liệu các API của Admin Dashboard, Lịch sử người dùng, và Chi tiết lá số/quẻ dịch.
  - Tích hợp **Bộ lọc thông minh (SSE Bypass Filter)** kiểm tra các yêu cầu hoặc phản hồi định dạng `text/event-stream` để loại trừ không nén, tránh lỗi đệm (buffering) dòng stream in chữ thời gian thực của AI Chatbot.

---

## 📅 Phiên bản: Khắc phục Rò rỉ Lịch sử & Tối ưu hóa Tốc độ Đăng nhập (02/07/2026)

### 1. Frontend (Giao diện & Bảo mật)
- **Khắc phục lỗi rò rỉ lịch sử khi đổi tài khoản:** 
  - Bổ sung `useEffect` giám sát thay đổi của ID tài khoản (`user?.id` / `user?._id`) trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) để tự động reset state cache danh sách lịch sử `preloadedHistory` về `null`.
  - Bổ sung `useEffect` dọn dẹp sạch cache chi tiết hào quẻ `prefetchedDetails.current` trong [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx) khi thay đổi `user`.
- **Tối ưu hóa đăng nhập không chặn UI:** Loại bỏ `async/await` chặn tuần tự trong hàm `handleLoginSuccess` tại [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) và chuyển sang thực thi song song/chạy nền bằng `Promise.all`. Giúp đóng Modal đăng nhập và cập nhật trạng thái UI ngay lập tức.

### 2. Backend (Mã hóa & Hiệu năng)
- **Nâng cấp mã hóa mật khẩu bằng Native Bcrypt:** Thay thế gói `"bcryptjs"` (Pure JS chậm chạp) bằng gói `"bcrypt"` native biên dịch sang mã máy C++ trong [package.json](file:///t:/Phongthuy/backend/package.json) và cập nhật mã nguồn ở [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) cùng [test_all_cases.js](file:///t:/Phongthuy/backend/src/scripts/test_all_cases.js). Giúp tăng tốc so khớp mật khẩu và ngăn nghẽn luồng Node.js Event Loop.

---

## 📅 Phiên bản: Tối ưu hóa Trải nghiệm Tải trang Lịch sử (02/07/2026)

### 1. Frontend (Giao diện & Trải nghiệm Người dùng)
- **Loại bỏ màn hình load kép:** Thay thế cơ chế tải động (Lazy Loading) của component `HistoryBoard` thành Import tĩnh (Static Import) trực tiếp trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) và loại bỏ component bọc `<React.Suspense>`. Giúp triệt tiêu màn hình loading thô đầu tiên khi bấm vào tab Lịch sử.
- **Hỗ trợ Keep-Alive chống reload thừa:** Thay đổi cơ chế render của `HistoryBoard` từ dựng lại hoàn toàn (conditional rendering `{appMode === 'history' && ...}`) sang ẩn/hiện bằng CSS classes (`block` / `hidden`). Component sẽ được giữ lại trong bộ nhớ DOM, không bị hủy/tái khởi tạo khi chuyển đổi giữa các tab.
- **Tải dữ liệu tức thì (Zero-flicker loading):** Khởi tạo trạng thái `loading` dựa vào dữ liệu đã preload trước đó. Khi chuyển tab qua lại mà dữ liệu không đổi, trang Lịch sử sẽ hiện ngay lập tức mà không có bất kỳ hiện tượng nhấp nháy hay phải nạp lại dữ liệu từ đầu.
- **Nâng cấp giao diện Loading tinh giản (Chỉ xoay tròn):** Lược bỏ toàn bộ các phần text thô như `"Đang nạp nhật ký lịch sử..."`, `"Vui lòng chờ..."` và `"Đang nạp chi tiết..."`, chỉ hiển thị một biểu tượng spinner xoay (`Loader2` từ `lucide-react`) tinh tế trên nền hiệu ứng xung ánh sáng vàng nhạt (`bg-amber-50 animate-pulse`) đồng bộ với tông màu Kinh Dịch.

### 2. Backend (Tối ưu hóa Truy vấn & Hiệu năng)
- **Tối ưu hóa API danh sách Lịch sử Kinh Dịch:** Cập nhật hàm `getHexagramHistory` trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js):
  - Loại bỏ hoàn toàn vòng lặp CPU-heavy gọi hàm `IChingDataService.parseLines` để tái thiết các hào quẻ, can chi chi tiết cho từng bản ghi trong danh sách (do thông tin này không dùng ở chế độ hiển thị danh sách, mà chỉ tải riêng khi bấm "Xem chi tiết").
  - Thêm loại trừ trường `-ungKy` (danh sách thông báo Ứng Kỳ) và `-movingLines` (danh sách hào động) khỏi kết quả truy vấn MongoDB để giảm kích thước payload truyền qua mạng.

---

## 📅 Phiên bản: Tối ưu hóa Đăng ký, Lịch sử và Modal Đăng ký (02/07/2026)

### 1. Backend (Logic & Hiệu năng)
- **Cho phép đăng ký lại tài khoản bị xóa mềm:** Cập nhật hàm `register` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js). Nếu phát hiện email đăng ký thuộc về một tài khoản đã bị xóa mềm (`isDeleted === true`), hệ thống sẽ thực hiện kích hoạt lại (reactivate) tài khoản đó bằng mật khẩu băm mới, thông tin mới, đặt lại credits = 1, lockReason = '' và reset lại `stats` của tài khoản này.
- **Tối ưu hóa hiệu năng list Lịch sử Tử Vi:** Cập nhật hàm `getZiweiHistory` trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js). Thay đổi `.select('-chartData.palaces -analysisSnapshot')` thành `.select('-chartData -analysisSnapshot -aiInterpretation')` để loại bỏ các trường dữ liệu đồ hình mệnh bàn thô nặng và văn bản giải luận AI dài khỏi danh sách lịch sử (chỉ tải khi vào trang chi tiết).

### 2. Frontend (Giao diện)
- **Tối ưu hóa Modal Đăng ký chống tràn layout:** Cập nhật [AuthModal.jsx](file:///t:/Phongthuy/frontend/src/components/AuthModal.jsx). Thêm CSS giới hạn chiều cao `max-h-[90vh]` và cho phép cuộn dọc nội bộ `overflow-y-auto` cho khung modal chính. Giúp người dùng cuộn mượt mà để nhập Mật khẩu / bấm Submit khi form Bát Tự được mở rộng trên các thiết bị di động hoặc màn hình nhỏ.

---

## 📅 Phiên bản: Bổ sung tính năng Đổi Mật Khẩu (02/07/2026)

### 1. Backend (Xây dựng API đổi mật khẩu bảo mật)
- Bổ sung phương thức `changePassword` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js):
  - Nhận `currentPassword` và `newPassword` từ request body.
  - Sử dụng `bcrypt.compare` đối chiếu mật khẩu hiện tại với mật khẩu băm trong database.
  - Kiểm tra độ dài mật khẩu mới (tối thiểu 8 ký tự theo yêu cầu).
  - Băm mật khẩu mới và lưu vào cơ sở dữ liệu.
- Đăng ký Endpoint `PUT /api/auth/change-password` đi kèm với middleware `auth` xác thực trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js).

### 2. Frontend (Giao diện đổi mật khẩu)
- Khai báo API service `changePassword` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
- Thiết kế form độc lập **Thay Đổi Mật Khẩu** tích hợp trực tiếp vào [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx).
- Ràng buộc kiểm tra (Validation) mật khẩu mới tối thiểu 8 ký tự, so khớp hai lần nhập và ngăn không cho trùng mật khẩu hiện tại.
- Xử lý trạng thái loading và hiển thị thông báo phản hồi (thành công/lỗi) trực quan.

### 3. Cập nhật Tài liệu
- Cập nhật đặc tả chi tiết API trong [API.md](file:///t:/Phongthuy/docs/API.md) và [README.md](file:///t:/Phongthuy/README.md).

---

## 📅 Phiên bản: Đồng bộ hóa & Hoàn thiện Tài liệu Hệ thống (02/07/2026)

### 1. Cập nhật thiết kế Cơ sở Dữ liệu (`DATABASE.md`)
- Bổ sung cấu trúc Schema và chỉ mục (Indexes) chi tiết cho các bảng hỗ trợ Quản trị & Hệ thống bao gồm: `systemlogs` (`SystemLog.js`), `adminnotifications` (`AdminNotification.js`), `notifications` (`Notification.js`), và `banappeals` (`BanAppeal.js`) để đảm bảo tài liệu phản ánh chính xác 100% thuộc tính trường trong code.

### 2. Bổ sung đặc tả các Endpoint còn thiếu (`API.md`)
- Đặc tả API Tra cứu khái niệm học thuật: `GET /api/concept/:term` (sử dụng trong hiển thị Tooltip).
- Đặc tả API Thông báo cho người dùng cuối:
  - `GET /api/notifications`: Lấy danh sách thông báo nhắc nhở Ứng Kỳ.
  - `PUT /api/notifications/read-all`: Đánh dấu đọc tất cả thông báo.
  - `PUT /api/notifications/:id/read`: Đánh dấu đọc một thông báo cụ thể.

### 3. Đồng bộ sơ đồ và mô tả Kiến trúc (`ARCHITECTURE.md`)
- Cập nhật sơ đồ Mermaid của phân hệ Frontend: Bổ sung các component con (`CoinToss`, `MaiHoaInput`, `ManualInput`, `BaziInput`, `MarriageInput`, `ZiweiChart`, `Tooltip`, `SectionRenderer`) và các Modal/Bell (`NotificationBell`, `AuthModal`, `UpdateBaziModal`, `ProfileBoard`).
- Cập nhật sơ đồ Mermaid của phân hệ Backend: Bổ sung `ConceptController`, `NotificationController` và các Service/Cache/Validator hỗ trợ (`ConversationContextService`, `EmailService`, `IChingDataService`, `LoggerService`, `MemoryCacheService`, `UserStatsService`, `ZiweiCache`, `ZiweiValidators`).

### 4. Thiết lập Quy sách Cập nhật Tài liệu & Sửa đổi Tổng quan (`AGENTS.md` & `README.md`)
- Cập nhật [AGENTS.md](file:///t:/Phongthuy/AGENTS.md): Bổ sung quy định bắt buộc phải cập nhật [README.md](file:///t:/Phongthuy/README.md) khi có thay đổi liên quan đến cấu trúc cài đặt, khởi chạy hoặc tính năng tổng quan, đồng thời thiết lập tiêu chuẩn hoàn thành tác vụ (Definition of Done).
- Cập nhật [README.md](file:///t:/Phongthuy/README.md) khớp với code thực tế:
  - Gỡ bỏ hoàn toàn các mô tả về dịch vụ legacy `JobQueueService.js` và endpoint `GET /api/ziwei/jobs/:jobId` đã bị xóa.
  - Sửa đổi mô tả giải luận AI Tử Vi chuyển từ Polling sang luồng SSE Stream trực tiếp.
  - Khắc phục biến môi trường sai từ `MONGO_URI` thành `MONGODB_URI` trong tệp cấu hình mẫu.
  - Bổ sung đặc tả các API mới cho Concept và Notifications.

---

## 📅 Phiên bản: Tái Cấu Trúc Toàn Diện & Chuẩn Hóa Tiếng Anh

### 1. Chuẩn hóa thuật ngữ & Rename mã nguồn
Đồng nhất 100% tên tệp, tên biến, router và cơ sở dữ liệu sang tiếng Anh chuẩn để dễ tích hợp quốc tế.
- **Kinh Dịch:** Chuyển đổi tên gọi trong toàn bộ mã nguồn từ `Divination`, `Hexagram`, `Kinhdich` sang **`IChing`**.
  - Rename model và collection MongoDB: `HexagramRecord` -> [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js) (`ichingrecords`).
  - Rename component Frontend: `DivinationBoard.jsx` -> [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx).
- **Tử Vi:** Chuyển đổi toàn bộ tên gọi từ `TuVi` sang **`Ziwei`**.
  - Rename model và collection MongoDB: `TuViRecord` -> [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js) (`ziweirecords`).
  - Rename component Frontend: `TuViBoard.jsx` -> [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx), `TuViChart.jsx` -> [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiChart.jsx).
- **Lưu ý:** Bảo toàn nguyên văn thuật ngữ `ungKy` (Ứng Kỳ) và `MaiHoa` (Mai Hoa Dịch Số) theo phản hồi người dùng.

### 2. Hợp nhất Lược đồ Chat (Generic Chat System)
- Xóa bỏ hoàn toàn 6 collection chat riêng biệt cũ (`HexagramConversation`, `HexagramMessage`, `BaziConversation`, `BaziMessage`, `TuViConversation`, `TuViMessage`).
- Thiết kế mới 2 bảng dùng chung cho cả 4 phân hệ:
  - [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js): Phân tách ngữ cảnh qua trường `system` (`'iching' | 'bazi' | 'ziwei' | 'marriage'`).
  - [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js): Chứa nội dung text và trường `structuredContent` lưu kết quả phân tích cấu trúc từ AI.

### 3. Tái thiết kế Controllers & Services Core
- **Gộp Controller giải đoán AI:** Viết mới [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) tích hợp cơ chế stream SSE và trò chuyện hỏi đáp sâu cho cả 3 môn học thuật (Kinh Dịch, Bát Tự, Tử Vi) và xem tuổi Kết Hôn.
- **Gộp Controller Lịch sử:** Viết mới [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) hợp nhất logic lấy danh sách lịch sử, xếp hạng đánh giá và liên kết tài khoản cho tất cả các phân hệ.
- **Tách biệt Prompts chuyên môn:** Tách tệp `PromptTemplateManager.js` cũ thành các tệp prompt tiếng Anh tối ưu hóa riêng biệt cho AI: `IChingPrompts.js`, `BaziPrompts.js`, `ZiweiPrompts.js` và `MarriagePrompts.js`.

---

## 📅 Phiên bản: Bổ sung Phân Hệ Hợp Hôn & Trang Quản Trị Admin

### 1. Phân hệ Xem tuổi Hợp Hôn (Marriage Compatibility)
- **Backend:** Xây dựng [MarriageController.js](file:///t:/Phongthuy/backend/src/controllers/MarriageController.js) và [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js) thực hiện tính toán độ tương sinh của ngũ hành bản mệnh, so khớp cung phi bát trạch và tích hợp prompt giải đoán AI.
- **Frontend:** Thiết kế giao diện nhập ngày giờ sinh kép [MarriageInput.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageInput.jsx) và bảng hiển thị phân tích độ hợp hợp [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx).

### 2. Giao diện Quản trị & Hệ thống Giám sát (Admin Dashboard)
- **Backend:**
  - Viết mới [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js) phục vụ các endpoints quản trị: lấy danh sách user, khóa tài khoản, cộng trừ credit, quản lý khiếu nại.
  - Tích hợp route `/events` trong [admin.js](file:///t:/Phongthuy/backend/src/routes/admin.js) để phát các sự kiện hệ thống thời gian thực tới Admin Dashboard qua SSE.
- **Frontend:**
  - Viết mới [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx) chứa đầy đủ biểu đồ Recharts, bộ lọc tìm kiếm bản ghi, giao diện nạp credit và xử lý khiếu nại của người dùng.
