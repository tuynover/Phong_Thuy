# 📡 API.md - Đặc tả API Endpoints (RESTful & SSE)

Tất cả các API Endpoints đều có tiền tố `/api`. Các endpoint yêu cầu xác thực phải gửi JWT token trong Header `Authorization: Bearer <token>`.

### 🛡️ Giới hạn Tần suất Truy cập Toàn cục (Global API Rate Limiter)
Toàn bộ các yêu cầu HTTP tới `/api/*` được bảo vệ bởi bộ điều tiết tần suất:
- **Ngưỡng giới hạn:** 300 yêu cầu / 5 phút trên mỗi địa chỉ IP (`standardHeaders: true`, `legacyHeaders: false`).
- **Mã phản hồi khi vượt ngưỡng:** `429 Too Many Requests`.
- **Thông báo lỗi:** `Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 5 phút.`
- **Headers:** `RateLimit-Limit: 300`, `RateLimit-Remaining: <số lượt còn lại>`, `RateLimit-Reset: <thời điểm làm mới>`.

---

## 🚀 Hướng dẫn Kiểm thử & Thử nghiệm API (Testing Guides)

Hệ thống hỗ trợ hai phương thức kiểm thử và tra cứu API nhanh chóng:

### 1. Swagger UI (Thử nghiệm Trực quan trên Trình duyệt)
Khi máy chủ backend đang chạy (mặc định tại `http://localhost:3001`), bạn có thể truy cập:
- **Đường dẫn Swagger UI:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **Tính năng:**
  - Liệt kê trực quan toàn bộ API, mô hình dữ liệu (schemas).
  - Đã tích hợp đầy đủ dữ liệu mẫu (Request Examples) cho Bát Tự, Tử Vi, Kinh Dịch, Trạch Cát để người dùng bấm **"Try it out"** và **"Execute"** chạy thử ngay lập tức.
  - Hỗ trợ lưu token JWT cho các route yêu cầu bảo mật thông qua nút **"Authorize"** (chọn `bearerAuth` và nhập JWT token).

### 2. Postman Collection (Thử nghiệm Tự động hóa)
Tệp đặc tả Postman Collection được đặt tại:
- **Tệp tin:** [docs/PhongThuy_API.postman_collection.json](file:///t:/Phongthuy/docs/PhongThuy_API.postman_collection.json)
- **Cách sử dụng:**
  1. Mở phần mềm Postman, chọn **Import** và tải lên tệp tin `PhongThuy_API.postman_collection.json`.
  2. Collection chứa sẵn 7 thư mục được phân loại khoa học (Xác thực, Gieo quẻ, Luận giải AI, Lịch sử, Thông báo, Trạch cát, Admin).
  3. Cấu hình sẵn các biến bộ sưu tập (`baseUrl`, `token`, `userId`, `recordId`).
  4. Các yêu cầu **Đăng ký / Đăng nhập** chứa mã tự động (Test Scripts) để trích xuất `token` và `userId` ghi vào biến bộ sưu tập, giúp các yêu cầu tiếp theo chạy mượt mà mà không cần copy thủ công.
  5. Các yêu cầu **Lập quẻ / Lập lá số** cũng tự động lưu lại `recordId` của bản ghi để chuyển tiếp sang API Luận giải AI và Chat.

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
    "user": { "id": "uuid-v7...", "_id": "uuid-v7...", "email": "user@example.com", "name": "Nguyen Van A", "credits": 1 }
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
- **Headers:** `Authorization: Bearer <token>` (Lưu ý: Trình duyệt cần dùng EventSourcePolyfill để gửi kèm Authorization Header, route backend hiện không đọc qua query `?token=`)
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

### 1.5 Đăng xuất tài khoản
Đăng xuất và hủy bỏ hiệu lực của toàn bộ JWT token hiện tại trên máy chủ (yêu cầu gửi kèm JWT token).
- **Endpoint:** `POST /api/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Phản hồi (200):**
  ```json
  {
    "message": "Đăng xuất thành công."
  }
  ```

### 1.6 Quên mật khẩu (Yêu cầu gửi OTP)
Yêu cầu gửi mã OTP ngẫu nhiên gồm 6 chữ số về email đăng ký của người dùng để chuẩn bị khôi phục mật khẩu.
- **Endpoint:** `POST /api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "message": "Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn."
  }
  ```

### 1.7 Khôi phục mật khẩu
Sử dụng mã OTP nhận được trong email để đặt lại mật khẩu mới cho tài khoản.
- **Endpoint:** `POST /api/auth/reset-password`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "MyNewPassword123"
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "message": "Khôi phục mật khẩu thành công!"
  }
  ```

