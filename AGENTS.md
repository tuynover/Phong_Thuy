# 🤖 AGENTS.md - Phong Thủy Project Guidelines

Chào mừng các AI Agent tham gia phát triển dự án **Phong Thủy & Gieo Quẻ**. Tài liệu này định nghĩa các quy tắc cốt lõi, hành vi bắt buộc và hướng dẫn kỹ thuật đặc thù mà mọi Agent cần phải tuân thủ nghiêm ngặt để đảm bảo sự nhất quán hệ thống.

---

## 📌 1. Bối cảnh & Vai trò của AI Agent
Hệ thống là sự kết hợp giữa **Quy tắc học thuật Cổ học Phương Đông** (Kinh Dịch, Bát Tự, Tử Vi) và **Mô hình Ngôn ngữ Lớn (LLM)**.
AI Agent có vai trò:
1. Tiếp nhận và bảo trì mã nguồn logic tính toán âm dương, lịch pháp.
2. Thiết kế và phát triển Prompt chuyên môn tiếng Anh có cấu trúc nghiêm ngặt.
3. Đảm bảo bảo mật, quản trị quota (Credits) và phân quyền chặt chẽ.

---

## 🏛️ 2. Quy tắc Kiến trúc Hệ thống

### 2.1 Backend (Express.js v5)
- **Kiến trúc:** MVC truyền thống chia thành `controllers`, `services`, `models`, `routes`, `middleware`.
- **Database Keys:** Toàn bộ `_id` của các bảng dữ liệu (`User`, `IChingRecord`, `BaziRecord`, `ZiweiRecord`, `MarriageRecord`, `Conversation`, `Message`) đều sử dụng chuỗi định dạng **UUIDv7** làm khóa chính (`default: uuidv7` từ gói `uuid`). TUYỆT ĐỐI không sử dụng ObjectId mặc định của MongoDB khi tạo bảng mới.
- **Tách biệt Logic và AI:** 
  - Phải tính toán học thuật tĩnh (như Vượng Suy, Quái Thân, Can Chi, Sao...) trước bằng Rule Engine (`RuleEngineService.js`) hoặc thư viện `lunar-javascript` / `iztro`.
  - Snapshot kết quả tính toán (`analysisSnapshot`) được lưu vào record tương ứng trước khi truyền sang Prompt gửi cho AI. AI không trực tiếp tính toán học thuật.
- **Xem Lá số Bản thân & Kiểm tra trùng lặp (Idempotency & Linkage):**
  - Trong `User.baziInfo`, lưu trữ `ownBaziRecordId` và `ownZiweiRecordId` để liên kết trực tiếp tới lá số bản thân của người dùng.
  - Khi kiểm tra trùng lặp bản ghi (Idempotency) trong các controller (`BaziController`, `ZiweiController`, `IChingController`, `MarriageController`), bắt buộc loại trừ các bản ghi đã xóa mềm bằng điều kiện `isDeleted: { $ne: true }`.
  - Khi thực hiện xóa lịch sử trong `HistoryController.deleteCalculation`, nếu bản ghi bị xóa trùng với lá số bản thân đã liên kết, bắt buộc phải cập nhật hủy liên kết (`ownBaziRecordId` hoặc `ownZiweiRecordId` đặt về `null`).
- **SSE Keepalive:** Tất cả các luồng SSE stream (luận giải và chat) phải được tích hợp Heartbeat Ping gửi gói tin rỗng mỗi 15 giây để chống ngắt kết nối rác.
- **Quy tắc Hiệu năng Redis & Caching (Hybrid L1 RAM + L2 Redis & Pipeline):**
  - **L1 RAM + L2 Redis Hybrid:** Profile User phải được lưu vết ở bộ nhớ RAM Local L1 (`userProfileRamCache`) kết hợp L2 Redis. Phải đọc RAM Local trước để đạt tốc độ phản hồi sub-millisecond (< 1ms), chỉ gọi Redis L2 khi RAM miss.
  - **IPv4 Forcing & Fast Fail Timeout:** Cấu hình `ioredis` bắt buộc có `family: 4` để triệt tiêu độ trễ 3000ms do DNS IPv6 AAAA trên AWS EC2. Toàn bộ câu lệnh Redis phải được bọc `withTimeout(promise, 300ms-500ms)` để Instant Fallback về RAM/Mongo nếu Redis phản hồi chậm.
  - **Redis Pipeline:** Các middleware như `rateLimiter.js` bắt buộc gộp các lệnh Redis (`INCR` + `PTTL`) trong 1 gói tin TCP (Redis Pipeline) duy nhất.
  - **Worker Non-blocking:** Không dùng các câu lệnh block socket lâu (như `BLPOP 5s`) làm đụng độ `commandTimeout` của ioredis. Sử dụng `LPOP` non-blocking có khoảng nghỉ linh hoạt.
