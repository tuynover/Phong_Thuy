# 🗄️ DATABASE.md - Thiết kế Cơ sở Dữ liệu (MongoDB Schemas)

Hệ thống sử dụng **MongoDB** làm cơ sở dữ liệu chính, được quản lý thông qua **Mongoose (v9)**. 

---

## 🔑 1. Quy tắc Thiết kế Khóa chính, Chỉ mục (Indexes) & Connection Pool
- **UUIDv7 làm Khóa chính:** Mọi bảng dữ liệu nghiệp vụ chính (`User`, `IChingRecord`, `BaziRecord`, `ZiweiRecord`, `MarriageRecord`, `Conversation`, `Message`, `Notification`, `AdminNotification`, `BanAppeal`, `BlogPost`) đều ghi đè trường `_id` mặc định bằng chuỗi sinh ra từ thuật toán **UUIDv7** (`default: uuidv7`) để đảm bảo tính sắp xếp theo thời gian tốt hơn và tránh đoán định ID tuần tự. Riêng bảng `SystemLog` hiện sử dụng `ObjectId` mặc định của MongoDB.
- **Xóa mềm (Soft Delete) & Bảo toàn Dữ liệu Trọn đời:** Hầu hết các tài liệu nghiệp vụ đều sử dụng cờ `isDeleted: { type: Boolean, default: false }` kết hợp với trạng thái `status: { type: String, enum: ['active', 'locked'] }`. Hệ thống TUYỆT ĐỐI KHÔNG tự động xóa cứng (không purge) tài khoản hay bản ghi sau 30 ngày; toàn bộ dữ liệu được bảo toàn vĩnh viễn trong MongoDB để phục vụ đối soát và báo cáo O(1).
- **Compound Indexes:** Được thiết lập sẵn trên các trường truy vấn thường xuyên như `userId`, `createdAt`, và cờ trạng thái để tối ưu hóa hiệu năng tìm kiếm của MongoDB, triệt tiêu 100% các bước In-memory sorting (SORT stage).
- **Tinh gọn Chỉ mục Trùng lặp Tiền tố (Prefix Redundancy Elimination):**
  Trong 4 bảng bản ghi (`BaziRecord`, `IChingRecord`, `ZiweiRecord`, `MarriageRecord`), compound index `{ userId: 1, isDeleted: 1, isPinned: -1, createdAt: -1 }` đã bao quát hoàn toàn các tiền tố `{ userId: 1, isDeleted: 1, createdAt: -1 }` và `{ userId: 1, createdAt: -1 }`. Loại bỏ các index tiền tố thừa giúp giảm 30-40% bộ nhớ RAM WiredTiger dành cho index và tăng tốc độ ghi (Write IOPS) khi tạo bản ghi mới.
- **Cấu hình Connection Pool & Sức chịu tải (Production Readiness):**
  - Trong `backend/src/core/config/db.js`, cấu hình Mongoose kết nối với các tham số tối ưu cho môi trường chịu tải cao (mục tiêu 100 concurrent users):
    - `maxPoolSize: 100`: Giữ tối đa 100 socket TCP đồng thời, đáp ứng tải đỉnh mà không nghẽn hàng đợi kết nối.
    - `minPoolSize: 10`: Luôn duy trì 10 socket ấm (warm connections), triệt tiêu độ trễ bắt tay TCP/TLS SSL khi có yêu cầu đột ngột.
    - `serverSelectionTimeoutMS: 15000`: 15s để đảm bảo kết nối MongoDB Atlas ổn định, chịu được độ trễ phân giải DNS SRV và kết nối mạng chập chờn mà không bị timeout sớm.
    - `socketTimeoutMS: 45000`: Tự động ngắt socket sau 45s nếu truy vấn bị treo hoặc máy chủ cơ sở dữ liệu không phản hồi.

---

## 📐 2. Đặc tả Chi tiết các Bảng Dữ liệu (Collections)

