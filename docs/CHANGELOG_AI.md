# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.

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
