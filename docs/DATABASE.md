# 🗄️ DATABASE.md - Thiết kế Cơ sở Dữ liệu (MongoDB Schemas)

Hệ thống sử dụng **MongoDB** làm cơ sở dữ liệu chính, được quản lý thông qua **Mongoose (v9)**. 

---

## 🔑 1. Quy tắc Thiết kế Khóa chính & Chỉ mục (Indexes)
- **UUIDv7 làm Khóa chính:** Mọi tài liệu (document) đều ghi đè trường `_id` mặc định bằng chuỗi sinh ra từ thuật toán **UUIDv7** để đảm bảo tính sắp xếp theo thời gian tốt hơn và tránh bị đoán định ID tuần tự.
- **Xóa mềm (Soft Delete):** Hầu hết các tài liệu nghiệp vụ đều sử dụng cờ `isDeleted: { type: Boolean, default: false }` kết hợp với trạng thái `status: { type: String, enum: ['active', 'locked'] }`.
- **Compound Indexes:** Được thiết lập sẵn trên các trường truy vấn thường xuyên như `userId`, `createdAt`, và cờ trạng thái để tối ưu hóa hiệu năng tìm kiếm của MongoDB.

---

## 📐 2. Đặc tả Chi tiết các Bảng Dữ liệu (Collections)

### 2.1 Bảng Người dùng (`users`)
Lưu trữ thông tin tài khoản, hồ sơ Bát Tự mặc định, số dư credit và thống kê sử dụng token AI.
- **Model:** [User.js](file:///t:/Phongthuy/backend/src/models/User.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, default: 'User' },
    phone: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailOtp: { type: String, default: null },
    emailOtpExpires: { type: Date, default: null },
    gender: { type: Number, default: 1 }, // 1: Nam, 0: Nữ
    role: { type: String, enum: ['admin', 'co-admin', 'vip', 'user'], default: 'user' },
    credits: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    lockReason: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    baziInfo: {
      day: Number, month: Number, year: Number, hour: Number, minute: Number
    },
    stats: {
      ichingCount: { type: Number, default: 0 },
      baziCount: { type: Number, default: 0 },
      ziweiCount: { type: Number, default: 0 },
      marriageCount: { type: Number, default: 0 },
      ichingTokens: { type: Number, default: 0 },
      baziTokens: { type: Number, default: 0 },
      ziweiTokens: { type: Number, default: 0 },
      marriageTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null }
    }
  }
  ```
- **Chỉ mục phụ:**
  - `{"stats.totalTokens": -1}`
  - `{isDeleted: 1, status: 1, role: 1, _id: -1}`

### 2.2 Bảng Kỷ lục Gieo Quẻ Kinh Dịch (`ichingrecords`)
Lưu trữ thông tin câu hỏi, quẻ chính/quẻ biến được gieo, snapshot dữ liệu Rule Engine và mảng Ứng Kỳ thông báo.
- **Model:** [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    question: { type: String, required: true },
    dateCast: { type: Date, default: Date.now },
    primaryHexagram: { type: Object, required: true },
    transformedHexagram: { type: Object, default: null },
    movingLines: [{ type: Number }],
    lunarDateInfo: { type: Object },
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: '' },
    aiInterpretation: {
      content: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      model: { type: String, default: "" },
      tokensUsed: { type: Number, default: 0 }
    },
    ungKy: [{
      lunarDay: { type: Number },
      lunarMonth: { type: Number, required: true },
      lunarYear: { type: Number, required: true },
      isMonthOnly: { type: Boolean, default: false },
      originalText: { type: String },
      status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
      solarDate: { type: Date, required: true },
      notified3Days: { type: Boolean, default: false },
      notified2Days: { type: Boolean, default: false },
      notified1Day: { type: Boolean, default: false }
    }],
    analysisSnapshot: { type: Object, default: null },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.3 Bảng Kỷ lục Lá số Bát Tự (`bazirecords`)
Lưu trữ thông tin lá số Tứ Trụ học thuật và các bài phân tích Dụng Thần cát hung của người dùng.
- **Model:** [BaziRecord.js](file:///t:/Phongthuy/backend/src/models/BaziRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    inputInfo: { date: String, time: String, gender: Number },
    solarTimeline: { type: String, required: true },
    tietKhiTimeline: { type: String, required: true },
    baziData: { type: Object, required: true },
    rating: { type: Number, default: null },
    aiInterpretation: { content: String, generatedAt: Date, tokensUsed: Number },
    analysisSnapshot: { type: Object, default: null },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.4 Bảng Kỷ lục Lá số Tử Vi (`ziweirecords`)
Lưu trữ thông số bản mệnh Tử Vi thô lập từ thư viện iztro và các bài giải đoán ngầm.
- **Model:** [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    inputInfo: { date: String, hour: Number, gender: String, school: String },
    chartHash: { type: String, required: true },
    chartData: { type: Object, required: true },
    rating: { type: Number, default: null },
    aiInterpretation: {
      content: String,
      summary: String,
      sections: Array,
      generatedAt: Date
    },
    analysisSnapshot: { type: Object, default: null },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.5 Bảng Kỷ lục Xem tuổi Kết Hôn (`marriagerecords`)
Lưu trữ kết quả so sánh Bát Tự và độ hòa hợp của hai đối tượng Nam và Nữ.
- **Model:** [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    inputInfo: {
      male: { date: String, time: String },
      female: { date: String, time: String }
    },
    maleBaziData: { type: Object, required: true },
    femaleBaziData: { type: Object, required: true },
    rating: { type: Number, default: null },
    aiInterpretation: { content: String, generatedAt: Date },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.6 Bảng Hội thoại dùng chung (`conversations`)
- **Model:** [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    system: { type: String, required: true, enum: ['iching', 'bazi', 'ziwei', 'marriage'] },
    recordId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    summary: { type: String, default: '' },
    summarizedMemory: { type: String, default: '' },
    totalTokens: { type: Number, default: 0 }
  }
  ```