### 1.8 Cập nhật thông tin Bát Tự & Thiết lập/Liên kết lá số bản thân
Cập nhật thông tin ngày giờ sinh mặc định và thiết lập liên kết trực tiếp tới lá số bản thân (Bát Tự/Tử Vi) của người dùng để tránh tạo trùng lặp.
- **Endpoint:** `PUT /api/auth/bazi`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "userId": "uuid-v7-user-id",
    "day": 27,
    "month": 8,
    "year": 2004,
    "hour": 7,
    "minute": 30,
    "ownBaziRecordId": "uuid-v7-bazi-record-id", // Tùy chọn
    "ownZiweiRecordId": "uuid-v7-ziwei-record-id"  // Tùy chọn
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "user": {
      "id": "uuid-v7-user-id",
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "baziInfo": {
        "day": 27,
        "month": 8,
        "year": 2004,
        "hour": 7,
        "minute": 30,
        "ownBaziRecordId": "uuid-v7-bazi-record-id",
        "ownZiweiRecordId": "uuid-v7-ziwei-record-id"
      },
      "gender": 1,
      "phone": "",
      "role": "user",
      "credits": 2,
      "status": "active"
    }
  }
  ```

### 1.10 Điểm danh hàng ngày nhận Point (Daily Check-in)
Mỗi ngày mở 1 phong bao nhận Point miễn phí. Cơ chế lũy tiến hàng tuần: Sang tuần mới (Tuần $W$), mốc thưởng Ngày 1-6 tăng thêm $+(W-1) \times 10$ Points, mốc Ngày 7 tăng thêm $+(W-1) \times 20$ Points. Được bảo vệ chống race condition bằng Redis distributed lock (`acquireRedisLock`).
- **Endpoint:** `POST /api/auth/daily-checkin`
- **Headers:** `Authorization: Bearer <token>`
- **Phản hồi Thành công (200):**
  ```json
  {
    "success": true,
    "message": "Điểm danh Ngày 1 (Tuần 1) thành công! Bạn nhận được +10 Points.",
    "streak": 1,
    "currentWeek": 1,
    "dayInWeek": 1,
    "reward": 10,
    "rewards": [10, 15, 20, 25, 30, 40, 100],
    "credits": 210,
    "dailyCheckin": {
      "streak": 1,
      "lastCheckinDate": "2026-09-22",
      "totalCheckins": 1,
      "lastCheckinAt": "2026-09-21T17:05:36.625Z"
    },
    "user": { ... }
  }
  ```
- **Phản hồi đã nhận hôm nay (400):**
  ```json
  {
    "message": "Hôm nay bạn đã nhận thưởng điểm danh rồi. Hãy quay lại vào ngày mai nhé!",
    "alreadyCheckedIn": true,
    "currentStreak": 1,
    "currentWeek": 1,
    "dayInWeek": 1,
    "dailyCheckin": { ... },
    "credits": 210
  }
  ```

### 1.11 Lấy trạng thái điểm danh hiện tại
- **Endpoint:** `GET /api/auth/daily-checkin/status`
- **Headers:** `Authorization: Bearer <token>`
- **Phản hồi (200):**
  ```json
  {
    "success": true,
    "hasCheckedInToday": false,
    "currentStreak": 0,
    "displayStreak": 0,
    "nextStreak": 1,
    "currentWeek": 1,
    "dayInWeek": 1,
    "todayReward": 10,
    "rewards": [10, 15, 20, 25, 30, 40, 100],
    "dailyCheckin": {
      "streak": 0,
      "lastCheckinDate": null,
      "totalCheckins": 0,
      "lastCheckinAt": null
    },
    "credits": 200
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

*Lưu ý: Tất cả API interpret của AI đều kiểm tra và trừ credit nguyên tử (Atomic decrement qua `creditCheck.js`), ngoại trừ Admin/Co-Admin.*

### 3.1 Kích hoạt Luận giải AI (Kinh Dịch / Bát Tự / Tử Vi / Kết Hôn) (SSE Stream)
- **Endpoint:** `POST /api/ai/iching/:id/interpret` (hoặc `/bazi/:id/interpret`, `/ziwei/:id/interpret`, `/marriage/:id/interpret`)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "userId": "uuid-v7...",
    "mode": "standard" // Hoặc "vip" cho luận giải chuyên sâu đa tầng
  }
  ```
- **Chính sách Trừ Credit:**
  - **Bản Cơ Bản (`mode: "standard"`):** Trừ **1 Credit**. Dung lượng 800 - 1.200 từ, luận giải tổng quan tức thời.
  - **Bản Chuyên Sâu VIP (`mode: "vip"`):** Trừ **5 Credits**.
    + **Bát Tự:** Kiến trúc Multi-Agent 3 Tầng, dung lượng 6.500+ từ (~34.000 ký tự), giải mã qua 6 Chương học thuật, Ma Trận SWOT và Điều Hòa Chiến Lược Đa Mục Tiêu.
    + **Tử Vi:** Kiến trúc Multi-Agent 4 Tầng (Cốt Cách CoT + Tứ Hóa CoT + 5 Replicas Cụm Cung song song + Gemini Flash Lite Chief Editor tổng kết 3 Bước Ngoặt & Cải Vận).
    + **Hợp Hôn:** Kiến trúc Multi-Agent 3 Tầng (Tương Quan CoT + 4 Replicas 4 Trụ Cột song song: Cốt Cách Tâm Lý, Tài Chính Tổ Ấm, Hóa Giải Xung Khắc, Con Cái Trăm Năm + Gemini Chief Editor tổng hợp phác đồ hòa hợp).
    + **Kinh Dịch:** Kiến trúc Multi-Agent 3 Tầng (Lục Hào CoT + 3 Replicas 3 Khối song song: Biện Chứng Lục Hào, 3 Kịch Bản Diễn Tiến Thuận/Nghịch/Đột Phá, Mốc Thời Gian Ứng Kỳ + Gemini Chief Editor đúc kết Đạo Dịch).
  - **Tối Ưu Hóa Theo Độ Tuổi Âm Lịch (Age-Adaptive Optimization):**
    + Áp dụng cho 2 phân hệ **Bát Tự** và **Tử Vi** trên cả 2 chế độ (`standard` và `vip`).
    + Backend tự động kích hoạt `AgeClassifier.classifyAgeFromRecord(record)` để tính tuổi mụ ($\text{Năm hiện tại} - \text{Năm sinh} + 1$).
    + **Tuổi nhỏ (`CHILD`, < 18 tuổi):** Bỏ qua hoàn toàn tình cảm lứa đôi/tiền bạc lớn; chuyển hướng 100% sang phân tích tư chất bẩm sinh, định hướng học tập khối ngành, giáo dục gia đình, sức khỏe tạng phủ thiếu thời, phong thủy bàn học Văn Xương.
    + **Thanh niên (`YOUNG_ADULT`, 18 - 29 tuổi):** Luận giải cơ bản đầy đủ tất cả phương diện; Luận giải chuyên sâu bổ sung phân tích sâu về tính cách cốt lõi (Replica 1).
    + **Trung niên (`ADULT`, 30 - 55 tuổi):** Toàn diện 6 chuyên đề sự nghiệp, tài lộc, hôn nhân, sức khỏe, vận hạn.
    + **Cao niên (`SENIOR`, > 55 tuổi):** Trọng tâm dưỡng sinh tạng phủ trường thọ, phúc trạch con cháu, bảo toàn gia sản.
  - **Nâng Cấp từ Cơ Bản lên VIP (`isUpgrade: true`):** Chỉ trừ **4 Credits** (bù chênh lệch `5 - 1 = 4 credits`). Hệ thống thực hiện 0ms Instant Reset, xóa bài cũ và stream bản VIP mới.
  - **Chặn trùng lặp (Idempotent Guard):** Nếu bản ghi đã có bài VIP hoàn chỉnh (`aiInterpretation.mode === 'vip'`), hệ thống chặn 0ms, không trừ thêm credit và stream trực tiếp từ bản lưu cache.
- **Định dạng stream:** `text/event-stream`
- **Các gói tin SSE phát:**
  - **Tiến độ Chương / Cụm Cung / Trụ Cột / Kịch Bản VIP (Progress Event):**
    ```json
    // Bát Tự (chapterId: 1..6)
    data: {"chapterId": 1, "status": "in_progress", "title": "Sự Nghiệp & Công Danh"}
    data: {"chapterId": 1, "status": "completed", "title": "Sự Nghiệp & Công Danh"}

    // Tử Vi (clusterId: 1..5)
    data: {"clusterId": 1, "status": "in_progress", "title": "Mệnh - Thân - Phúc Đức"}
    data: {"clusterId": 1, "status": "completed", "title": "Mệnh - Thân - Phúc Đức"}

    // Hợp Hôn (chapterId: 1..4)
    data: {"chapterId": 1, "status": "in_progress", "title": "Cốt Cách & Tâm Lý Phối Ngẫu"}
    data: {"chapterId": 1, "status": "completed", "title": "Cốt Cách & Tâm Lý Phối Ngẫu"}

    // Kinh Dịch (chapterId: 1..3)
    data: {"chapterId": 1, "status": "in_progress", "title": "Biện Chứng Lục Hào Cốt Lõi"}
    data: {"chapterId": 1, "status": "completed", "title": "Biện Chứng Lục Hào Cốt Lõi"}
    ```
  - **Nội dung văn bản (Text Chunks):**
    ```json
    data: {"chunk": "Nhật chủ Canh Kim sinh tháng Tý..."}
    ```
  - **Hoàn thành (Done Signal):**
    ```
    data: [DONE]
    ```
  - **Heartbeat Ping:** Gửi `:\n\n` định kỳ mỗi 15 giây để chống drop socket rác.

### 3.2 Chat Hỏi đáp sâu (Follow-up Chat - SSE Stream)
- **Endpoint:** `POST /api/ai/iching/:id/chat` (hoặc `/bazi/:id/chat`, `/ziwei/:id/chat`, `/marriage/:id/chat`)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "message": "Hào động thứ 3 hoặc cung Quan Lộc có ý nghĩa gì?",
    "activeSectionId": "bazi_ch_1" // Tùy chọn: ID của Cụm/Chương đang đàm đạo (ví dụ: bazi_ch_1, tu_vi_ch_2, marriage_ch_1, iching_ch_2)
  }
  ```
