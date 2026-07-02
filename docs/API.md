# 📡 API.md - Đặc tả API Endpoints (RESTful & SSE)

Tất cả các API Endpoints đều có tiền tố `/api`. Các endpoint yêu cầu xác thực phải gửi JWT token trong Header `Authorization: Bearer <token>` hoặc tham số query `?token=<token>`.

---

## 🔐 1. Xác thực & Người dùng (`/api/auth`)

### 1.1 Đăng ký tài khoản
- **Endpoint:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecretPassword123",
    "name": "Nguyen Van A",
    "gender": 1
  }
  ```
- **Phản hồi (201):**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "uuid-v7...", "email": "user@example.com", "name": "Nguyen Van A", "credits": 1 }
  }
  ```

### 1.2 Đăng nhập
- **Endpoint:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecretPassword123"
  }
  ```
- **Phản hồi (200):** Tương tự đăng ký.

### 1.3 SSE - Đồng bộ tài khoản phía Client
- **Endpoint:** `GET /api/auth/events`
- **Query:** `?token=<jwt_token>`
- **Định dạng stream:** `text/event-stream`
- **Sự kiện phát:**
  - `account_locked`: Kích hoạt khi tài khoản bị admin khóa.
  - `account_deleted`: Kích hoạt khi tài khoản bị xóa.
  - `account_updated`: Cập nhật credits/role mới.

---

## ☯️ 2. Gieo Quẻ & Tính toán Số lý

### 2.1 Tính toán Quẻ Kinh Dịch
Tính toán và an hào quẻ Kinh Dịch dựa trên 6 lần gieo đồng xu hoặc Số lý Mai Hoa.
- **Endpoint:** `POST /api/iching/calculate` (Aliases: `/api/hexagrams/calculate`, `/api/calculate`)
- **Body (Lục Hào):**
  ```json
  {
    "question": "Sự nghiệp năm nay thế nào?",
    "userId": "uuid-v7-user-id",
    "tosses": [3, 2, 2, 3, 1, 2] // 1: 1 Ngửa, 2: 2 Ngửa, 3: 3 Ngửa, 0: 0 Ngửa
  }
  ```
- **Body (Mai Hoa Dịch Số - Giờ Động Tâm):**
  ```json
  {
    "question": "Thi cử có thuận lợi không?",
    "userId": "uuid-v7-user-id",
    "method": "mai_hoa_time",
    "dateTime": "2026-07-02T15:00:00"
  }
  ```
- **Body (Mai Hoa Dịch Số - Seri Tiền 8 Số):**
  ```json
  {
    "question": "Thi cử có thuận lợi không?",
    "userId": "uuid-v7-user-id",
    "method": "mai_hoa_money",
    "serialNumber": "83749281"
  }
  ```
- **Phản hồi (200):** Trả về toàn bộ chi tiết Quẻ Chính, Quẻ Biến, Hào Động, Vượng Suy, Quái Thân, và Lịch pháp ngày gieo.

### 2.2 Lập bản đồ Tứ Trụ Bát Tự
- **Endpoint:** `POST /api/bazi/analyze`
- **Body:**
  ```json
  {
    "date": "2004-09-05", // YYYY-MM-DD
    "time": "14:30",      // HH:mm
    "gender": 1,          // 1: Nam, 0: Nữ
    "userId": "guest"
  }
  ```

### 2.3 Xem tuổi Kết Hôn (Hợp Hôn)
- **Endpoint:** `POST /api/marriage/analyze`
- **Body:**
  ```json
  {
    "male": { "date": "2004-08-27", "time": "07:30" },
    "female": { "date": "2001-01-02", "time": "03:02" },
    "userId": "uuid-v7..."
  }
  ```

### 2.4 Lập mệnh bàn Tử Vi (Bản mệnh thô)
- **Endpoint:** `POST /api/ziwei/` (hoặc `/api/tu-vi/`)
- **Body:**
  ```json
  {
    "date": "2004-09-05",
    "hour": 7, // Chỉ số giờ: 0 (Tý) đến 11 (Hợi)
    "gender": "Nam", // "Nam" | "Nữ"
    "calendarType": "solar" // "solar" | "lunar"
  }
  ```
- **Phản hồi (200):** Trả về thông tin an sao 12 cung chi tiết dựa trên thư viện iztro.

---

## 🤖 3. Luận Giải AI & Trò chuyện Chat (`/api/ai`)

*Lưu ý: Tất cả API interpret của AI đều kiểm tra và trừ credit (ngoại trừ Admin).*

### 3.1 Kích hoạt Luận giải AI (Kinh Dịch / Bát Tự / Tử Vi / Kết Hôn) (SSE Stream)
- **Endpoint:** `POST /api/ai/iching/:id/interpret` (hoặc `/bazi/:id/interpret`, `/ziwei/:id/interpret`, `/marriage/:id/interpret`)
- **Headers:** `Authorization: Bearer <token>`
- **Định dạng stream:** `text/event-stream`
- **Sự kiện phát:**
  - `message`: Chứa text chunk dạng raw markdown.
  - `done`: Tín hiệu kết thúc stream từ AI.

### 3.2 Chat Hỏi đáp sâu (Follow-up Chat - SSE Stream)
- **Endpoint:** `POST /api/ai/iching/:id/chat` (hoặc `/bazi/:id/chat`, `/ziwei/:id/chat`, `/marriage/:id/chat`)
- **Body:**
  ```json
  {
    "message": "Hào động thứ 3 hoặc cung Quan Lộc có ý nghĩa gì?"
  }
  ```
- **Định dạng stream:** `text/event-stream`
- **Sự kiện phát:**
  - `message`: Chứa văn bản stream.
  - `structured`: Sự kiện cuối cùng trả về đối tượng JSON chứa thông số phân tích sâu:
    ```json
    {
      "answer": "...",
      "timing": "tháng 8 âm lịch",
      "risk": "Cẩn trọng tiểu nhân",
      "confidence": 85
    }
    ```

---

## 🗂️ 4. Xem Lịch sử & Đánh giá (`/api/history`)

- **Lấy danh sách lịch sử:**
  `GET /api/history/:system/:userId` (với `:system` là `iching`, `bazi`, `ziwei`, `marriage`)
- **Lấy chi tiết một bản ghi:**
  `GET /api/history/:system/record/:id`
- **Đánh giá bản ghi:**
  `PUT /api/history/:system/:id/rate` (Body: `{ "rating": 5, "feedback": "Rất chính xác" }`)
- **Liên kết lịch sử khách (Guest Link):**
  `PUT /api/history/:system/:id/link` (Liên kết bản ghi của khách vãng lai vào tài khoản vừa đăng nhập).
- **Xóa bản ghi (Soft Delete):**
  `DELETE /api/history/calculations/:type/:id` (Với `:type` là `iching`, `bazi`, `ziwei`, `marriage`).

---

## 🛠️ 5. Quản trị Hệ thống (`/api/admin`)

Tất cả các route yêu cầu tài khoản đăng nhập có quyền `admin` hoặc `co-admin`.

- **Lấy danh sách người dùng:** `GET /api/admin/users`
- **Cập nhật quyền hạn:** `PUT /api/admin/users/:id/role` (Body: `{ "role": "vip" }`)
- **Nạp/Trừ credit:** `PUT /api/admin/users/:id/credits` (Body: `{ "credits": 10 }`)
- **Khóa tài khoản:** `POST /api/admin/users/:id/lock` (Body: `{ "reason": "Spam AI" }`)
- **Mở khóa tài khoản:** `POST /api/admin/users/:id/unlock`
- **Báo cáo máy chủ:** `GET /api/admin/analytics`
- **Xem Live Event Admin (Realtime SSE):** `GET /api/admin/events?token=<admin_jwt>`
