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

# (Tùy chọn) Bật tự động ping để giữ server luôn hoạt động (ví dụ trên Render)
# SERVER_URL=https://phongthuy-backend.onrender.com
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

## 🧪 5. Kiểm tra mã nguồn trước khi Commit (Verification)
- **Kiểm tra cú pháp Backend:** Trước khi thực hiện commit mã nguồn backend mới, bạn nên chạy lệnh kiểm tra lỗi biên dịch node:
  ```bash
  node --check src/controllers/IChingController.js
  ```
- **Kiểm tra Build Frontend:** Đảm bảo toàn bộ import và TypeScript/JSX biên dịch chính xác bằng cách chạy build thử:
  ```bash
  npm run build
  ```