- **Chính sách Trừ Credit & Kiểm soát Ý định (Weighted Intent Scoring):**
  - Trừ **0.5 Credit** cho mỗi lượt hỏi đáp hợp lệ (áp dụng cho tài khoản người dùng thông thường, Admin/Co-Admin được miễn phí).
  - Áp dụng **Weighted Intent Scoring Guardrail**:
    + Chặn đứng 100% yêu cầu viết code, lập trình, giải bài tập hoặc jailbreak công nghệ lồng từ khóa phong thủy (Trả về HTTP 400 và thông báo từ chối, **không trừ credits**).
    + Chấp nhận các câu hỏi trăn trở đời sống, bế tắc, khủng hoảng cảm xúc, định hướng tương lai, thỉnh giáo đàm đạo và thời tiết.
- **Cơ chế Đồng Bộ Ngữ Cảnh VIP & Động Cơ BM25 In-Memory:**
  - Khi bản ghi đã có bài luận giải VIP (4.000 - 7.000 từ), hệ thống áp dụng cơ chế **Okapi BM25 Paragraph Ranking + Semantic Chunking**:
    + Nếu `activeSectionId` được chỉ định: Ghim Cụm đang đứng và xếp hạng BM25 nội bộ trong Cụm, tự động mở rộng quét liên Cụm nếu câu hỏi có liên quan mật thiết (score > 3.5).
    + Nếu `activeSectionId` là `null`: Chạy thuật toán Okapi BM25 trên toàn bộ bài luận giải VIP, xếp hạng và gom các đoạn văn phù hợp nhất từ nhiều Cụm (Multi-Intent Retrieval) cho câu hỏi đa chủ đề.
    + Fallback an toàn: Trích xuất phần Cốt cách Tổng quan / SWOT hoặc Điều Hòa Chiến Lược qua Topic Routing.
  - Ngữ cảnh lát cắt được tiêm trực tiếp vào Follow-up Prompt với chỉ thị bắt buộc AI duy trì tính nhất quán 100% với bài luận VIP đã xuất bản.
- **Định dạng stream:** `text/event-stream`
- **Sự kiện phát:**
  - `context_meta`: Sự kiện metadata ngữ cảnh phát ở đầu luồng stream:
    ```json
    {
      "type": "context_meta",
      "activeSectionId": "tu_vi_ch_2",
      "activeSectionTitle": "QUAN LỘC - TÀI BẠCH - ĐIỀN TRẠCH",
      "matchedSections": [
        { "id": "tu_vi_ch_2", "title": "QUAN LỘC - TÀI BẠCH...", "score": 4.2 },
        { "id": "tu_vi_ch_1", "title": "MỆNH - THÂN - PHÚC...", "score": 3.8 }
      ]
    }
    ```
  - `chunk`: Chứa văn bản stream thời gian thực từ AI (`{ "chunk": "..." }`).
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
  - **Query parameters (Tùy chọn):**
    - `limit`: Số lượng bản ghi tối đa (mặc định: 50).
    - `startDate`: Ngày bắt đầu lọc (định dạng `YYYY-MM-DD`).
    - `endDate`: Ngày kết thúc lọc (định dạng `YYYY-MM-DD`).
- **Lấy chi tiết một bản ghi:**
  `GET /api/history/:system/record/:id`
- **Đánh giá bản ghi:**
  `PUT /api/history/:system/:id/rate` (Body: `{ "rating": 5, "feedback": "Rất chính xác" }`)
- **Liên kết lịch sử khách (Guest Link):**
  `PUT /api/history/:system/:id/link` (Liên kết bản ghi của khách vãng lai vào tài khoản vừa đăng nhập).
- **Xóa bản ghi (Soft Delete):**
  `DELETE /api/history/calculations/:type/:id` (Với `:type` là `iching`, `bazi`, `ziwei`, `marriage`).
  - Hệ thống thực hiện xóa mềm (Soft Delete) bằng cách đặt cờ `isDeleted` thành `true` để ẩn khỏi danh sách lịch sử của người dùng nhưng vẫn giữ nguyên dữ liệu gốc ở phía máy chủ.
  - Nếu bản ghi Bát Tự hoặc Tử Vi bị xóa trùng với lá số bản thân đã liên kết của người dùng, hệ thống sẽ tự động hủy liên kết (`ownBaziRecordId` hoặc `ownZiweiRecordId` đặt về `null`).