### 2.7 Bảng Tin nhắn dùng chung (`messages`)
- **Model:** [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    conversationId: { type: String, required: true, ref: 'Conversation', index: true },
    role: { type: String, required: true, enum: ['user', 'ai'] },
    content: { type: String, required: true },
    structuredContent: {
      answer: String,
      timing: String,
      risk: String,
      dos: String,
      donts: String,
      confidence: Number
    },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  }
  ```

### 2.8 Các bảng hỗ trợ Quản trị & Hệ thống

#### a. Bảng Nhật ký Hệ thống (`systemlogs`)
Lưu trữ lịch sử thao tác của người dùng, IP, Endpoint và thời gian phản hồi.
- **Model:** [SystemLog.js](file:///t:/Phongthuy/backend/src/models/SystemLog.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    userId: { type: String, default: 'anonymous' },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    ip: { type: String, required: true },
    action: { type: String, required: true }, // Mô tả hành động bằng tiếng Việt
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    duration: { type: Number, required: true }, // thời gian xử lý (ms)
    tokensUsed: { type: Number, default: 0 },
    requestParams: { type: Object, default: null }, // tham số request đã lọc bỏ thông tin nhạy cảm
    timestamp: { type: Date, default: Date.now }
  }
  ```
- **Chỉ mục phụ:**
  - `{"timestamp": -1}`
  - `{"userId": 1, "timestamp": -1}`

#### b. Bảng Cảnh báo Quản trị (`adminnotifications`)
Các cảnh báo vi phạm chính sách hoặc sử dụng token đột biến gửi tới Admin.
- **Model:** [AdminNotification.js](file:///t:/Phongthuy/backend/src/models/AdminNotification.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    type: { type: String, enum: ['appeal', 'request_spike', 'token_spike'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Object, default: null }, // Chi tiết lỗi (IP, số lượng, userId...)
    status: { type: String, enum: ['unread', 'read'], default: 'unread' }
  }
  ```
- **Chỉ mục phụ:**
  - `{"status": 1, "createdAt": -1}`

#### c. Bảng Thông báo Người dùng (`notifications`)
Thông báo nhắc nhở sự kiện Ứng Kỳ gửi tới người dùng cuối.
- **Model:** [Notification.js](file:///t:/Phongthuy/backend/src/models/Notification.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, index: true },
    hexagramId: { type: String, ref: 'IChingRecord', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, default: 'ung_ky' }
  }
  ```

#### d. Bảng Đơn Khiếu nại (`banappeals`)
Đơn khiếu nại yêu cầu mở khóa tài khoản của người dùng bị khóa.
- **Model:** [BanAppeal.js](file:///t:/Phongthuy/backend/src/models/BanAppeal.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    reason: { type: String, required: true },  // Lý do khóa ban đầu
    message: { type: String, required: true }, // Nội dung giải trình của người dùng
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
  }
  ```
- **Chỉ mục phụ:**
  - `{"status": 1, "createdAt": -1}`

---

## 🔄 3. Cơ chế Trigger / Hooks cơ sở dữ liệu

- **Background User Stats Sync:**
  Các bảng dữ liệu chính (`IChingRecord`, `BaziRecord`, `ZiweiRecord`, `MarriageRecord`, `Conversation`) đều được thiết lập Mongoose **post-save hook** để kích hoạt cập nhật thống kê tài nguyên ngầm:
  ```javascript
  schema.post('save', function(doc) {
    if (doc.userId && doc.userId !== 'guest') {
      const UserStatsService = require('../services/UserStatsService');
      UserStatsService.updateUserStatsBackground(doc.userId);
    }
  });
  ```
  Hàm này sẽ tự động tổng hợp số lượt chạy, lượng token tiêu thụ và cập nhật vào trường `stats` của bảng `User` tương ứng.
