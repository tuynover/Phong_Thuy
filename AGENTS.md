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