- **Bật/Tắt chia sẻ công khai bản ghi:**
  `PUT /api/history/calculations/:type/:id/public` (Với `:type` là `iching`, `bazi`, `ziwei`, `marriage`).
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "isPublic": true }` (hoặc `false`)
  - **Phản hồi (200):** `{ "success": true, "message": "Cập nhật trạng thái chia sẻ công khai thành công.", "isPublic": true }`
  - Tự động gọi Google Indexing API để gửi yêu cầu ping thu thập dữ liệu (khi bật) hoặc gỡ bỏ lập chỉ mục (khi tắt).

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

## 📅 7. Xem Ngày & Giờ Hoàng Đạo (Trạch Cát) (`/api/date`) & Thuật Ngữ (`/api/concept`)

Chức năng chạy in-memory, phục vụ xem ngày cát hung và tư vấn khoảng thời gian hoàng đạo phù hợp với tuổi. Không lưu trữ thông tin vào cơ sở dữ liệu. Kết quả tính toán mang tính tiền định (deterministic) và được tự động lưu đệm qua `MemoryCacheService` (L1 RAM + L2 Redis) với TTL 24 giờ (`24 * 3600 * 1000` ms) cho phản hồi tức thì < 1ms khi có truy vấn trùng khớp.

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

### 7.4 Cuốn Lịch Cá Nhân Hóa Theo Tháng (Personalized Almanac Month Calendar)
Tính toán và tổng hợp bức tranh năng lượng cả tháng kèm chi tiết từng ngày, hỗ trợ 2 phiên bản (Theo Năm Sinh Cơ Bản hoặc Theo Bát Tự Nâng Cao).
- **Endpoint:** `POST /api/date/almanac/month-calendar`
- **Quyền hạn:** `optionalAuth`:
  - `mode: "year"`: **Miễn phí & Công khai**, khách vãng lai không cần đăng nhập vẫn sử dụng bình thường.
  - `mode: "bazi"`: **Bắt buộc Đăng nhập** (Bearer JWT Token). Nếu chưa đăng nhập sẽ trả về `401 Unauthorized`.
- **Body:**
  ```json
  {
    "year": 2026,
    "month": 9,
    "mode": "year",       // "year" (Cơ bản theo năm sinh/tuổi) | "bazi" (Nâng cao theo Tứ Trụ)
    "birthYear": 1995,    // Tùy chọn cho mode "year" (mặc định 1995 nếu không truyền)
    "userBirth": {        // Dùng cho mode "bazi" hoặc tra cứu tùy biến
      "year": 1995,
      "month": 11,
      "day": 15,
      "hour": 10,
      "minute": 30,
      "gender": 1
    }
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "year": 2026,
    "month": 9,
    "mode": "year",
    "overview": {
      "title": "Tháng Bình Hòa - Vững Vàng Cho Tuổi Ất Hợi",
      "lunarMonthCanChi": "Đinh Dậu",
      "strategyBadge": "Quân Bình Hòa",
      "actionableAdvice": [...],
      "precautions": [...]
    },
    "days": [
      {
        "solarDay": 21,
        "solarMonth": 9,
        "solarYear": 2026,
        "lunarDay": 11,
        "lunarMonth": 8,
        "canChiDay": "Mậu Tuất",
        "score": 57,
        "tag": "Tương Sinh Mệnh",
        "isToday": true,
        "isPast": false
      }
    ]
  }
  ```
- **Phản hồi Lỗi khi gọi mode Bát Tự mà chưa đăng nhập (401):**
  ```json
  {
    "success": false,
    "message": "Vui lòng đăng nhập để sử dụng phiên bản Bát Tự Nâng Cao"
  }
  ```

### 7.5 Chi Tiết Năng Lượng Ngày Cá Nhân Hóa (Personalized Almanac Day Detail)
Xem chi tiết điểm số, tương tác bản mệnh, top 3 giờ hoàng đạo hợp mệnh (loại trừ giờ xung chi) và gợi ý hành động/kiêng kỵ cho 1 ngày cụ thể.
- **Endpoint:** `POST /api/date/almanac/day-detail`
- **Quyền hạn:** `optionalAuth` (mode "year" công khai cho khách; mode "bazi" yêu cầu JWT token).
- **Body:**
  ```json
  {
    "solarDate": "2026-09-21",
    "mode": "year",       // "year" | "bazi"
    "birthYear": 1995,    // Dùng cho mode "year"
    "userBirth": {
      "year": 1995,
      "month": 11,
      "day": 15,
      "hour": 10,
      "minute": 30
    }
  }
  ```
- **Phản hồi (200):**
  ```json
  {
    "solarDate": "2026-09-21",
    "mode": "year",
    "score": 57,
    "tag": "Tương Sinh Mệnh",
    "bestHours": [
      { "hourName": "Giáp Dần", "timeRange": "03h - 05h", "deity": "Tư Mệnh" },
      { "hourName": "Bính Thìn", "timeRange": "07h - 09h", "deity": "Thanh Long" },
      { "hourName": "Canh Thân", "timeRange": "15h - 17h", "deity": "Kim Quỹ" }
    ],
    "dos": [...],
    "donts": [...]
  }
  ```

### 7.6 Tra cứu Thuật ngữ Cổ học & Phong thủy
- **Endpoint:** `GET /api/concept/:term`
- **Headers Phản hồi:** `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (lưu đệm CDN / Trình duyệt 24 giờ và hỗ trợ tái xác thực nền 7 ngày)
- **Tham số Đường dẫn (Params):**
  - `term`: Thuật ngữ cần tra cứu (ví dụ: `thap_than`, `chinh_tai`, `luc_hao`, `tuan_triet`, `dung_than`, ...)
- **Phản hồi Thành công (200):**
  ```json
  {
    "term": "dung_than",
    "title": "Dụng Thần (用神)",
    "category": "bazi",
    "description": "Là ngũ hành giữ vai trò cân bằng, cứu trợ cho thân chủ trong Bát Tự...",
    "examples": ["Thân nhược ấn thụ vi dụng", "Thân vượng thực thương tiết tú"]
  }
  ```
- **Phản hồi Lỗi (404):**
  ```json
  {
    "message": "Không tìm thấy thông tin cho thuật ngữ này."
  }
  ```

---

## ✍️ 8. Tin tức & Kiến thức Học thuật (`/api/blog`)

### 8.1 Lấy danh sách bài viết
- **Endpoint:** `GET /api/blog`
- **Query Params:**
  - `category` (tùy chọn): Lọc theo chủ đề bài viết (ví dụ: `iching`, `bazi`, hoặc chủ đề tự tạo như `ngũ hành`, `sức khỏe`). Mặc định `all` hoặc bỏ trống để lấy tất cả.
  - `search` (tùy chọn): Từ khóa tìm kiếm theo tiêu đề hoặc tóm tắt.
  - `page` (tùy chọn): Số trang hiển thị (mặc định: 1).
  - `limit` (tùy chọn): Số lượng bài viết mỗi trang (mặc định: 9).
  - `showAll` (tùy chọn, chỉ dành cho Admin): Gửi `true` để lấy toàn bộ bao gồm bản nháp và bài viết đã xóa mềm.

### 8.2 Lấy danh sách tất cả chủ đề (Categories) độc nhất
Tải danh sách các chủ đề (categories) hiện có đang được sử dụng trong các bài viết.
- **Endpoint:** `GET /api/blog/categories`
- **Phản hồi (200):**
  ```json
  {
    "success": true,
    "categories": ["bazi", "fengshui", "iching", "marriage", "ziwei", "ngũ hành", "sức khỏe"]
  }
  ```

### 8.3 Xem chi tiết bài viết (bằng Slug)
Tải chi tiết nội dung Markdown của bài viết và tự động tăng số lượt xem lên 1. Đồng thời trả về 3 bài viết liên quan cùng danh mục.
- **Endpoint:** `GET /api/blog/:slug`
- **Phản hồi (200):**
  ```json
  {
    "success": true,
    "post": {
      "_id": "0190cfba-4321-7000-8000-000000000001",
      "title": "Ý nghĩa sao Thái Tuế năm Bính Ngọ 2026",
      "slug": "y-nghia-sao-thai-tue-nam-binh-ngo-2026",
      "summary": "Phân tích chi tiết...",
      "content": "# Ý nghĩa sao Thái Tuế năm Bính Ngọ 2026\n\nNăm 2026 Bính Ngọ chi phối...",
      "category": "ziwei",
      "author": "Ban Quản Trị",
      "views": 43,
      "tags": ["Tử Vi", "Bính Ngọ", "Thái Tuế"],
      "isPublished": true,
      "isDeleted": false,
      "createdAt": "2026-07-20T08:00:00.000Z"
    },
    "related": [
      {
        "_id": "0190cfba-4321-7000-8000-000000000002",
        "title": "Cơ Bản Về Mệnh Số Tử Vi",
        "slug": "co-ban-ve-menh-so-tu-vi",
        "summary": "Tìm hiểu cách lập và luận đoán...",
        "category": "ziwei",
        "createdAt": "2026-07-15T09:00:00.000Z"
      }
    ]
  }
  ```

