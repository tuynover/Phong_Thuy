# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.

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
