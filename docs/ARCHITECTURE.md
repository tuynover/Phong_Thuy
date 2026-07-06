# 🏛️ ARCHITECTURE.md - Kiến trúc Hệ thống

## 1. Sơ đồ Kiến trúc Tổng quan (High-Level Architecture)

Hệ thống hoạt động theo mô hình Client-Server rời rạc, giao tiếp thông qua RESTful API và Server-Sent Events (SSE) để truyền dữ liệu thời gian thực.

```mermaid
graph TD
    subgraph Frontend [React 19 & Vite]
        App[App.jsx] --> AuthCtx[AuthContext.jsx]
        App --> UserApp[UserApp.jsx]
        App --> AdminApp[AdminApp.jsx]
        
        UserApp --> IChingB[IChingBoard.jsx]
        UserApp --> BaziB[BaziBoard.jsx]
        UserApp --> ZiweiB[ZiweiBoard.jsx]
        UserApp --> MarriageB[MarriageBoard.jsx]
        UserApp --> HistoryB[HistoryBoard.jsx]
        UserApp --> ProfileB[ProfileBoard.jsx]
        
        IChingB --> CoinT[CoinToss.jsx] & MaiHoaIn[MaiHoaInput.jsx] & ManualIn[ManualInput.jsx]
        BaziB --> BaziIn[BaziInput.jsx]
        MarriageB --> MarriageIn[MarriageInput.jsx]
        ZiweiB --> ZiweiCh[ZiweiChart.jsx]
        
        IChingB & BaziB & ZiweiB & MarriageB --> ChatW[AiChatWidget.jsx]
        IChingB & BaziB & ZiweiB & MarriageB --> Tooltip[Tooltip.jsx]
        ChatW --> SecR[SectionRenderer.jsx]
        
        UserApp --> NotifB[NotificationBell.jsx]
        UserApp -.-> AuthModal[AuthModal.jsx]
        BaziB -.-> UpdBaziM[UpdateBaziModal.jsx]
    end

    subgraph Backend [Express.js v5]
        Routes[routes/index.js] --> Middleware{Middleware}
        Middleware --> AuthM[auth.js / adminAuth.js]
        Middleware --> CreditM[creditCheck.js]
        Middleware --> LogM[logging.js]
        Middleware --> RateLim[rateLimiter.js]
        
        AuthM & CreditM & LogM & RateLim --> Controllers[Controllers]
        
        Controllers --> AuthC[AuthController.js]
        Controllers --> IChingC[IChingController.js]
        Controllers --> BaziC[BaziController.js]
        Controllers --> ZiweiC[ZiweiController.js]
        Controllers --> MarriageC[MarriageController.js]
        Controllers --> AiC[AiInterpretationController.js]
        Controllers --> HistC[HistoryController.js]
        Controllers --> AdminC[AdminController.js]
        Controllers --> ConceptC[ConceptController.js]
        Controllers --> NotifC[NotificationController.js]
        
        Controllers --> Services[Services & Logic]
        
        Services --> RuleEng[RuleEngineService.js]
        Services --> BaziAna[BaziAnalyzer.js]
        Services --> ZiweiF[ZiweiFormatter.js]
        Services --> AiS[AiService.js]
        Services --> SseS[SseService.js]
        Services --> SchedS[NotificationScheduler.js]
        Services --> ConvCtxS[ConversationContextService.js]
        Services --> EmailS[EmailService.js]
        Services --> IChingDataS[IChingDataService.js]
        Services --> LoggerS[LoggerService.js]
        Services --> MemCacheS[MemoryCacheService.js]
        Services --> UserStatsS[UserStatsService.js]
        Services --> ZiweiCache[ZiweiCache.js]
        Services --> ZiweiVal[ZiweiValidators.js]
    end

    subgraph Database [MongoDB]
        Models[Mongoose Models]
        Models --> DB[(MongoDB Collections)]
    end

    Frontend -- REST APIs / HTTP --> Routes
    Frontend -- SSE Stream --> Routes
    Services --> Models
```

---

## 2. Luồng Xử lý Dữ liệu Chính (Core Data Flows)

### 2.1 Luồng Luận giải AI qua SSE (Kinh Dịch, Bát Tự, Tử Vi, Hợp Hôn)
Luồng này thực hiện truyền tải văn bản thời gian thực (Server-Sent Events) từ Google Gemini API tới Frontend cho tất cả các phân hệ học thuật:

```mermaid
sequenceDiagram
    participant User as Người dùng (Frontend)
    participant Ctrl as AiInterpretationController
    participant Credit as creditCheck (Middleware)
    participant AiS as AiService
    participant Gemini as Google Gemini API

    User->>Ctrl: POST /api/ai/:system/:id/interpret
    Ctrl->>Credit: Kiểm tra token & Trừ credit nguyên tử (-1)
    alt Credit hết hoặc Token sai
        Credit-->>User: Trả về lỗi 402 / 401
    else Hợp lệ
        Credit->>Ctrl: Next()
        Ctrl->>Ctrl: Đọc snapshot phân tích thô từ DB
        Ctrl->>AiS: Yêu cầu tạo Prompt & Gọi Stream
        AiS->>Gemini: Gửi Prompt (System Prompt + Snapshot + Lịch sử Chat)
        Gemini-->>AiS: Phản hồi Stream dữ liệu (SSE chunk)
        loop Truyền dữ liệu về Client
            AiS-->>User: Phát sự kiện 'message' chứa text chunk
            Note over User: Incremental JSON stream parser lọc nội dung
        end
        Note over User: Render Markdown & Hiển thị chỉ số bổ sung
    end
```

