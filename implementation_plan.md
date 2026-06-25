# Kế hoạch Tái Cấu Trúc Toàn Diện: Chuẩn Hóa Tên Tiếng Anh & Đồng Nhất Hệ Thống

Tài liệu này đề xuất phương án triển khai cụ thể nhằm **chuẩn hóa 100% tên tệp, tên biến, router và lược đồ cơ sở dữ liệu** sang tiếng Anh nhất quán cho cả 3 phân hệ: **IChing (Kinh Dịch)**, **Bazi (Bát Tự)**, và **Ziwei (Tử Vi)**. Đồng thời, thực hiện gộp các Controller/Service và hợp nhất Lược đồ Chat theo yêu cầu.

---

## 1. Nội dung Đề xuất & Thay đổi chính

### 1.1 Chuẩn hóa Tên gọi Tiếng Anh & Đồng nhất trên DB
Hệ thống sẽ chuyển toàn bộ tên gọi và bảng dữ liệu (collection) của 3 hệ thống sang tiếng Anh thống nhất:
* **Kinh Dịch**: Chuyển đổi tên gọi trong mã nguồn từ `Divination`, `Hexagram`, `Kinhdich` sang **`IChing`**.
  * Rename model & collection từ `HexagramRecord` sang **`IChingRecord`** (tương ứng tên bảng trên MongoDB sẽ là `ichingrecords`).
* **Bát Tự**: Giữ nguyên tên tiếng Anh chuẩn quốc tế là **`Bazi`**.
  * Model và bảng dữ liệu trên MongoDB giữ nguyên là **`BaziRecord`** (`bazirecords`).
* **Tử Vi**: Chuyển đổi toàn bộ tên gọi từ `TuVi` sang **`Ziwei`**.
  * Rename model & collection từ `TuViRecord` sang **`ZiweiRecord`** (tương ứng tên bảng trên MongoDB sẽ là `ziweirecords`).
* **Lưu ý**:
  * Giữ nguyên thuật ngữ **`ungKy`** (Ứng Kỳ) và **`MaiHoa`** (Mai Hoa Dịch Số) theo phản hồi của bạn.

### 1.2 Hợp nhất Lược đồ Chat (Generic Chat Database Schemas)
* **Xóa bỏ hoàn toàn** 6 bộ sưu tập chat riêng lẻ cũ: `HexagramConversation`, `HexagramMessage`, `BaziConversation`, `BaziMessage`, `TuViConversation`, `TuViMessage`.
* Tạo mới lược đồ chat dùng chung gồm 2 bảng:
  * `Conversation.js`: Chứa trường `system: 'iching' | 'bazi' | 'ziwei'`.
  * `Message.js`: Chứa nội dung trò chuyện, token sử dụng, và kết quả dạng structured nếu có.

### 1.3 Gộp các Controller & Service Core
1. **AI Controller**: [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) xử lý phát stream AI và chat bổ trợ cho cả 3 phân hệ (`iching`, `bazi`, `ziwei`).
2. **History Controller**: [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) xử lý xem lịch sử, chi tiết lá số, đánh giá sao, và xóa bản ghi cho cả 3 phân hệ.
3. **ConversationContextService**: [ConversationContextService.js](file:///t:/Phongthuy/backend/src/services/ConversationContextService.js) hỗ trợ lưu/truy vấn lịch sử và lọc câu hỏi rác `isDivinationRelated` cho cả 3 phân hệ.
4. **Prompt Files**: Tách biệt hoàn toàn `PromptTemplateManager.js` cũ thành hai tệp prompt tiếng Anh sạch sẽ: [IChingPrompts.js](file:///t:/Phongthuy/backend/src/services/IChingPrompts.js) và [BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js).

---

## 2. Bản đồ Thay Đổi File Dự Kiến (Proposed Changes)

### 2.1 Backend: Xóa & Đổi tên (DELETE / RENAME)

#### Các file bị Xóa (DELETE)
* `backend/src/models/HexagramConversation.js`
* `backend/src/models/HexagramMessage.js`
* `backend/src/models/BaziConversation.js`
* `backend/src/models/BaziMessage.js`
* `backend/src/models/TuViConversation.js`
* `backend/src/models/TuViMessage.js`
* `backend/src/services/PromptTemplateManager.js`

#### Các file được Đổi tên (RENAME)
* `backend/src/controllers/DivinationController.js` -> [IChingController.js](file:///t:/Phongthuy/backend/src/controllers/IChingController.js)
* `backend/src/controllers/TuViController.js` -> [ZiweiController.js](file:///t:/Phongthuy/backend/src/controllers/ZiweiController.js)
* `backend/src/models/HexagramRecord.js` -> [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js)
* `backend/src/models/TuViRecord.js` -> [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js)
* `backend/src/services/TuViPrompts.js` -> [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js)
* `backend/src/services/TuViFormatter.js` -> [ZiweiFormatter.js](file:///t:/Phongthuy/backend/src/services/ZiweiFormatter.js)
* `backend/src/services/TuViValidators.js` -> [ZiweiValidators.js](file:///t:/Phongthuy/backend/src/services/ZiweiValidators.js)
* `backend/src/services/TuViCache.js` -> [ZiweiCache.js](file:///t:/Phongthuy/backend/src/services/ZiweiCache.js)
* `backend/src/services/HexagramDataService.js` -> [IChingDataService.js](file:///t:/Phongthuy/backend/src/services/IChingDataService.js)
* `backend/src/routes/tuvi.js` -> [ziwei.js](file:///t:/Phongthuy/backend/src/routes/ziwei.js)

#### Các file Tạo mới (NEW)
* `backend/src/models/Conversation.js`
* `backend/src/models/Message.js`
* `backend/src/services/IChingPrompts.js`
* `backend/src/services/BaziPrompts.js`
* [astrologyHelpers.js](file:///t:/Phongthuy/backend/src/shared/utils/astrologyHelpers.js) (Trích từ PromptTemplateManager cũ)

### 2.2 Frontend: Đổi tên (RENAME)
* `frontend/src/components/DivinationBoard.jsx` -> [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx)
* `frontend/src/components/TuViBoard.jsx` -> [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx)
* `frontend/src/components/TuViChart.jsx` -> [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiChart.jsx)
* `frontend/src/utils/phongthuyHelpers.js` -> [astrologyHelpers.js](file:///t:/Phongthuy/frontend/src/utils/astrologyHelpers.js)

---

## 3. Kế hoạch Xác minh (Verification Plan)

### 3.1 Biên dịch & Kiểm tra Tự động
* Biên dịch lại toàn bộ frontend để kiểm tra lỗi liên kết import:
  ```bash
  npm run build --prefix frontend
  ```
* Chạy chương trình kiểm tra cú pháp node trên toàn bộ tệp backend mới đổi tên:
  ```bash
  node --check src/controllers/IChingController.js
  node --check src/controllers/ZiweiController.js
  node --check src/services/ZiweiPrompts.js
  node --check src/services/IChingPrompts.js
  node --check src/services/BaziPrompts.js
  ```

### 3.2 Kiểm tra Thủ công
1. Khởi động server backend và frontend, truy cập vào giao diện.
2. Kiểm tra:
   * Lập lá số Bát Tự, Tử Vi (Ziwei) và gieo quẻ Kinh Dịch (IChing) thành công.
   * Gửi yêu cầu giải đoán AI thành công (stream SSE phản hồi tức thì).
   * Lịch sử nạp và hiển thị đầy đủ.
   * Chat hỏi đáp AI hoạt động ổn định trên cả 3 phân hệ và lưu lịch sử vào đúng 2 bảng `conversations` và `messages` chung.