- **Cập nhật Thống kê Tài nguyên Nguyên tử O(1):**
  - Mọi thao tác ghi nhận thống kê lượt tạo/xóa lá số phải sử dụng hàm cập nhật nguyên tử O(1) `$inc` (`UserStatsService.incrementRecordCount()`) trực tiếp tại Controller.
  - TUYỆT ĐỐI KHÔNG viết các Mongoose `post('save')` hooks lặp lại 12 câu lệnh Mongo Aggregation (`$group`, `countDocuments`) vì gây nghẽn đĩa I/O nghiêm trọng khi triển khai trên server.

### 2.2 Frontend (React 19 & Vite)
- **State Persistence:** Trạng thái phân hệ hiện tại, lá số đang mở, quẻ đang xem và bối cảnh chat phải được đồng bộ vào `localStorage` của trình duyệt.
- **Lazy Loading:** Phân hệ người dùng (`UserApp.jsx`) và quản trị (`AdminApp.jsx`) phải được tải động (lazy load) qua `React.lazy` và `React.Suspense` ở cấp độ cao nhất (`App.jsx`).
- **Premium UI Components:** Không được sử dụng input date mặc định (`input[type="date"]`) của trình duyệt cho các chức năng chọn ngày vì giao diện thô cứng của hệ điều hành làm giảm tính thẩm mỹ của dự án. Bắt buộc sử dụng component lịch tùy chỉnh viết bằng React (`CustomDatePicker`) để đảm bảo các yếu tố bo tròn mềm mại, đồng bộ màu sắc động theo Tab và tương thích tối đa trên thiết bị di động (hiển thị dạng modal ở giữa màn hình có backdrop).
- **Trải nghiệm Luồng Quên Mật Khẩu (OTP UI/UX):**
  - Khi người dùng nhấn nút gửi mã OTP khôi phục mật khẩu, bắt buộc phải kích hoạt chuyển sang bước 2 (nhập OTP và mật khẩu mới) ngay lập tức để tạo cảm giác mượt mà, không được bắt người dùng đợi phản hồi từ API gửi thư. Nếu API gửi ngầm thất bại, giao diện sẽ rollback lại bước 1 kèm theo banner thông báo lỗi.
  - Khi khôi phục mật khẩu thành công (happy path), toàn bộ input và form nhập liệu phải được ẩn đi hoàn toàn, chỉ hiển thị thông báo thành công nguyên màn hình modal kèm hiệu ứng nhún (bounce) và tự động chuyển hướng về form đăng nhập chính sau 1.2 giây.
- **Quy tắc Trình diễn Markdown & Bảng GFM:** Bắt buộc sử dụng `ReactMarkdown` tích hợp plugin `remark-gfm` cho các nội dung luận giải AI và tệp tin bài viết. Mọi nội dung bài viết bắt buộc phải đi qua hàm tiền xử lý chuẩn hóa ngắt dòng (`normalizeMarkdownContent`) để ngăn chặn việc vỡ giao diện bảng hoặc hiển thị sai thẻ in đậm trên các thiết bị di động.

---

## 🔒 3. Quy tắc Bảo mật & Kiểm soát Tài nguyên

- **Credit Check:** Bất kỳ route nào gọi tới API tạo luận giải AI (`/interpret`) đều phải đi qua Middleware `creditCheck.js`. Middleware này thực hiện cập nhật trừ credit nguyên tử (atomic decrement):
  ```javascript
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gt: 0 } },
    { $inc: { credits: -1 } },
    { new: true }
  );
  ```
- **Phân quyền Admin/Co-Admin:** Admin có toàn quyền. Co-Admin chỉ có quyền thao tác trên các bản ghi và người dùng có role là `user` hoặc `vip` (được xác thực qua hàm hỗ trợ `req.hasAuthorityOver(targetUser)`).
- **Lọc Intent (isDivinationRelated):** Bất kỳ câu hỏi chat follow-up nào gửi lên từ phía người dùng đều phải được kiểm tra tính liên quan thông qua `ConversationContextService.js` để tránh việc lạm dụng LLM hỏi các chủ đề lạc đề.
- **Kiểm tra quyền sở hữu dữ liệu (Data Privacy Boundary):** Tất cả các API xem chi tiết bản ghi, trò chuyện AI hoặc lịch sử chat đều bắt buộc đi qua middleware kiểm tra quyền sở hữu (`checkRecordOwnership` hoặc `checkHistoryOwnership`) để chặn xem chéo thông tin trái phép của người dùng khác.
- **Hủy phiên tức thời khi Đăng xuất (Token Revocation):** Khi đăng xuất, bắt buộc phải gọi request `POST /api/auth/logout` lên Backend trước khi xóa thông tin lưu trữ cục bộ, mục đích là tăng `tokenVersion` của người dùng trong cơ sở dữ liệu lên 1 để vô hiệu hóa token này vĩnh viễn trên máy chủ.
- **Hủy phiên đăng nhập cũ khi thay đổi/khôi phục mật khẩu:** Khi thực hiện đổi mật khẩu hoặc khôi phục mật khẩu thành công, máy chủ bắt buộc phải tăng `tokenVersion` lên 1 để vô hiệu hóa tất cả các JWT token cũ đang lưu hành.
- **Quản lý mã Email OTP:** Mã OTP khôi phục mật khẩu gồm 6 chữ số ngẫu nhiên gửi qua email có thời hạn hết hạn nghiêm ngặt là 15 phút. Nội dung email gửi đi bắt buộc phải ở định dạng HTML có CSS inline đồng bộ phong cách học thuật.