### 8.4 Tạo bài viết mới
Yêu cầu quyền Admin/Co-Admin.
- **Endpoint:** `POST /api/blog`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "title": "Cách hóa giải hạn Tam Tai năm 2026",
    "summary": "Tóm tắt các phương pháp khoa học dân gian...",
    "content": "# Hướng dẫn hóa giải Tam Tai...\n\nCác tuổi Thân, Tý, Thìn...",
    "category": "fengshui",
    "tags": "tam tai, phong thuy, 2026",
    "thumbnailUrl": "https://example.com/images/tam-tai.jpg",
    "isPublished": true
  }
  ```
- **Phản hồi (210):**
  ```json
  {
    "success": true,
    "post": {
      "_id": "0190cfba-abcd-7000-8000-000000000099",
      "title": "Cách hóa giải hạn Tam Tai năm 2026",
      "slug": "cach-hoa-giai-han-tam-tai-nam-2026",
      ...
    }
  }
  ```

### 8.5 Cập nhật bài viết
Yêu cầu quyền Admin/Co-Admin.
- **Endpoint:** `PUT /api/blog/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Tương tự tạo bài viết (các trường không truyền sẽ giữ nguyên).
- **Phản hồi (200):** Trả về `success: true` và thông tin bài viết đã cập nhật.

### 8.6 Xóa mềm bài viết
Yêu cầu quyền Admin/Co-Admin. Bài viết sẽ ẩn khỏi danh sách của người dùng thường nhưng không mất vĩnh viễn trong DB.
- **Endpoint:** `DELETE /api/blog/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Phản hồi (200):**
  ```json
  {
    "success": true,
    "message": "Đã xóa bài viết thành công (xóa mềm)."
  }
  ```

### 8.7 Khôi phục bài viết đã xóa mềm
Yêu cầu quyền Admin/Co-Admin.
- **Endpoint:** `POST /api/blog/:id/restore`
- **Headers:** `Authorization: Bearer <token>`
- **Phản hồi (200):**
  ```json
  {
    "success": true,
    "message": "Đã khôi phục bài viết thành công."
  }
  ```

#### 8.8 Dynamic XML Sitemap (SEO)
Lấy sơ đồ trang web động phục vụ Googlebot lập chỉ mục.
- **Endpoint:** `GET /sitemap.xml` (ở root level của website)
- **Phản hồi (200):** Nội dung XML sitemap chuẩn UTF-8 (`Content-Type: application/xml; charset=utf-8`). Tự động gom các URL tĩnh chính, các bài viết Blog đã phát hành, và toàn bộ quẻ dịch/lá số đã được người dùng bật chế độ chia sẻ công khai (`isPublic: true`).

---

## 9. Xuất Bản Tệp PDF Học Thuật (Export PDF API)

Hỗ trợ kết xuất tài liệu PDF chuẩn A4 (Eastern Imperial Luxury) cho 4 phân hệ: Bát Tự (`bazi`), Tử Vi (`ziwei`), Kinh Dịch (`iching`), và Hợp Hôn (`marriage`).

### 9.1 Xuất tệp PDF theo phân hệ và phạm vi (Scope)
- **Endpoint:** 
  - `GET /api/export/pdf/:type/:id?scope=...&token=...`
  - `POST /api/export/pdf/:type/:id`
- **Rate Limit:** Tối đa 5 lượt xuất PDF / phút / IP hoặc tài khoản (`pdfExportLimiter`).
- **Xác thực & Phân quyền:**
  - Lá số công khai (`isPublic: true`): Cho phép khách vãng lai và mọi người dùng tải về không cần đăng nhập.
  - Lá số riêng tư (`isPublic: false`): **Nghiêm ngặt chỉ chính chủ sở hữu** (`currentUserId === record.userId`) mới được tải. Từ chối người dùng khác với mã lỗi `403 Forbidden` (hoặc `401 Unauthorized` nếu chưa đăng nhập).
- **Tham số Đường dẫn (Params):**
  - `type`: `bazi` | `ziwei` | `iching` | `marriage`
  - `id`: UUIDv7 của bản ghi cần xuất
- **Tham số Phân đoạn (Scope):**
  - Qua Query: `?scope=bazi_pillars,bazi_dayun` (chuỗi phân cách dấu phẩy) hoặc `?scope=all`
  - Qua Body (POST): `{ "scope": ["bazi_pillars", "bazi_dayun", "ch1", "ch2"] }`
  - **Quy tắc Kiểm tra Rỗng:** Nếu danh sách `scope` rỗng hoặc không chọn mục nào, API từ chối với mã lỗi `400 Bad Request` (`Vui lòng chọn ít nhất 1 mục nội dung cần xuất PDF`).
- **Phạm vi Phân đoạn Hợp lệ Theo Phân hệ:**
  - **Bát Tự:** `bazi_pillars`, `bazi_dayun`, `bazi_wuxing`, `bazi_shensha`, `nhat_chu`, `ch1`..`ch6`, `harmonizer`, `intro`, `all_interpretation`
  - **Tử Vi:** `ziwei_grid`, `ch1`..`ch15`, `intro`, `all_interpretation`
  - **Kinh Dịch:** `iching_hexagram`, `iching_table`, `iching_analysis`, `iching_ungky`, `ch1`..`ch4`, `intro`, `all_interpretation`
  - **Hợp Hôn:** `marriage_compare`, `intro`, `all_interpretation`
- **Phản hồi Thành công (200):**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="<Ten_Tep>.pdf"`
  - `X-Request-ID: <UUIDv7>`
  - `X-PDF-Cache: HIT | MISS`
  - Binary Stream của tệp PDF chuẩn in ấn A4.
- **Phản hồi Lỗi:**
  - `400 Bad Request`: Hệ thống không hợp lệ hoặc `scope` rỗng.
  - `401 Unauthorized`: Bản ghi riêng tư nhưng người dùng chưa đăng nhập.
  - `403 Forbidden`: Người dùng không phải chủ sở hữu của bản ghi riêng tư.
  - `404 Not Found`: Không tìm thấy bản ghi tương ứng hoặc bản ghi đã bị xóa mềm.
  - `429 Too Many Requests`: Vượt quá hạn mức 5 request/phút.

---

## 10. Động Cơ Đọc Âm Thanh & Text-to-Speech (`/api/tts`)

Hỗ trợ chuyển đổi văn bản luận giải thành giọng đọc tiếng Việt Studio 96kbps Neural MP3 cao cấp (Microsoft Edge Neural TTS kết hợp SSML Prosody phong thủy), đem lại trải nghiệm đàm đạo tự nhiên, ấm áp, thong thả và có nhịp thở thuần Việt.

### 10.1 Tổng hợp giọng đọc Studio 96kbps (Audio Synthesize)
- **Endpoint:** `GET /api/tts`
- **Query Parameters:**
  - `text` (string, required): Đoạn văn bản cần đọc (tối đa 600 ký tự).
  - `voice` (string, optional, mặc định `hoaimy`): Hồ sơ giọng đọc:
    - `hoaimy`: Nữ - Truyền Cảm (Studio VTV, `vi-VN-HoaiMyNeural`, rate `-6%`, pitch `0Hz`)
    - `namminh`: Nam - Trầm Ấm (Studio VTV, `vi-VN-NamMinhNeural`, rate `-8%`, pitch `-2Hz`, giọng Thầy luận đàm)
    - `huonggiang`: Nữ - Sâu Lắng (Radio Thiền Định, `vi-VN-HoaiMyNeural`, rate `-12%`, pitch `-1Hz`)
    - `ngocmai`: Nữ - Ngọt Ngào (Studio, `vi-VN-HoaiMyNeural`, rate `-5%`, pitch `+1Hz`)
  - `lang` (string, optional, mặc định `vi`): Mã ngôn ngữ phát âm.
