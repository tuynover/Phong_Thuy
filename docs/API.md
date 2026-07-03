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

### 1.4 Thay đổi mật khẩu
Đổi mật khẩu cho người dùng hiện tại (yêu cầu gửi kèm JWT token).
- **Endpoint:** `PUT /api/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword888"
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "message": "Đổi mật khẩu thành công."
  }
  ```

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

### 2.5 Tra cứu khái niệm học thuật
Lấy thông tin chi tiết (Lục Thân, Lục Thú, Hào Thế/Ứng) để hiển thị tooltip giải nghĩa trên giao diện người dùng.
- **Endpoint:** `GET /api/concept/:term`
- **Tham số `:term`:** Tên khái niệm (ví dụ: `Phụ Mẫu`, `Thê Tài`, `Thanh Long`...).
- **Phản hồi (200):**
  ```json
  {
    "term": "Phụ Mẫu",
    "category": "Lục Thân",
    "short_description": "Cha mẹ, bề trên, giấy tờ, xe cộ, nhà cửa.",
    "full_detail": "▸ Người đại diện: Cha mẹ, ông bà...\n▸ Sự vật: Hợp đồng, văn bằng..."
  }
  ```

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

---

## 🔔 6. Thông báo Người dùng (`/api/notifications`)

Yêu cầu người dùng đăng nhập. Phục vụ lấy danh sách và quản lý trạng thái đọc thông báo (đặc biệt là thông báo nhắc nhở Ứng Kỳ).

- **Lấy danh sách thông báo:** `GET /api/notifications`
  - **Phản hồi (200):** Danh sách các thông báo của người dùng.
- **Đánh dấu đọc tất cả:** `PUT /api/notifications/read-all`
  - **Phản hồi (200):** `{ "success": true, "modifiedCount": 3 }`
- **Đánh dấu đọc một thông báo:** `PUT /api/notifications/:id/read`
  - **Phản hồi (200):** `{ "success": true }`

---

## 📅 7. Xem Ngày & Giờ Hoàng Đạo (Trạch Cát) (`/api/date`)

Chức năng chạy in-memory, phục vụ xem ngày cát hung và tư vấn khoảng thời gian hoàng đạo phù hợp với tuổi. Không lưu trữ thông tin vào cơ sở dữ liệu.

### 7.1 Kiểm tra một ngày cụ thể (Xem Ngày)
- **Endpoint:** `POST /api/date/check`
- **Body:**
  ```json
  {
    "birthYear": 1990,
    "solarDate": "2026-07-03", // YYYY-MM-DD hoặc DD/MM/YYYY
    "solarHour": "12:00",      // HH:mm (Tùy chọn)
    "activity": "dai_su"       // "dai_su" | "khoi_nghiep" | "xay_dung"
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "userYearInfo": {
      "yearCanChi": "Canh Ngọ",
      "naYin": "Lộ Bàng Thổ",
      "gan": "Canh",
      "zhi": "Ngọ"
    },
    "dayEvaluation": {
      "rating": "Nên", // "Rất tốt" | "Nên" | "Không nên" | "Không được"
      "score": 1.5,
      "positiveFactors": [
        "Ngũ hành ngày là Thành Đầu Thổ (Thổ) Tương Hòa với bản mệnh Lộ Bàng Thổ (Thổ) của bạn.",
        "Ngày có Trực Thành tốt cho công việc dự kiến."
      ],
      "negativeFactors": [
        "Ngày Hắc Đạo xung kỵ (Bạch Hổ)."
      ],
      "lunarDateInfo": {
        "year": 2026,
        "month": 5,
        "day": 19,
        "yearCanChi": "Bính Ngọ",
        "monthCanChi": "Mậu Ngọ",
        "dayCanChi": "Mậu Dần",
        "truc": "Thành",
        "deity": "Bạch Hổ",
        "deityType": "Hắc Đạo"
      }
    },
    "hourEvaluation": {
      "rating": "Rất tốt",
      "score": 2,
      "positiveFactors": [ "Giờ Hoàng Đạo trị nhật bởi thần Thiên Đức." ],
      "negativeFactors": [],
      "hourName": "Tỵ",
      "hourCanChi": "Đinh Tỵ",
      "deity": "Thiên Đức",
      "deityType": "Hoàng Đạo",
      "timeRange": "9h - 11h"
    },
    "solarDateInfo": {
      "date": "03/07/2026",
      "hour": "12:00"
    }
  }
  ```

### 7.2 Tư vấn ngày hoàng đạo trong một khoảng thời gian
- **Endpoint:** `POST /api/date/consult`
- **Body:**
  ```json
  {
    "birthYear": 1990,
    "startDate": "2026-07-01",
    "endDate": "2026-07-07",
    "activity": "dai_su"
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "userYearInfo": {
      "yearCanChi": "Canh Ngọ",
      "naYin": "Lộ Bàng Thổ",
      "gan": "Canh",
      "zhi": "Ngọ"
    },
    "recommendations": [
      {
        "solarDate": "02/07/2026",
        "dayEvaluation": { ... },
        "goodHours": [
          { "hourName": "Dần", "timeRange": "3h - 5h", "rating": "Rất tốt", "deity": "Kim Quỹ" },
          ...
        ]
      },
      ...
    ]
  }
  ```