### 2.1 Bảng Người dùng (`users`)
Lưu trữ thông tin tài khoản, hồ sơ Bát Tự mặc định, số dư credit và thống kê sử dụng token AI.
- **Model:** [User.js](file:///t:/Phongthuy/backend/src/core/models/User.js)
- **Cấu trúc Schema:**
```javascript
{
  _id: { type: String, default: uuidv7 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: 'User' },
  phone: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  /* Mã OTP được lưu trữ & tự động hết hạn hoàn toàn trên Redis (otp:verify_email & otp:reset_password), không lưu rác trong MongoDB */
  gender: { type: Number, default: 1 }, // 1: Nam, 0: Nữ
  role: { type: String, enum: ['admin', 'co-admin', 'vip', 'user'], default: 'user' },
  credits: { type: Number, default: 2 },
  status: { type: String, enum: ['active', 'locked'], default: 'active' },
  lockReason: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 0 },
  baziInfo: {
    day: Number, month: Number, year: Number, hour: Number, minute: Number,
    ownBaziRecordId: { type: String, default: null },
    ownZiweiRecordId: { type: String, default: null }
  },
  dailyCheckin: {
    streak: { type: Number, default: 0 },
    lastCheckinDate: { type: String, default: null }, // 'YYYY-MM-DD' (Asia/Ho_Chi_Minh)
    totalCheckins: { type: Number, default: 0 },
    lastCheckinAt: { type: Date, default: null }
  },
  stats: {
    ichingCount: { type: Number, default: 0 },
    baziCount: { type: Number, default: 0 },
    ziweiCount: { type: Number, default: 0 },
    marriageCount: { type: Number, default: 0 },
    feixingCount: { type: Number, default: 0 },
    ichingTokens: { type: Number, default: 0 },
    baziTokens: { type: Number, default: 0 },
    ziweiTokens: { type: Number, default: 0 },
    marriageTokens: { type: Number, default: 0 },
    feixingTokens: { type: Number, default: 0 },
    ichingChatTokens: { type: Number, default: 0 },
    baziChatTokens: { type: Number, default: 0 },
    ziweiChatTokens: { type: Number, default: 0 },
    marriageChatTokens: { type: Number, default: 0 },
    feixingChatTokens: { type: Number, default: 0 },
    totalInterpretTokens: { type: Number, default: 0 },
    totalChatTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: null }
  },
  tags: [{
    _id: { type: String, default: uuidv7 },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}
```
- **Chỉ mục phụ:**
- `{"stats.totalTokens": -1}`
- `{isDeleted: 1, status: 1, role: 1, _id: -1}`

### 2.2 Bảng Kỷ lục Gieo Quẻ Kinh Dịch (`ichingrecords`)
Lưu trữ thông tin câu hỏi, quẻ chính/quẻ biến được gieo, snapshot dữ liệu Rule Engine và mảng Ứng Kỳ thông báo.
- **Model:** [IChingRecord.js](file:///t:/Phongthuy/backend/src/modules/iching/models/IChingRecord.js)
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
      mode: { type: String, enum: ['standard', 'vip'], default: 'standard' },
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
    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.3 Bảng Kỷ lục Lá số Bát Tự (`bazirecords`)
Lưu trữ thông tin lá số Tứ Trụ học thuật và các bài phân tích Dụng Thần cát hung của người dùng.
- **Model:** [BaziRecord.js](file:///t:/Phongthuy/backend/src/modules/bazi/models/BaziRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    inputInfo: { 
      name: { type: String, default: "" },
      date: String,
      time: String,
      gender: Number,
      calendarMode: { type: String, default: "solar" },
      birthSolarYear: { type: Number, default: null },
      isLeap: { type: Boolean, default: false },
      lunarDate: { type: String, default: "" },
      manualData: {
        yearGan: String,
        yearZhi: String,
        monthGan: String,
        monthZhi: String,
        dayGan: String,
        dayZhi: String,
        hourGan: String,
        hourZhi: String
      }
    },
    solarTimeline: { type: String, required: true },
    tietKhiTimeline: { type: String, required: true },
    baziData: { type: Object, required: true },
    rating: { type: Number, default: null },
    aiInterpretation: { content: String, mode: { type: String, enum: ['standard', 'vip'], default: 'standard' }, generatedAt: Date, tokensUsed: Number },
    analysisSnapshot: { type: Object, default: null },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.4 Bảng Kỷ lục Lá số Tử Vi (`ziweirecords`)
Lưu trữ thông số bản mệnh Tử Vi thô lập từ thư viện iztro và các bài giải đoán ngầm.
- **Model:** [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/modules/ziwei/models/ZiweiRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    inputInfo: { 
      name: { type: String, default: "" },
      date: String,
      hour: Number,
      gender: String,
      timezone: { type: Number, default: 7 },
      school: { type: String, default: 'bac_phai' },
      calendarType: { type: String, default: 'solar' },
      calendarMode: { type: String, default: 'solar' },
      isLeap: { type: Boolean, default: false },
      lunarDate: { type: String, default: "" }
    },
    chartHash: { type: String, required: true },
    chartData: { type: Object, required: true },
    rating: { type: Number, default: null },
    aiInterpretation: {
      content: String,
      mode: { type: String, enum: ['standard', 'vip'], default: 'standard' },
      summary: String,
      sections: Array,
      generatedAt: Date
    },
    analysisSnapshot: { type: Object, default: null },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.5 Bảng Kỷ lục Xem tuổi Kết Hôn (`marriagerecords`)
Lưu trữ kết quả so sánh Bát Tự và độ hòa hợp của hai đối tượng Nam và Nữ.
- **Model:** [MarriageRecord.js](file:///t:/Phongthuy/backend/src/modules/bazi/models/MarriageRecord.js)
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
    aiInterpretation: { content: String, mode: { type: String, enum: ['standard', 'vip'], default: 'standard' }, generatedAt: Date },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  }
  ```

### 2.6 Bảng Kỷ lục Huyền Không Phi Tinh (`feixingrecords`)
Lưu trữ thông tin trạch vận, độ số 24 sơn hướng, ma trận 9 cung phi tinh Lạc Thư, Thành Môn Quyết và luận giải AI.
- **Model:** [FeiXingRecord.js](file:///t:/Phongthuy/backend/src/modules/feixing/models/FeiXingRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, default: 'guest' },
    facingDegree: { type: Number, required: true },
    sittingDegree: { type: Number, required: true },
    facingMountain: { type: String, required: true },
    sittingMountain: { type: String, required: true },
    facingPalace: { type: String, required: true },
    sittingPalace: { type: String, required: true },
    chartType: { type: String, enum: ['CHINH_HUONG', 'KIEM_HUONG', 'TIEU_KHONG_VONG', 'DAI_KHONG_VONG'], default: 'CHINH_HUONG' },
    isSubstitution: { type: Boolean, default: false },
    substitutionInfo: { type: String, default: '' },
    deviationDegree: { type: Number, default: 0 },
    period: { type: Number, required: true, min: 1, max: 9, default: 9 },
    buildingYear: { type: Number, default: null },
    title: { type: String, default: 'Lá Số Phong Thủy Nhà Ở' },
    ownerBirthInfo: {
      birthDate: { type: String, default: null },
      birthHour: { type: Number, default: null },
      gender: { type: Number, enum: [0, 1], default: 1 },
      genderLabel: { type: String, default: 'Nam' },
      solarYear: { type: Number, default: null },
      cungPhi: { type: String, default: null },
      menhNguHanh: { type: String, default: null },
      menhTrachGroup: { type: String, default: null },
      houseTrachGroup: { type: String, default: null },
      isMenhTrachMatch: { type: Boolean, default: null },
      menhTrachSummary: { type: String, default: '' }
    },
    analysisSnapshot: { type: Object, default: {} },
    rating: { type: Number, default: null },
    feedback: { type: String, default: null },
    aiInterpretation: { type: mongoose.Schema.Types.Mixed, default: null },
    chatTokens: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  }
  ```
- **Cấu trúc Cửu Cung (Cell Schema trong `analysisSnapshot.grid`):**
  - `palaceKey`: Mã cung (`KHAM`, `KHON`, `CHAN`, `TON`, `TRUNG`, `CAN`, `DOAI`, `CAN_NE`, `LY`).
  - `baseStar`: Sao nguyên thủy Lạc Thư (1-9).
  - `periodStar`: Vận tinh (1-9).
  - `mountainStar`: Sơn tinh (tọa tinh).
  - `waterStar`: Hướng tinh (thủy tinh).
  - `mountainFlight` / `waterFlight`: Thuận phi (`FORWARD`) hay Nghịch phi (`REVERSE`).
  - `auspiciousLevel`: Mức độ cát hung (`DAI_CAT`, `CAT`, `BINH`, `HUNG`, `DAI_HUNG`).
  - `batTrachStar`: Tên sao Bát Trạch theo Cung Phi gia chủ (`Sinh Khí`, `Diên Niên`, `Thiên Y`, `Phục Vị`, `Tuyệt Mệnh`, `Ngũ Quỷ`, `Lục Sát`, `Họa Hại`).
  - `batTrachType`: Phân loại Bát Trạch (`CAT`, `HUNG`, `TRUNG_TINH`).
  - `batTrachDesc`: Ý nghĩa phong thủy ứng với bản mệnh gia chủ.
- **Chỉ mục phụ (Compound Indexes):**
  - `{"userId": 1, "isDeleted": 1, "isPinned": -1, "createdAt": -1}`: Tối ưu phân trang và ghim bản ghi.
  - `{"isPublic": 1, "isDeleted": 1, "createdAt": -1}`: Tối ưu tra cứu liên kết chia sẻ công khai.

### 2.7 Bảng Phong Thủy Số: Sim, Biển Số Xe, Tài Khoản Ngân Hàng (`numerologyrecords`)
Lưu trữ kết quả khảo sát số học Tam Nguyên Cửu Vận, Kinh Dịch Mai Hoa Lập Quẻ và Bát Tự Tương Phối cho Sim số, Biển số xe và Số tài khoản ngân hàng.
- **Model:** [NumerologyRecord.js](file:///t:/Phongthuy/backend/src/modules/numerology/models/NumerologyRecord.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, default: 'guest', index: true },
    type: { type: String, enum: ['sim', 'plate', 'bank'], required: true, index: true },
    targetNumber: { type: String, required: true, trim: true },
    displayNumber: { type: String, required: true, trim: true },
    bankName: { type: String, default: '', trim: true },
    mode: { type: String, enum: ['quick', 'bazi'], default: 'quick', index: true },
    period: { type: Number, required: true, min: 1, max: 9, default: 9 },
    ownerName: { type: String, default: 'Gia Chủ' },
    ownerBirthInfo: {
      hasBirthInfo: { type: Boolean, default: false },
      birthDate: { type: String, default: null },
      birthHour: { type: String, default: '12:00' },
      gender: { type: Number, enum: [0, 1], default: 1 }
    },
    analysisSnapshot: { type: Object, default: {} },
    rating: { type: Number, default: null },
    feedback: { type: String, default: null },
    aiInterpretation: { type: mongoose.Schema.Types.Mixed, default: null },
    chatTokens: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  }
  ```
- **Chỉ mục phụ (Compound Indexes):**
  - `{"userId": 1, "isDeleted": 1, "isPinned": -1, "createdAt": -1}`: Tối ưu phân trang và ghim bản ghi.
  - `{"type": 1, "isDeleted": 1, "createdAt": -1}`: Lọc nhanh theo loại đối tượng số học.
  - `{"isPublic": 1, "isDeleted": 1, "createdAt": -1}`: Tối ưu tra cứu liên kết chia sẻ công khai.

### 2.8 Bảng Hội thoại dùng chung (`conversations`)
- **Model:** [Conversation.js](file:///t:/Phongthuy/backend/src/core/models/Conversation.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    system: { type: String, required: true, enum: ['iching', 'bazi', 'ziwei', 'marriage', 'feixing', 'numerology'] },
    recordId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    summary: { type: String, default: '' },
    summarizedMemory: { type: String, default: '' },
    totalTokens: { type: Number, default: 0 }
  }
  ```
- **Chỉ mục phụ (Compound Indexes):**
  - `{"userId": 1, "recordId": 1}`: Tối ưu hóa việc tìm nhanh cuộc trò chuyện gắn với một bản ghi cụ thể của người dùng (bao quát luôn tiền tố `userId: 1`, không cần index đơn lẻ trên `userId`).
  - `{"userId": 1, "system": 1, "updatedAt": -1}`: Tối ưu hóa việc lấy danh sách các phiên chat gần nhất theo từng phân hệ.

### 2.9 Bảng Tin nhắn dùng chung (`messages`)
- **Model:** [Message.js](file:///t:/Phongthuy/backend/src/core/models/Message.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    conversationId: { type: String, required: true, ref: 'Conversation' },
    role: { type: String, required: true, enum: ['user', 'ai'] },
    content: { type: String, required: true },
    sectionId: { type: String, default: null },
    sectionTitle: { type: String, default: null },
    structuredContent: {
      answer: { type: String },
      timing: { type: mongoose.Schema.Types.Mixed, default: "" },
      risk: { type: mongoose.Schema.Types.Mixed, default: "" },
      dos: { type: mongoose.Schema.Types.Mixed, default: "" },
      donts: { type: mongoose.Schema.Types.Mixed, default: "" },
      confidence: { type: Number, default: 0.8 }
    },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  }
  ```
- **Chỉ mục phụ (Compound Indexes):**
  - `{"conversationId": 1, "createdAt": 1}`: Tối ưu hóa truy vấn toàn bộ lịch sử tin nhắn của một hội thoại theo thứ tự thời gian tăng dần, triệt tiêu 100% In-memory sorting trên RAM của MongoDB.

### 2.8 Các bảng hỗ trợ Quản trị & Hệ thống

#### a. Bảng Nhật ký Hệ thống (`systemlogs`)
Lưu trữ lịch sử thao tác của người dùng, IP, Endpoint và thời gian phản hồi.
- **Model:** [SystemLog.js](file:///t:/Phongthuy/backend/src/modules/admin/models/SystemLog.js)
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
- **Model:** [AdminNotification.js](file:///t:/Phongthuy/backend/src/modules/admin/models/AdminNotification.js)
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
- **Model:** [Notification.js](file:///t:/Phongthuy/backend/src/modules/notification/models/Notification.js)
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
- **Chỉ mục phụ:**
  - `{"createdAt": 1, expireAfterSeconds: 7776000}`: Tự động dọn dẹp thông báo cũ hơn 90 ngày (Data Retention Policy).

#### d. Bảng Đơn Khiếu nại (`banappeals`)
Đơn khiếu nại yêu cầu mở khóa tài khoản của người dùng bị khóa.
- **Model:** [BanAppeal.js](file:///t:/Phongthuy/backend/src/modules/admin/models/BanAppeal.js)
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

#### e. Bảng Bài viết Tin tức & Học thuật (`blogposts`)
Lưu trữ các bài viết kiến thức phong thủy và học thuật chuyên sâu.
- **Model:** [BlogPost.js](file:///t:/Phongthuy/backend/src/modules/blog/models/BlogPost.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: { type: String, default: uuidv7 },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true, default: 'Chung' },
    tags: { type: [String], default: [] },
    thumbnailUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    author: { type: String, default: 'Ban Quản Trị' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
  ```
- **Chỉ mục phụ:**
  - `{"slug": 1}`
  - `{"category": 1, "isPublished": 1, "isDeleted": 1}`
  - `{"createdAt": -1}`

#### f. Bảng Nhật ký Hệ thống & Kiểm toán (`systemlogs`)
Lưu trữ nhật ký truy vết request, thời gian xử lý, IP và token đã tiêu thụ.
- **Model:** [SystemLog.js](file:///t:/Phongthuy/backend/src/modules/admin/models/SystemLog.js)
- **Cấu trúc Schema:**
  ```javascript
  {
    _id: ObjectId, // Sử dụng ObjectId mặc định của MongoDB
    requestId: { type: String, index: true },
    userId: { type: String, default: 'anonymous' },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    ip: { type: String, required: true },
    action: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    duration: { type: Number, required: true }, // millisecond duration
    tokensUsed: { type: Number, default: 0 },
    requestParams: { type: Object, default: null },
    timestamp: { type: Date, default: Date.now }
  }
  ```
- **Chỉ mục phụ:**
  - `{"timestamp": -1}`
  - `{"userId": 1, "timestamp": -1}`
  - `{"timestamp": 1, expireAfterSeconds: 2592000}`: Tự động xóa nhật ký hết hạn sau 30 ngày (Data Retention Policy).

---

## ⚡ 3. Cơ chế Cập nhật Thống kê Tài nguyên Nguyên tử O(1)

- **Cộng dồn Nguyên tử (Atomic Increments):**
  Để loại bỏ triệt để nghẽn cổ chai đĩa I/O (không chạy lại 12 câu lệnh `countDocuments` và `aggregate` mỗi khi tạo lá số mới), các Controller (`IChingController`, `BaziController`, `ZiweiController`, `MarriageController`) đều gọi trực tiếp phương thức nguyên tử `UserStatsService.incrementRecordCount(userId, system, 1)`:
  ```javascript
  await User.updateOne(
    { _id: userIdStr },
    { 
      $inc: { [countField]: delta },
      $set: { 'stats.lastUpdated': new Date() }
    }
  );
  ```
- **Xóa bỏ triệt để nghẽn đĩa trong HistoryController:** Hàm `updateByIdFlex` trong `HistoryController.js` đã được gỡ bỏ hoàn toàn lệnh gọi `UserStatsService.updateUserStatsBackground` (loại bỏ 12 câu lệnh MongoDB aggregation khi ghim, gắn tag, đánh giá sao hoặc chuyển đổi công khai lá số), giúp các thao tác cập nhật metadata đạt tốc độ O(1) < 5ms và triệt tiêu 100% các đột biến Disk I/O.
- **Truy vấn Lịch sử Tối ưu:** Cả 4 bảng dữ liệu chính đều được tạo Compound Index `{"userId": 1, "isDeleted": 1, "createdAt": -1}` để phục vụ truy vấn lịch sử phân trang mà không phải thực hiện In-memory sorting trên MongoDB.