- **Cơ chế Tiền Xử Lý & SSML Prosody Học Thuật:**
  - Tự động chuyển đổi các ký hiệu đặc biệt (`&` -> `và`, `%` -> `phần trăm`, `/` -> `trên/hoặc`, `SWOT` -> `ma trận thế mạnh điểm yếu`, `Cụm I - V` -> `Cụm 1 - 5`).
  - Chèn nhịp nghỉ thở tự nhiên (`<break time="180ms - 300ms"/>` tại dấu phẩy, hai chấm, chấm phẩy, dấu gạch ngang, dấu ba chấm).
- **Bảo Vệ Tài Nguyên & Rate Limiting:** Bảo vệ bằng `ttsLimiter` (tối đa 20 yêu cầu / 1 phút) để chống lạm dụng băng thông mạng và CPU máy chủ.
- **Tính năng & Hiệu năng:**
  - Định dạng Audio Studio: `OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3` (gấp đôi bitrate cũ, triệt tiêu tiếng kim loại).
  - Đệm tệp tạm thời trên ổ cứng SSD (`backend/scratch/tts_cache`), zero Node.js RAM heap footprint, phản hồi tức thì < 5ms khi phát lại qua Linux Page Cache.
  - Tự động dọn dẹp các tệp MP3 hết hạn sau 24 giờ qua background sweep timer (unref).
  - Browser Cache Header `Cache-Control: public, max-age=86400` (lưu đệm cục bộ tại trình duyệt người dùng trong 24 giờ).
  - Kiến trúc Fallback đa tầng: SSML Edge Neural -> Raw Edge Neural -> Google Translate TTS -> Native Web Speech API.
- **Phản hồi Thành công (200):**
  - Binary Stream âm thanh MP3 (`Content-Type: audio/mpeg`).
- **Phản hồi Lỗi:**
  - `400 Bad Request`: Thiếu tham số `text`.
  - `429 Too Many Requests`: Gửi yêu cầu quá 20 lần/phút.
  - `502 Bad Gateway`: Lỗi kết nối tới upstream TTS providers.

### 10.2 Tổng hợp một chương hoàn chỉnh thành 1 file MP3 liên tục (Chapter-Level Audio)
Tổng hợp trọn vẹn toàn bộ một chương luận giải thành một tệp MP3 đơn nhất, triệt tiêu hoàn toàn 100% độ trễ khựng giữa các câu, đảm bảo tính liên tục thông suốt tuyệt đối chuẩn Podcast / Radio chuyên nghiệp.
- **Endpoint:** `POST /api/tts/chapter` hoặc `GET /api/tts/chapter`
- **Rate Limit:** Áp dụng `ttsLimiter` (tối đa 20 yêu cầu / 1 phút).
- **Request Body (POST) hoặc Query Parameters (GET):**
  ```json
  {
    "content": "Toàn bộ văn bản markdown hoặc văn xuôi của chương...",
    "voice": "hoaimy",
    "sectionId": "iching_ch_1"
  }
  ```
  - `content` (string, required): Nội dung chi tiết của chương (hỗ trợ văn bản dài ~3.000 - 6.000 từ).
  - `voice` (string, optional, mặc định `hoaimy`): `hoaimy` | `namminh` | `huonggiang` | `ngocmai`.
  - `sectionId` (string, optional): Khóa định danh phân đoạn để tối ưu hóa bộ đệm.
- **Cơ chế Xử Lý Chuyên Sâu:**
  - Tự động làm sạch định dạng Markdown (`cleanChapterMarkdown`): Chuyển bảng Markdown thành văn xuôi, phiên âm đắc hãm Tử Vi, loại bỏ metadata máy đọc `---UNGKYSTART--- ... ---UNGKYEND---`, chuyển từ "VIP" sang "chuyên sâu".
  - Thuật toán phân tách ngữ nghĩa an toàn (`splitTextIntoSemanticChunks` ~650 ký tự) để chống tràn bộ đệm WebSocket của Microsoft Edge TTS.
  - Ghép nối nhị phân nguyên khối (`Buffer.concat`) tại bộ nhớ máy chủ thành 1 stream MP3 liên tục (0.00ms gap, ngữ điệu thông suốt).
  - Bộ đệm lưu trữ tệp đĩa SSD (`backend/scratch/tts_cache`) với cơ chế hỗ trợ HTTP 206 Partial Content (tua âm thanh mượt mà) và không làm phình bộ nhớ RAM Node.js heap.
  - Tự động nạp trước (Prefetching) chương kế tiếp $k+1$ vào RAM Client khi chương $k$ đang phát ở chế độ Nghe Toàn Bài.
- **Phản hồi Thành công (200 / 206):**
  - `Content-Type: audio/mpeg`
  - `Accept-Ranges: bytes`
  - `Cache-Control: public, max-age=86400`
  - Binary Stream của file MP3 chương (hoặc chunk byte Range 206).
- **Phản hồi Lỗi:**
  - `400 Bad Request`: Nội dung chương rỗng hoặc không hợp lệ.
  - `429 Too Many Requests`: Vượt quá hạn mức 20 yêu cầu/phút.
  - `500 Internal Server Error`: Lỗi hệ thống khi tổng hợp âm thanh.

### 10.3 Khởi tạo Vé Truyền Phát Trực Tiếp (Streaming Audio Ticket)
Tạo vé truyền phát âm thanh tức thì trong 2ms để Audio Element của trình duyệt kết nối trực tiếp với luồng stream âm thanh, khởi động giọng đọc trong < 1.0s.
- **Endpoint:** `POST /api/tts/ticket`
- **Rate Limit:** Áp dụng `ttsLimiter` (tối đa 20 yêu cầu / 1 phút).
- **Request Body:**
  ```json
  {
    "content": "Toàn bộ văn bản markdown hoặc văn xuôi của chương...",
    "voice": "hoaimy",
    "sectionId": "bazi_ch_1"
  }
  ```
- **Phản hồi Thành công (200):**
  ```json
  {
    "success": true,
    "ticketId": "hoaimy_bazi_ch_1_a1b2c3d4e5f6g7h8",
    "streamUrl": "/api/tts/stream/hoaimy_bazi_ch_1_a1b2c3d4e5f6g7h8",
    "isCached": false
  }
  ```

