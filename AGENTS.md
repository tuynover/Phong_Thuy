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
- **SSE Keepalive:** Tất cả các luồng SSE stream (luận giải và chat) phải được tích hợp Heartbeat Ping gửi gói tin rỗng mỗi 15 giây để chống ngắt kết nối rác.

### 2.2 Frontend (React 19 & Vite)
- **State Persistence:** Trạng thái phân hệ hiện tại, lá số đang mở, quẻ đang xem và bối cảnh chat phải được đồng bộ vào `localStorage` của trình duyệt.
- **Lazy Loading:** Phân hệ người dùng (`UserApp.jsx`) và quản trị (`AdminApp.jsx`) phải được tải động (lazy load) qua `React.lazy` và `React.Suspense` ở cấp độ cao nhất (`App.jsx`).
- **Premium UI Components:** Không được sử dụng input date mặc định (`input[type="date"]`) của trình duyệt cho các chức năng chọn ngày vì giao diện thô cứng của hệ điều hành làm giảm tính thẩm mỹ của dự án. Bắt buộc sử dụng component lịch tùy chỉnh viết bằng React (`CustomDatePicker`) để đảm bảo các yếu tố bo tròn mềm mại, đồng bộ màu sắc động theo Tab và tương thích tối đa trên thiết bị di động (hiển thị dạng modal ở giữa màn hình có backdrop).

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
2. **Tuân thủ quy trình kiểm thử:** Khi sửa đổi Backend, phải kiểm tra cú pháp node của tệp tin trước bằng lệnh `node --check src/path/to/file.js`.
3. **Cập nhật CHANGELOG_AI.md:** Bất kỳ thay đổi cấu trúc lớn nào do AI thực hiện phải được ghi nhận vào tài liệu lịch sử AI.
4. **Quy tắc thiết kế giao diện (UI Aesthetics):** Khi viết code CSS/Tailwind cho các thành phần UI, phải tuân thủ chuẩn Premium Aesthetics (bo góc lớn `rounded-2xl` hoặc `rounded-3xl`, sử dụng màu sắc HSL phối hài hòa nhẹ nhàng, tránh dùng màu sắc chói thô cứng, và tích hợp các micro-animations chuyển đổi mượt mà).

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