### 2.2 Đồng bộ hóa hoàn toàn các Luồng Luận giải AI
Tất cả các phân hệ Kinh Dịch, Bát Tự, Tử Vi và Hợp Hôn hiện nay đều đã chuyển sang chạy trực tiếp và phát dòng dữ liệu (SSE Stream) thời gian thực. Hạ tầng hàng đợi bất đồng bộ trước đây (`JobQueueService.js` và bảng dữ liệu `AstrologyJob`) đã bị **xóa bỏ hoàn toàn** để làm sạch dự án và tránh các mã nguồn dư thừa.

---

## 3. Các Middleware & Hệ thống Kiểm soát

Hệ thống Express.js sử dụng chuỗi Middleware để bảo vệ tài nguyên và ghi nhận nhật ký hành vi:

1. **`logging.js` (Audit Logging):**
   - Đánh chặn tất cả các yêu cầu.
   - Giải mã token để lấy thông tin Email, IP, Hành động thực tế, Thời gian xử lý.
   - Masking (ẩn) các thông tin nhạy cảm như mật khẩu trước khi lưu vào `SystemLog` trong MongoDB.
2. **`auth.js` / `adminAuth.js` (Authentication & Authorization):**
   - Xác thực JWT token từ Header Authorization `Bearer <token>` hoặc query parameter `?token=`.
   - Kiểm tra tài khoản có bị khóa (`status === 'locked'`) hoặc xóa mềm (`isDeleted === true`) không.
   - `adminAuth.js` đính kèm thêm helper `req.hasAuthorityOver(targetUser)` để ngăn Co-Admin thao tác trên Admin khác.
3. **`creditCheck.js` (Credit Quota Protection):**
   - Kiểm tra và trừ 1 credit nguyên tử trên tài khoản của người dùng trước khi chuyển tiếp yêu cầu tới AI.
   - Bỏ qua kiểm tra đối với các tài khoản Admin / Co-Admin.
4. **`rateLimiter.js` (Rate Limiting):**
   - Giới hạn tần suất gọi API (ví dụ: tối đa 30 lần lập lá số trong 15 phút, 20 lần gọi AI trong 15 phút) để tránh tấn công DDOS hoặc spam API tốn phí.

---

## 4. Cơ chế Đồng bộ & Realtime (Server-Sent Events)

Hệ thống triển khai dịch vụ [SseService.js](file:///t:/Phongthuy/backend/src/services/SseService.js) để duy trì kết nối thời gian thực:
- **Admin Channel (`/api/admin/events`):** Đăng ký các kết nối của Admin để cập nhật live hoạt động của người dùng, lượt chạy API, khiếu nại tài khoản.
- **User Channel (`/api/auth/events`):** Lắng nghe các thay đổi về quyền hạn (Role), số dư credit hoặc lệnh khóa tài khoản từ admin. Nếu tài khoản bị khóa hoặc xóa từ Admin Panel, Client sẽ nhận được sự kiện qua SSE và tự động thực hiện đăng xuất (F5/Clear localStorage) ngay lập tức.
- **SSE Keepalive Ping:** Mọi kết nối SSE đều được đăng ký vào vòng lặp heartbeat gửi gói tin trống `:\n\n` định kỳ 15 giây nhằm duy trì kết nối luôn sống qua các cổng reverse proxy.

---

## 5. Cơ chế Sao lưu & Đồng bộ Google Drive (Backup System)

Để bảo vệ tính toàn vẹn của dữ liệu người dùng, lá số đã gieo, lịch sử chat và tài khoản, hệ thống áp dụng cơ chế sao lưu độc lập ở cấp độ hạ tầng (Host-level Cronjob) thay vì tích hợp sâu vào tiến trình Node.js Backend.

### 5.1 Sơ đồ Quy trình Backup & Đồng bộ
```mermaid
graph TD
    Cron[OS Cron Daemon - 00:00] -->|Kích hoạt| BackupSh[backup.sh]
    BackupSh -->|Khởi chạy| MongoContainer[Docker Container mongo:8]
    MongoContainer -->|mongodump --uri| DB[(MongoDB Atlas)]
    DB -->|Xuất dữ liệu| RawBackup[Dữ liệu backup thô]
    BackupSh -->|Nén tar.gz| LocalArchive[mongodb_date.tar.gz]
    LocalArchive -->|Lưu cục bộ| LocalDir[Thư mục /backups - Giữ tối đa 7 file]
    
    BackupSh -->|Kích hoạt| UploadSh[upload_drive.sh]
    UploadSh -->|rclone copy| GDrive[(Google Drive: backup/mongo_atlas)]
    
    BackupSh -->|Kích hoạt| CleanSh[cleanup_drive.sh]
    CleanSh -->|rclone deletefile| GDrive
    Note over CleanSh: Chỉ giữ lại 30 file mới nhất trên Drive
```

### 5.2 Lợi ích Thiết kế Kiến trúc
- **Tách biệt Tiến trình (Process Isolation):** Tác vụ nén và upload tốn CPU/RAM được xử lý bởi cronjob hệ điều hành và chạy qua container Docker phụ trợ ngắn hạn, tránh hiện tượng nghẽn Event Loop của Express.js hoặc làm crash máy chủ web khi lượng dữ liệu lớn.
- **Tính tự lập cao:** Ngay cả khi Node.js Backend gặp sự cố ngừng hoạt động, tác vụ backup vẫn hoạt động độc lập và gửi dữ liệu lên đám mây bình thường.
- **Tiết kiệm tài nguyên:** Các container và tiến trình backup chỉ được sinh ra trong thời gian ngắn lúc 00:00 đêm và tự động bị tiêu hủy (`--rm`) ngay sau khi hoàn thành.