### 10.4 Truyền Phát Âm Thanh Trực Tiếp Theo Vé (Live Chunked Audio Streaming & HTTP 206 Partial Content)
Truyền phát trực tiếp dòng âm thanh MP3 (chunked transfer) tới Audio Element của trình duyệt. Trình duyệt nhận gói âm thanh đầu tiên trong ~300ms - 500ms và phát tiếng ngay lập tức (< 1.0s), không phải chờ tải toàn bộ file. Hỗ trợ chuẩn HTTP 206 Partial Content cho phép trình duyệt tua âm thanh mượt mà tới bất kỳ thời điểm nào.
- **Endpoint:** `GET /api/tts/stream/:ticketId`
- **Request Headers (Optional):**
  - `Range`: `bytes=start-end` (Yêu cầu khung dữ liệu âm thanh từ phía trình duyệt để thực hiện thao tác tua / seek).
- **Headers Phản Hồi:**
  - `Content-Type: audio/mpeg`
  - `Transfer-Encoding: chunked` (khi stream trực tiếp) hoặc `Content-Length` (khi phát từ Disk Cache).
  - `Accept-Ranges: bytes` (Khai báo hỗ trợ tua dữ liệu byte).
  - `Content-Range: bytes start-end/total` (Khi nhận Range request từ client, phản hồi mã `206 Partial Content`).
  - `Access-Control-Allow-Origin: *` (Hỗ trợ Web Audio API Mastering kết nối đa tầng DSP).
  - `Cache-Control: public, max-age=86400`

---

## 📄 11. Xuất Bản Hồ Sơ PDF Học Thuật (`/api/export`)

Hệ thống cung cấp dịch vụ kết xuất đồ hình lá số và toàn văn bài luận giải AI ra tài liệu PDF khổ A4 tiêu chuẩn in ấn (Imperial Style).
Để bảo vệ tài nguyên CPU và bộ nhớ máy chủ trong môi trường tải cao, tiến trình Puppeteer Chromium được điều tiết bởi **Semaphore FIFO Queue** (tối đa 2 tác vụ render song song, hàng đợi chờ tối đa 20 tác vụ, timeout 30s) kết hợp **Bộ đệm tệp SSD** (`backend/scratch/pdf_cache/{hash}.pdf`, TTL 24h).

### 11.1 Xuất Tệp PDF Hồ Sơ Học Thuật
- **Endpoint:** `POST /api/export/pdf/:type/:recordId`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `type` (string, bắt buộc): Phân hệ cần xuất (`bazi` | `ziwei` | `iching` | `marriage`).
  - `recordId` (string, bắt buộc): Mã định danh UUIDv7 của bản ghi cần xuất.
- **Request Body:**
  ```json
  {
    "scope": [
      "cover",
      "bazi_pillars",
      "bazi_dayun",
      "bazi_wuxing",
      "bazi_shensha",
      "nhat_chu",
      "ch1",
      "ch2",
      "ch3",
      "ch4",
      "ch5",
      "ch6",
      "harmonizer"
    ]
  }
  ```
  - `scope` (array of string, tùy chọn): Danh sách các phân mục cần xuất. Mặc định nếu để trống hoặc không truyền sẽ xuất toàn bộ các mục có trong bản ghi.
- **Headers Phản hồi:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="[LoaiLaSo]_[Ten]_[RecordId].pdf"`
  - `Cache-Control: public, max-age=86400`
- **Mã lỗi đặc biệt:**
  - `400 Bad Request`: Thiếu hoặc sai định dạng tham số `type`, `recordId`.
  - `401 / 403`: Chưa xác thực hoặc không có quyền truy cập bản ghi riêng tư.
  - `404 Not Found`: Không tìm thấy bản ghi.
  - `503 Service Unavailable`: Hàng đợi máy chủ đang quá tải (vượt quá 20 yêu cầu chờ tạo PDF song song). Phản hồi gợi ý người dùng thử lại sau 30-60 giây.
  - `504 Gateway Timeout`: Hàng đợi xử lý bị quá thời gian chờ (30 giây) do tài nguyên kết xuất Chromium quá tải.


---

## 🩺 12. Kiểm Tra Trạng Thái & Giám Sát Hệ Thống (`/health`)

Cung cấp các endpoint phục vụ Load Balancer (AWS ALB, Docker Healthcheck) và giám sát hạ tầng thời gian thực (Observability).

### 12.1 Health Check Cơ Bản (Liveness / Readiness Probe)
Phục vụ Load Balancer (AWS ALB, Kubernetes, Docker) kiểm tra tính sẵn sàng của phiên bản ứng dụng. Kiểm tra kết nối MongoDB thực tế (không trả về 200 giả mạo).
- **Endpoint:** `GET /health`
- **Xác thực:** Không yêu cầu (Public).
- **Phản hồi thành công (200 OK):** Khi ứng dụng hoạt động và MongoDB kết nối sẵn sàng (`readyState === 1`).
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-12T17:00:00.000Z"
  }
  ```
- **Phản hồi thất bại (503 Service Unavailable):** Khi MongoDB mất kết nối (`readyState !== 1`), giúp Load Balancer lập tức loại bỏ container lỗi ra khỏi Target Group.
  ```json
  {
    "status": "degraded",
    "error": "Database connection not ready",
    "timestamp": "2026-09-12T17:00:00.000Z"
  }
  ```

### 12.2 Giám Sát Chỉ Số Chi Tiết (Detailed Metrics Probe)
Cung cấp bức tranh toàn cảnh về tài nguyên hệ thống, độ trễ mạng thực tế của cơ sở dữ liệu/Redis và hàng đợi thư phục vụ DevOps và Admin Dashboard.
- **Endpoint:** `GET /health/detailed`
- **Xác thực:** Không yêu cầu (hoặc có thể bọc qua reverse proxy/firewall cho monitoring nội bộ).
- **Phản hồi (200 OK hoặc 503 Service Unavailable):**
  ```json
  {
    "status": "healthy",
    "uptimeSeconds": 1254,
    "timestamp": "2026-09-15T18:00:00.000Z",
    "database": {
      "status": "connected",
      "readyState": 1,
      "host": "localhost",
      "name": "phongthuy",
      "latencyMs": 2
    },
    "redis": {
      "status": "connected",
      "latencyMs": 1
    },
    "queue": {
      "active": 0,
      "dlq": 0,
      "isConnected": true
    },
    "memory": {
      "rss": "85MB",
      "heapTotal": "42MB",
      "heapUsed": "31MB",
      "external": "5MB"
    },
    "sse": {
      "adminClients": 1,
      "uniqueUsers": 12,
      "totalUserSessions": 15
    }
  }
  ```

---

## 📬 13. Quản Trị Hàng Đợi Email & Dead Letter Queue (`/api/admin/system/queue`)

Hệ thống cung cấp API dành riêng cho Quản trị viên (Admin) để giám sát và xử lý các email gặp sự cố mạng/SMTP trong hàng đợi.

### 13.1 Lấy Trạng Thái Hàng Đợi & Danh Sách Thư Lỗi (DLQ)
- **Endpoint:** `GET /api/admin/system/queue?limit=50`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Phản hồi (200 OK):**
  ```json
  {
    "success": true,
    "queue": {
      "active": 0,
      "dlq": 1,
      "isConnected": true
    },
    "dlqJobs": [
      {
        "id": "018e45f2-9c3a-7a54-b611-9a706591024a",
        "to": "user@example.com",
        "subject": "Nhắc Nhở Ứng Kỳ Gieo Quẻ",
        "html": "<p>...</p>",
        "attempts": 3,
        "maxAttempts": 3,
        "createdAt": 1726410000000,
        "lastError": "SMTP connection timeout"
      }
    ]
  }
  ```

