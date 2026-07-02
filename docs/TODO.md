# 📝 TODO.md - Các Nhiệm vụ & Cải tiến Tương lai (Technical Debt)

Dưới đây là tổng hợp các vấn đề kỹ thuật cần giải quyết và các tính năng đề xuất nâng cấp dựa trên kết quả phân tích mã nguồn hiện tại của dự án.

---

## 🛠️ 1. Nợ kỹ thuật (Technical Debt)

### 1.1 Xác thực token tải trang ở Frontend
- **Hiện trạng (`AuthContext.jsx`):** Khi tải lại trang (F5/Refresh), ứng dụng khôi phục trạng thái đăng nhập bằng cách lấy trực tiếp chuỗi JSON người dùng lưu trong `localStorage` mà không thực hiện gọi API xác thực lại token.
  ```javascript
  // In a real app, you'd fetch /api/auth/me here to validate token on load.
  ```
- **Giải pháp:** Xây dựng thêm endpoint `GET /api/auth/me` để lấy thông tin cá nhân hiện tại từ DB mỗi khi khởi chạy ứng dụng, đảm bảo tài khoản bị khóa/xóa sẽ bị từ chối ngay lập tức mà không cần đợi sự kiện SSE tiếp theo.

### 1.2 Rò rỉ bộ nhớ ở Cache Logger Middleware
- **Hiện trạng (`logging.js`):** Hệ thống audit log sử dụng một đối tượng `Map` vật lý để cache email/name của người dùng nhằm giảm tải truy vấn DB:
  ```javascript
  const userCache = new Map();
  ```
  Bộ nhớ cache này tăng dần theo thời gian mà không có cơ chế dọn dẹp (TTL) hay kích thước tối đa (LRU), có khả năng gây rò rỉ bộ nhớ (Memory Leak) khi ứng dụng chạy lâu dài.
- **Giải pháp:** Sử dụng thư viện cache chuyên dụng hỗ trợ TTL (như `lru-cache`) hoặc cấu hình thời gian hết hạn hợp lý.



---

## 🌟 2. Các Tính năng Đề xuất & Phần chưa hoàn thiện

### 2.1 Chưa cấu hình cơ chế khôi phục mật khẩu bằng Email
- **Hiện trạng:** Hệ thống có tích hợp `EmailService.js` nhưng chỉ phục vụ gửi cảnh báo Ứng Kỳ. Người dùng chưa có giao diện hoặc API để tự khôi phục mật khẩu khi quên.
- **Yêu cầu:** Thiết lập luồng đăng ký Token OTP qua email và biểu mẫu thay đổi mật khẩu ở Frontend.

### 2.2 Thiếu bộ kiểm thử tự động (Unit / Integration Tests)
- **Hiện trạng:** Tệp `package.json` của cả backend và frontend đều chưa cấu hình kiểm thử:
  ```json
  "test": "echo \"Error: no test specified\" && exit 1"
  ```
- **Yêu cầu:** Viết bổ sung các ca kiểm thử (Unit test) cho phần logic an sao Tử Vi (`ZiweiFormatter.js`), Rule Engine Kinh Dịch (`RuleEngineService.js`) và Bát Tự (`BaziAnalyzer.js`) để đảm bảo không xảy ra sai số khi cập nhật mã nguồn.

### 2.3 Quản lý dung lượng tệp log vật lý
- **Hiện trạng:** `LoggerService.js` ghi trực tiếp ra tệp tin `logs/app.log` và `logs/errors.log` mà không có cơ chế quay vòng (Log rotation). Tệp log có thể phình to hàng Gigabyte gây tràn đĩa cứng máy chủ.
- **Yêu cầu:** Tích hợp cơ chế log rotation (ví dụ sử dụng thư viện `winston-daily-rotate-file` hoặc cấu hình `logrotate` ở cấp độ hệ điều hành).
