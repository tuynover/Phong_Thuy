# 📝 TODO.md - Các Nhiệm vụ & Lộ trình Phát triển (Roadmap & Technical Tasks)

Tài liệu này theo dõi tình trạng các nợ kỹ thuật (technical debts) đã giải quyết và các hạng mục kiến trúc đề xuất nâng cấp trong tương lai của dự án **Phong Thủy & Gieo Quẻ**.

---

## ✅ 1. Các Hạng mục Đã Hoàn Thành (Completed Technical Milestones)

Dưới đây là các vấn đề kỹ thuật trước đây đã được thiết kế, kiểm thử và giải quyết triệt để trong mã nguồn hiện tại:

| Hạng mục | Mô tả giải pháp | Vị trí triển khai trong Codebase |
| :--- | :--- | :--- |
| **Xác thực phiên tải trang (`/api/auth/me`)** | Xây dựng endpoint `GET /api/auth/me` và tích hợp vào `AuthContext.jsx` (`refreshUser`) khi ứng dụng khởi chạy (F5/Refresh). Tự động vô hiệu hóa phiên nếu tài khoản bị khóa hoặc token bị thu hồi (`tokenVersion`). | `backend/src/modules/auth/routes/auth.routes.js`<br>`frontend/src/context/AuthContext.jsx` |
| **Chống rò rỉ bộ nhớ Cache (LRU Eviction)** | Thay thế bộ nhớ `Map` tĩnh không giới hạn bằng `MemoryCacheService.js` hỗ trợ dung lượng trần (max size), cơ chế tự động giải phóng (LRU) và thời gian sống (TTL) cho cache người dùng và cache dữ liệu tạm. | `backend/src/core/services/MemoryCacheService.js`<br>`backend/src/core/middleware/logging.js` |
| **Khôi phục Mật khẩu qua Email OTP** | Thiết lập luồng gửi mã OTP 6 chữ số ngẫu nhiên qua email (`EmailService.js`), lưu trữ và tự hủy sau 15 phút trên Redis. Frontend có form 2 bước mượt mà kèm rollback khi lỗi và auto-redirect khi thành công. | `backend/src/modules/auth/controllers/AuthController.js`<br>`backend/src/modules/auth/services/EmailService.js`<br>`frontend/src/components/modals/AuthModal.jsx` |
| **Bộ Kiểm thử Tự động Toàn diện** | Mở rộng hệ thống kiểm thử tự động với 35 test suites / 257 tests (Backend - Jest) bao phủ an sao, Bát tự ngũ hành, Kinh dịch, bảo mật và 29 tests (Frontend - Vitest) bao phủ components, context và hooks. | `backend/tests/`<br>`frontend/src/tests/` |
| **Quản lý Dung lượng Tệp Log (Rotation)** | Tích hợp `winston-daily-rotate-file` vào `LoggerService.js` với cấu hình xoay vòng hàng ngày (`YYYY-MM-DD`), giới hạn kích thước tệp tối đa 20MB (`maxSize: '20m'`) và lưu trữ tối đa 14 ngày (`maxFiles: '14d'`). | `backend/src/core/services/LoggerService.js` |
| **Phân rã Frontend Modular & 100% CustomDatePicker** | Loại bỏ 100% thẻ `<input type="date">` mặc định, chuẩn hóa toàn diện `CustomDatePicker` trên toàn hệ thống. Tách nhỏ các file giao diện cồng kềnh thành các component chuyên trách. | `frontend/src/features/*`<br>`frontend/src/components/common/CustomDatePicker.jsx` |

---

## 🚀 2. Lộ trình & Đề xuất Tính năng Tương lai (Future Roadmap)

### 2.1 Kiến trúc & Hạ tầng (Infrastructure & Scalability)
- [ ] **Redis Sentinel / Redis Cluster:** Chuẩn bị cấu hình Redis đa node (Master-Replica Failover) khi triển khai trên cụm máy chủ phân tán có tải lớn vượt ngưỡng 5,000 CCU.
- [ ] **Database Read/Write Splitting:** Cấu hình MongoDB Replica Set với Secondary Read Preferences cho các tác vụ xuất dữ liệu lịch sử hoặc thống kê quản trị của Admin nhằm giảm tải cho Primary node.
- [ ] **CI/CD Pipeline với GitHub Actions:** Tự động chạy toàn bộ bộ test `npm test` ở cả Frontend và Backend, kết hợp kiểm tra linting và build Vite trước khi merge vào nhánh `main`.

### 2.2 Trải nghiệm Người dùng & Giao diện (UI/UX Enhancements)
- [ ] **Progressive Web App (PWA) & Offline Reading:** Tích hợp Service Worker để người dùng có thể mở và đọc lại các lá số Bát Tự / Tử Vi / Kinh Dịch đã lưu ngay cả khi không có kết nối Internet.
- [ ] **Hỗ trợ WebSocket / Web Push Notifications:** Bổ sung kênh thông báo Web Push trực tiếp trên trình duyệt khi tới ngày Ứng Kỳ Kinh Dịch mà người dùng không cần mở tab ứng dụng.
- [ ] **Nhận diện Giọng nói khi Đặt câu hỏi (Speech-to-Text):** Tích hợp Web Speech API cho phép người dùng đọc câu hỏi gieo quẻ Kinh Dịch hoặc thắc mắc trò chuyện thay vì phải nhập liệu thủ công bằng bàn phím.

### 2.3 Nâng cao Học thuật & Trí tuệ Nhân tạo (Domain & AI)
- [ ] **Mở rộng Phái Tử Vi:** Bổ sung tùy chọn giải đoán theo trường phái Nam Phái (chú trọng hệ thống phụ tinh, tràng sinh) song song với trường phái Bắc Phái (Tứ Hóa phi tinh) hiện có.
- [ ] **AI Context Compression thông minh:** Nâng cấp thuật toán tóm tắt hội thoại nhiều lượt (`summarizedMemory`) để lưu giữ chính xác hơn các dữ kiện cát hung qua nhiều phiên trò chuyện chuyên sâu.
