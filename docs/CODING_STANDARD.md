# ✍️ CODING_STANDARD.md - Quy chuẩn Đặt tên & Coding Standards

Mọi nhà phát triển (hoặc AI Agent) khi chỉnh sửa mã nguồn của dự án cần tuân thủ nghiêm ngặt các quy ước dưới đây để duy trì sự mạch lạc và sạch sẽ của codebase.

---

## 📁 1. Quy ước Đặt tên (Naming Conventions)

### 1.1 Tệp tin & Thư mục
- **Backend Controller:** Sử dụng **PascalCase** và có hậu tố `Controller.js`.
  - *Ví dụ:* `AuthController.js`, `IChingController.js`.
- **Backend Service:** Sử dụng **PascalCase** và có hậu tố `Service.js` hoặc `Analyzer.js`/`Formatter.js`/`Prompts.js`.
  - *Ví dụ:* `RuleEngineService.js`, `BaziAnalyzer.js`, `IChingPrompts.js`.
- **Backend Model:** Sử dụng **PascalCase** số ít.
  - *Ví dụ:* `User.js`, `IChingRecord.js`.
- **Backend Route:** Sử dụng **lowercase** toàn bộ, đặt tên theo phân hệ dạng số ít hoặc số nhiều tùy ngữ cảnh đồng bộ.
  - *Ví dụ:* `ziwei.js`, `history.js`, `auth.js`.
- **Frontend Component:** Sử dụng **PascalCase** và có đuôi mở rộng `.jsx`.
  - *Ví dụ:* `IChingBoard.jsx`, `BaziInput.jsx`, `AiChatWidget.jsx`.

### 1.2 Biến, Hàm & Thuộc tính cơ sở dữ liệu
- Sử dụng **camelCase** cho toàn bộ biến cục bộ, tham số hàm, tên hàm, trường thuộc tính của database model và endpoints API.
  - *Ví dụ:* `primaryHexagram`, `determineCachCuc`, `isDeleted`, `calculateMenhQuai`.
- Sử dụng **UPPER_CASE** cho các biến hằng số cấu hình hệ thống.
  - *Ví dụ:* `ACTIVE_MODEL`, `COOLDOWN_TIME_SECONDS`, `JIE_QI_VI`.

---

## 🛠️ 2. Các Design Patterns áp dụng trong dự án

### 2.1 Singleton & Static Class Service
Hầu hết các dịch vụ xử lý logic trong `/backend/src/services` đều được thiết kế dưới dạng lớp tĩnh (Static Class) hoặc Singleton để tránh việc khởi tạo thừa thãi và lưu trữ trạng thái tập trung.
- *Ví dụ:* `RuleEngineService.js` chứa các hàm tĩnh thực hiện phân tích quẻ nhanh chóng.
- *Ví dụ:* `MemoryCacheService.js` đóng vai trò là một cache lưu trữ bộ nhớ duy nhất cho ứng dụng.


### 2.3 Publisher-Subscriber (SSE Event Streaming)
Dịch vụ `SseService.js` quản lý danh sách các kết nối client mở (Admin & User). Khi có thay đổi trạng thái tài khoản hoặc có khiếu nại mới, SSE sẽ phát (publish) sự kiện tới toàn bộ các client đang lắng nghe (subscribe) thời gian thực.

### 2.4 Cache Pattern & Idempotency
- **Memory Caching:** Lưu trữ tạm thời các giá trị tính toán trùng lặp.
- **Idempotency Key:** Sử dụng `idempotencyKey` trong các bảng Record (`BaziRecord`, `ZiweiRecord`, `MarriageRecord`) và so khớp đầu vào trùng để tránh việc tính toán trùng lặp khi người dùng click liên tục (Semantic Idempotency).

---

## ✍️ 3. Quy chuẩn viết code & Ràng buộc cú pháp

- **ESLint Rule:** Dự án cấu hình ESLint nghiêm ngặt. Đặc biệt quy tắc kiểm tra biến chưa sử dụng:
  ```javascript
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
  ```
  Cho phép bỏ qua các biến bắt đầu bằng chữ in hoa hoặc dấu gạch dưới (thường là hằng số hoặc module import cấu hình).
- **Asynchronous Code:** Ưu tiên sử dụng cú pháp `async/await` kết hợp với khối `try/catch` để xử lý các tác vụ bất đồng bộ (truy vấn DB, gọi API AI).
- **Ghi log an toàn:** TUYỆT ĐỐI không ghi đè các tham số nhạy cảm như `password` vào logger. Hàm logging trung gian trong `logging.js` phải có cơ chế lọc bỏ trường này trước khi in ra hoặc lưu file log.