### 13.2 Thử Lại Thư Trong Dead Letter Queue (Retry DLQ Job)
Chuyển một job từ DLQ quay trở lại hàng đợi chính `queue:emails` và đặt lại số lần thử `attempts = 0`.
- **Endpoint:** `POST /api/admin/system/queue/dlq/retry`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Request Body:**
  ```json
  {
    "jobId": "018e45f2-9c3a-7a54-b611-9a706591024a"
  }
  ```
- **Phản hồi (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đã đưa job 018e45f2-9c3a-7a54-b611-9a706591024a trở lại hàng đợi chính."
  }
  ```

### 13.3 Dọn Dẹp Toàn Bộ Dead Letter Queue (Clear DLQ)
Xóa vĩnh viễn toàn bộ thư lỗi lưu trữ trong `queue:emails:dlq`.
- **Endpoint:** `DELETE /api/admin/system/queue/dlq`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Phản hồi (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đã dọn dẹp toàn bộ job trong DLQ."
  }
  ```

---

## 🩺 14. Giám Sát Sức Khỏe Máy Chủ & Hạ Tầng (Health Checks & Observability)

### 14.1 Liveness Health Check (Ping)
Dành cho Load Balancer (AWS ALB / Nginx), Docker Healthcheck và các công cụ Uptime Monitor bên ngoài.
- **Endpoints:** `GET /health` hoặc `GET /api/health`
- **Xác thực:** Công khai (Không yêu cầu JWT).
- **Phản hồi (200 OK):**
  ```text
  ok
  ```

### 14.2 Detailed System Health & Metrics Observability
Cung cấp bức tranh toàn cảnh về sức khỏe của Node.js process, MongoDB, Redis, Email Queue và SSE sessions.
- **Endpoints:** `GET /health/detailed` hoặc `GET /api/health/detailed`
- **Xác thực:** Công khai (Hoặc tích hợp vào Dashboard Quản trị).
- **Phản hồi (200 OK):**
  ```json
  {
    "status": "healthy",
    "uptimeSeconds": 3600,
    "timestamp": "2026-09-15T16:30:00.000Z",
    "database": {
      "status": "connected",
      "readyState": 1,
      "host": "ac-jk9y7ee-shard-00-00.a5rqrhx.mongodb.net",
      "name": "phongthuy",
      "latencyMs": 64
    },
    "redis": {
      "status": "connected",
      "latencyMs": 1
    },
    "queue": {
      "active": 0,
      "dlq": 0,
      "isConnected": true
    },
    "memory": {
      "rss": "119MB",
      "heapTotal": "52MB",
      "heapUsed": "44MB",
      "external": "22MB"
    },
    "sse": {
      "adminClients": 1,
      "uniqueUsers": 2,
      "totalUserSessions": 4
    }
  }
  ```

---

## 📅 15. Phân Hệ Trạch Cát & Lịch Vạn Niên Bát Tự Cá Nhân Hóa (`/api/date`)

Cung cấp công cụ tra cứu ngày hoàng đạo, chọn ngày đẹp theo công việc và cuốn lịch vạn niên Bát Tự cá nhân hóa toàn diện dựa trên Nhật Chủ, Thập Thần, Dụng Thần và Hợp Xung Chi.

### 15.1 Ma Trận Lịch Tháng Vạn Niên Cá Nhân Hóa (Personalized Month Calendar)
- **Endpoint:** `POST /api/date/almanac/month-calendar`
- **Xác thực:** Tùy chọn (`optionalAuth`). Cho phép cả khách vãng lai (khai báo ngày sinh qua body) lẫn người dùng đã đăng nhập (tự động lấy lá số Bát tự bản thân).
- **Body Request:**
  ```json
  {
    "year": 2026,
    "month": 9,
    "baziInfo": {
      "solarDate": "1994-10-24",
      "time": "10:30",
      "gender": "male"
    }
  }
  ```
- **Phản hồi (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "year": 2026,
      "month": 9,
      "userBazi": {
        "dayMaster": "Giáp",
        "dayMasterElement": "Mộc",
        "dayBranch": "Tuất",
        "dungThan": ["Mộc", "Hỏa"],
        "kyThan": ["Kim"]
      },
      "monthOverview": {
        "lunarMonthName": "Tháng Bính Thân (Bính Ngọ)",
        "energyStatus": "balanced",
        "score": 75,
        "thapThan": "Thực Thần",
        "summary": "Tháng Bính Thân mang năng lượng của đất trời luân chuyển...",
        "favors": ["Lập kế hoạch công việc và tài chính rõ ràng", "..."],
        "cautions": ["Tránh các quyết định bốc đồng khi chưa khảo sát kỹ", "..."]
      },
      "days": [
        {
          "solarDate": "2026-09-01",
          "solarDay": 1,
          "lunarDay": 20,
          "lunarMonth": 7,
          "lunarYear": 2026,
          "lunarDayStr": "20",
          "isFirstOrFullMoon": false,
          "dayCanChi": "Mậu Tý",
          "thapThan": "Thiên Tài",
          "score": 85,
          "tier": "auspicious",
          "badge": "Đại Cát",
          "isAuspicious": true,
          "isClash": false,
          "highlights": ["Tương Hợp ngũ hành", "Năng lượng hanh thông"]
        }
      ]
    }
  }
  ```
- **Caching:** Đệm Redis L2 trong 12 giờ theo khóa `almanac:month:${userId || 'guest'}:${baziKey}:${year}:${month}`.

### 15.2 Chi Tiết Ngày & Giờ Hoàng Đạo Cá Nhân Hóa (Personalized Day Detail)
- **Endpoint:** `POST /api/date/almanac/day-detail`
- **Xác thực:** Tùy chọn (`optionalAuth`).
- **Body Request:**
  ```json
  {
    "date": "2026-09-21",
    "baziInfo": {
      "solarDate": "1994-10-24",
      "time": "10:30",
      "gender": "male"
    }
  }
  ```
- **Phản hồi (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "solarDate": "2026-09-21",
      "dayCanChi": "Mậu Thìn",
      "lunarDateStr": "11/08/2026",
      "score": 88,
      "tier": "auspicious",
      "badge": "Đại Cát",
      "thapThan": "Thiên Tài",
      "goldenHours": [
        { "name": "Dần", "time": "03:00 - 05:00", "isPersonalizedGood": true },
        { "name": "Thìn", "time": "07:00 - 09:00", "isPersonalizedGood": true },
        { "name": "Tỵ", "time": "09:00 - 11:00", "isPersonalizedGood": true }
      ],
      "dos": ["Khai trương mở cửa hàng", "Ký kết văn bản giao dịch", "..."],
      "donts": ["Kiện tụng tranh chấp", "Đào giếng, động thổ mạnh", "..."],
      "highlights": ["Ngày Lục Hợp với tuổi bản mệnh", "Trợ lực cát khí Dụng Thần"]
    }
  }
  ```
