# 🛠️ DEVELOPMENT_GUIDE.md - Hướng dẫn Phát triển & Khởi chạy Địa phương

Tài liệu này hướng dẫn chi tiết các bước thiết lập môi trường phát triển, cài đặt phụ thuộc, cấu hình biến môi trường và chạy thử nghiệm dự án.

---

## 📋 1. Yêu cầu Hệ thống (Prerequisites)
- **Node.js:** Phiên bản khuyến nghị là **Node.js v18.x** hoặc **v20.x**.
- **MongoDB:** MongoDB Server đang chạy trên cổng mặc định `27017` (bản local hoặc Mongo Atlas).
- **Google Gemini API Key:** Cần chuẩn bị mã khóa API từ Google AI Studio để chạy tính năng giải đoán.

---

## ⚙️ 2. Thiết lập Biến môi trường (.env)

### 2.1 Cấu hình Backend
Tạo tệp `.env` tại thư mục `/backend` với các biến môi trường sau:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/phongthuy
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-3.1-flash-lite
```

### 2.2 Cấu hình Frontend
Tạo tệp `.env` tại thư mục `/frontend` với biến môi trường sau:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🚀 3. Khởi chạy Ứng dụng tại Địa phương

### Bước 1: Khởi động MongoDB
Đảm bảo dịch vụ MongoDB đã được bật.
- *Trên Windows (PowerShell):* `Start-Service MongoDB` (nếu cài đặt dưới dạng service) hoặc chạy trực tiếp file `mongod.exe`.

### Bước 2: Chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Server sẽ chạy tại địa chỉ http://localhost:3001 và màn hình console sẽ hiển thị nhật ký khởi chạy cùng với hàng đợi sự kiện và hệ thống tự động ping.*

### Bước 3: Chạy Frontend
1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy môi trường phát triển Vite:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện người dùng tại địa chỉ mặc định hiển thị trên terminal (thường là http://localhost:5173).

---

## 👨‍💻 4. Thiết lập Quyền Admin để Thử nghiệm
Để có quyền truy cập vào Trang Quản trị (Admin App):
1. Đăng ký một tài khoản người dùng bình thường thông qua giao diện Đăng ký của ứng dụng.
2. Mở Robo 3T, Compass hoặc Mongo Shell và kết nối tới database `phongthuy`.
3. Tìm tài liệu người dùng của bạn trong collection `users` và cập nhật trường `role` từ `'user'` thành `'admin'`:
   ```javascript
   db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
   ```
4. Đăng xuất và đăng nhập lại trên giao diện. Hệ thống sẽ nhận diện vai trò Admin mới và tự động chuyển giao diện sang phân hệ **AdminApp**.

---

## 🧪 5. Kiểm tra mã nguồn trước khi Commit (Verification & Quality Gates)

Để đảm bảo chất lượng hệ thống và tuân thủ tuyệt đối quy định trong `AGENTS.md`:

1. **Kiểm tra cú pháp Backend:**
   Trước khi commit, kiểm tra cú pháp node cho các tệp đã sửa:
   ```bash
   node --check src/modules/bazi/controllers/BaziController.js
   ```

2. **Chạy Unit Test Suite Backend (Jest - 35 Test Suites, 257/257 Tests PASSED):**
   ```bash
   cd backend
   npm test
   ```
   *Chạy kiểm thử hồi quy 260+ cấu hình Bát Tự đại diện:*
   ```bash
   npm run test:regression
   ```

3. **Chạy Unit Test Suite Frontend (Vitest - 4 Test Files, 29/29 Tests PASSED):**
   ```bash
   cd frontend
   npm test
   ```

4. **Kiểm tra Đóng gói Production Build:**
   Đảm bảo toàn bộ import, CSS và cú pháp JSX biên dịch sạch sẽ không có lỗi:
   ```bash
   cd frontend
   npm run build
   ```

5. **Quy tắc Kiểm thử Giao diện trên Trình duyệt (Chrome DevTools Verification):**
   Theo quy định bắt buộc trong `AGENTS.md`, mọi thay đổi liên quan đến giao diện người dùng (UI/Frontend) phải được khởi chạy và tương tác trực tiếp trên trình duyệt bằng `chrome-devtools-mcp` (click button, điền form, mở popup/modal, chuyển tab, kiểm tra console log) để đảm bảo **100% không có lỗi console (0 console errors)** trước khi hoàn thành nhiệm vụ.

---

## 🐳 6. Khởi chạy bằng Docker & Triển khai CI/CD trên AWS EC2

Hệ thống cung cấp sẵn cấu hình Docker và Nginx Reverse Proxy để chạy môi trường đóng gói hoặc triển khai lên máy ảo AWS (EC2/Lighthouse).

### 6.1 Yêu cầu trước khi chạy
- Máy ảo AWS đã cài đặt **Docker** và **Docker Compose**.
- Đã cấu hình Security Group trên AWS để mở cổng **80** (HTTP).
- Đã chuẩn bị file `.env` tại thư mục `/backend` (chứa các cấu hình kết nối MongoDB Atlas, Gemini API Key...).

### 6.2 Khởi chạy với Docker Compose
Từ thư mục gốc của dự án, chạy lệnh sau:
```bash
docker compose up -d --build
```
Lệnh này sẽ thực hiện:
1. Build image của `frontend` dựa trên tệp `frontend/Dockerfile` (sử dụng `node:20-slim` để biên dịch React/Vite và `nginx:alpine` để serve file giao diện tĩnh, đồng thời cấu hình Nginx riêng cho SPA hỗ trợ React Router).
2. Build image của `backend` dựa trên tệp `backend/Dockerfile` (sử dụng `node:20-slim`).
3. Khởi chạy container `phongthuy-frontend` và `phongthuy-backend` chạy ẩn trong mạng nội bộ.
4. Khởi chạy container `phongthuy-nginx` lắng nghe cổng `80` trên máy host AWS, phân phối: các yêu cầu `/api` và `/health` sang backend, các yêu cầu còn lại sang frontend.

### 6.3 Kiểm tra trạng thái và Logs
- Kiểm tra danh sách container đang chạy:
  ```bash
  docker compose ps
  ```
- Xem log thời gian thực của toàn bộ hệ thống hoặc từng service:
  ```bash
  docker compose logs -f
  # hoặc xem riêng frontend
  docker compose logs -f frontend
  ```
- Kiểm tra kết nối qua cổng 80:
  - Kiểm tra health-check của backend:
    ```bash
    curl http://localhost/health
    ```
    Nếu nhận về `ok` tức là backend đã kết nối thành công qua Nginx.
  - Kiểm tra giao diện frontend: Truy cập địa chỉ IP public của máy ảo AWS hoặc `http://localhost/` trên trình duyệt. Thử bấm F5 làm mới trang tại các trang con để kiểm chứng cơ chế SPA routing hoạt động tốt.