---

## ✍️ 4. Quy ước Code (Coding Standards)

- **Ngôn ngữ biến & tệp tin:** 100% tiếng Anh cho tên tệp, tên biến, các trường cơ sở dữ liệu và API endpoints.
- **Viết hoa/thường:**
  - Class, Service: `CamelCase` (ví dụ: `RuleEngineService`, `BaziAnalyzer`).
  - Controller, Model: `CamelCase` (ví dụ: `IChingRecord`, `AuthController`).
  - Tên biến, hàm: `camelCase` (ví dụ: `determineCachCuc`, `parseUngKyBlock`).
  - Router file: `lowercase` (ví dụ: `ziwei.js`, `history.js`).
- **Nội dung Việt hóa:** Toàn bộ giao diện người dùng hiển thị (UI) và phản hồi từ AI luận giải phải sử dụng tiếng Việt chuẩn phong thủy cổ học.

---

## 🛠️ 5. Hướng dẫn sửa đổi mã nguồn cho Agent
1. **Không can thiệp logic an sao:** Không tự ý thay đổi thư viện `lunar-javascript` hay `iztro` vì có thể gây sai lệch kết quả an sao của hàng vạn lá số hiện có.
2. **Bảo toàn thuật toán Bát tự Ngũ hành 4.0:** Khi thay đổi logic tính toán ngũ hành Bát tự, bắt buộc phải bảo toàn cơ chế điều chỉnh điểm tương đối theo tỷ lệ phần trăm, quy tắc hợp giải xung (ưu tiên tổ hợp địa chi), đa thấu phân khí, tiết khí cực đoan (con vượng mẹ kiệt), và cơ chế bypass điểm sàn 5% khi cách cục đạt trạng thái Tòng Cách.
3. **Tuân thủ quy trình kiểm thử:** Khi sửa đổi Backend, phải kiểm tra cú pháp node của tệp tin trước bằng lệnh `node --check src/path/to/file.js`.
4. **Cập nhật CHANGELOG_AI.md:** Bất kỳ thay đổi cấu trúc lớn nào do AI thực hiện phải được ghi nhận vào tài liệu lịch sử AI.
5. **Quy tắc thiết kế giao diện (UI Aesthetics):** Khi viết code CSS/Tailwind cho các thành phần UI, phải tuân thủ chuẩn Premium Aesthetics (bo góc lớn `rounded-2xl` hoặc `rounded-3xl`, sử dụng màu sắc HSL phối hài hòa nhẹ nhàng, tránh dùng màu sắc chói thô cứng, và tích hợp các micro-animations chuyển đổi mượt mà).

---

## 📄 6. Quy sách Cập nhật Tài liệu (Documentation Policy)
Sau mỗi thay đổi source code, AI phải kiểm tra xem tài liệu có cần cập nhật hay không.
**Nguyên tắc:**
- Tuyệt đối không để tài liệu và source code khác nhau.
- Nếu thay đổi API → cập nhật [API.md](file:///t:/Phongthuy/docs/API.md).
- Nếu thay đổi Database → cập nhật [DATABASE.md](file:///t:/Phongthuy/docs/DATABASE.md).
- Nếu thay đổi kiến trúc → cập nhật [ARCHITECTURE.md](file:///t:/Phongthuy/docs/ARCHITECTURE.md).
- Nếu thay đổi nghiệp vụ → cập nhật [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md).
- Nếu thêm module → cập nhật [PROJECT_CONTEXT.md](file:///t:/Phongthuy/docs/PROJECT_CONTEXT.md).
- Nếu thay đổi tổng quan, cấu trúc cài đặt hoặc luồng khởi chạy hệ thống → cập nhật [README.md](file:///t:/Phongthuy/README.md).
- Mọi thay đổi đều phải ghi vào [CHANGELOG_AI.md](file:///t:/Phongthuy/docs/CHANGELOG_AI.md).

**Tiêu chuẩn hoàn thành nhiệm vụ:**
Một tác vụ (task) chỉ được xem là hoàn thành khi:
1. Source code đã được chỉnh sửa và kiểm thử hoàn thiện.
2. Tất cả các tài liệu kỹ thuật liên quan (bao gồm cả [README.md](file:///t:/Phongthuy/README.md)) đã được cập nhật chính xác.
3. [CHANGELOG_AI.md](file:///t:/Phongthuy/docs/CHANGELOG_AI.md) đã ghi nhận đầy đủ chi tiết thay đổi.

---