### 6.4 Triển khai Tự động bằng CI/CD Chuẩn DevOps (GitHub Actions)

Dự án đã được thiết lập luồng CI/CD chuẩn công nghiệp, tối ưu hóa tốc độ và đảm bảo **Zero-Downtime**:
- **Backend CI (`.github/workflows/backend-ci.yml`)**: Tự động kích hoạt khi có `pull_request` vào nhánh `main` (có bộ lọc đường dẫn `backend/**`). Chạy kiểm tra cú pháp và toàn bộ bài test Jest để bảo vệ chất lượng trước khi merge.
- **Frontend CI (`.github/workflows/frontend-ci.yml`)**: Tự động kích hoạt khi có `pull_request` vào nhánh `main` (có bộ lọc đường dẫn `frontend/**`). Chạy unit tests (Vitest) và kiểm tra đóng gói bundle `npm run build`.
- **Deployment Pipeline (`.github/workflows/deploy.yml`)**: Khi có commit push/merge vào nhánh `main` (tự động bỏ qua các commit chỉ sửa docs/markdown để tiết kiệm tài nguyên), hệ thống kích hoạt luồng 3 giai đoạn:
  1. **Parallel Quality Gate:** Chạy song song độc lập cả Backend Jest Tests và Frontend Vitest + Build Check trên 2 runner riêng biệt để tăng tốc gấp đôi thời gian kiểm thử.
  2. **Immutable Docker Packaging:** Đóng gói image với 2 tags: Tag commit bất biến `${{ github.sha }}` (hỗ trợ rollback tức thì) và Tag `:latest`, tích hợp GitHub Actions Cache (`type=gha,mode=max`).
  3. **Zero-Downtime Rolling Deploy & Smoke Test trên EC2:**
     - SSH vào máy chủ EC2 kéo image mới về.
     - Thực hiện rolling update mượt mà `docker compose up -d --no-deps backend frontend` (không dùng `docker rm -f`, triệt tiêu hoàn toàn lỗi 502 Bad Gateway).
     - Bảo toàn 100% dữ liệu Redis (không xóa `FLUSHALL`), giữ nguyên phiên đăng nhập, OTP và hàng đợi email.
     - Tải lại Nginx nhẹ nhàng (Graceful reload `nginx -s reload`).
     - Tự động chạy **Smoke Test Health Check** (vòng lặp 12 lần kiểm tra endpoint `/health`). Nếu backend phản hồi 200 OK mới xác nhận thành công; nếu lỗi sau 60s sẽ tự in log lỗi và đánh dấu fail để cảnh báo lập tức.

**Để kích hoạt luồng tự động này, bạn cần điền 5 thông tin bí mật (Secrets) sau trên kho lưu trữ GitHub (Settings > Secrets and variables > Actions):**
- `DOCKERHUB_USERNAME`: Tên đăng nhập Docker Hub (Ví dụ: `tuynover`).
- `DOCKERHUB_TOKEN`: Mã Access Token lấy từ trang Security của Docker Hub.
- `EC2_HOST`: IP Public của máy ảo EC2.
- `EC2_USERNAME`: Tên tài khoản SSH (ví dụ: `ubuntu`).
- `EC2_PRIVATE_KEY`: Toàn bộ nội dung của file `.pem` (bao gồm cả dòng `-----BEGIN...` và `-----END...`).
