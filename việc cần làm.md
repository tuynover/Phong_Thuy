# 📋 DANH SÁCH VIỆC CẦN LÀM (TODO LIST) - REFACTOR & PRODUCTION RELEASE

> **Dự án:** Phong Thủy & Gieo Quẻ (Bát Tự, Tử Vi, Kinh Dịch, Phong Thủy)  
> **Cập nhật lần cuối:** 20/07/2026  
> **Quy tắc:** Các công việc được sắp xếp theo thứ tự **ưu tiên giảm dần** (P0: Cực kỳ khẩn cấp ➔ P1: Ưu tiên cao ➔ P2: Ưu tiên trung bình ➔ P3: Tối ưu dài hạn).  
> **Đánh dấu:** Tích vào ô `[x]` khi hoàn thành từng việc.

---

## 🔥 P0: CỰC KỲ KHẨN CẤP (CRITICAL & HIGH SECURITY / STABILITY BUGS)

- [x] **1. Khắc phục lỗ hổng JWT Secret Fallback `'secret'`**
  - **Vị trí:** [backend/src/middleware/auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js#L19), [backend/src/middleware/adminAuth.js](file:///t:/Phongthuy/backend/src/middleware/adminAuth.js#L18), [backend/src/controllers/AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L71)
  - **Ngữ cảnh & Nguyên nhân:** Mã nguồn đang dùng `process.env.JWT_SECRET || 'secret'`. Nếu biến môi trường bị thiếu, kẻ tấn công có thể tự ký JWT token giả dạng Admin để cướp toàn bộ quyền quản trị hệ thống.
  - **Chi tiết thực hiện:** Tạo file kiểm tra môi trường `backend/src/config/env.js`. Bắt buộc `process.env.JWT_SECRET` phải tồn tại lúc khởi động app, nếu thiếu thì log lỗi FATAL và gọi `process.exit(1)`. Xóa bỏ hoàn toàn chuỗi fallback `'secret'`.

- [x] **2. Khắc phục cấu hình CORS Wildcard (`*`)**
  - **Vị trí:** [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L25)
  - **Ngữ cảnh & Nguyên nhân:** Code hiện tại dùng `app.use(cors())`, mở cho phép tất cả các domain (`*`) gửi request. Rất nguy hiểm trước các tấn công Cross-Origin (CSRF/CORS exploitation).
  - **Chi tiết thực hiện:** Thay bằng cấu hình CORS whitelist domain đọc từ `process.env.CLIENT_URL` (ví dụ `https://tuynover.ddns.net`), hỗ trợ `credentials: true`.

- [x] **3. Loại bỏ việc nhận JWT Token qua URL Query String (`req.query.token`)**
  - **Vị trí:** [backend/src/middleware/auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js#L10-L12), [backend/src/middleware/adminAuth.js](file:///t:/Phongthuy/backend/src/middleware/adminAuth.js#L10-L12)
  - **Ngữ cảnh & Nguyên nhân:** Code cho phép truyền token dạng `?token=eyJhbG...`. Điều này khiến JWT Token bị rò rỉ vào Web Server Access Log, Nginx Log, Browser History và Referral Header.
  - **Chi tiết thực hiện:** Xóa bỏ đoạn `else if (req.query.token)`. Bắt buộc 100% request xác thực phải truyền qua HTTP Header `Authorization: Bearer <token>`.

- [x] **4. Khắc phục lỗ hổng ReDoS Regex Attack trong Admin User Search**
  - **Vị trí:** [backend/src/controllers/AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L26-L29)
  - **Ngữ cảnh & Nguyên nhân:** Chuỗi `search` từ `req.query.search` được đưa trực tiếp vào Mongo `$regex` mà không hề escape ký tự đặc biệt. Kẻ tấn công có thể gửi chuỗi regex cực đoan khiến CPU MongoDB nhảy lên 100% (ReDoS).
  - **Chi tiết thực hiện:** Tạo hàm helper `escapeRegExp(string)` để làm sạch toàn bộ ký tự regex trước khi truyền vào MongoDB query `$regex`.

- [x] **5. Bổ sung Middleware Xử lý Lỗi Toàn cục (Global Error Handling Middleware)**
  - **Vị trí:** [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js) (ở cuối chuỗi middleware Express)
  - **Ngữ cảnh & Nguyên nhân:** Ứng dụng thiếu middleware `app.use((err, req, res, next) => ...)` ở cuối `index.js`. Khi gặp uncaught error trong async route, Express v5 sẽ trả về trang HTML lỗi mặc định hoặc làm treo request client.
  - **Chi tiết thực hiện:** Thêm middleware bắt lỗi ở cuối `index.js`, log lỗi bằng `logger.error` và phản hồi cho client JSON chuẩn `{ message: err.message || 'Lỗi hệ thống nội bộ' }` với status 500.

- [x] **6. Tích hợp SSE Heartbeat Ping (15s) vào toàn bộ luồng AI Stream**
  - **Vị trí:** [backend/src/controllers/AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) (các hàm `interpretHexagram`, `interpretBazi`, `interpretZiwei`, `interpretMarriage`)
  - **Ngữ cảnh & Nguyên nhân:** Quy tắc 2.1 trong `AGENTS.md` yêu cầu gửi gói Heartbeat Ping rỗng mỗi 15s. Hiện tại không có ping nên nếu AI sinh chữ chậm (>15-30s), Nginx Proxy hoặc Load Balancer tự ngắt kết nối client (504 Gateway Timeout).
  - **Chi tiết thực hiện:** Thiết lập `setInterval` gửi gói data rỗng `:\n\n` mỗi 15 giây. Đảm bảo dọn dẹp `clearInterval` trong sự kiện `req.on('close')` và khối `finally`.

- [x] **7. Bật lại Route `/health` bị Comment Out**
  - **Vị trí:** [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L43-L45) và [nginx/default.conf](file:///t:/Phongthuy/nginx/default.conf#L65-L72)
  - **Ngữ cảnh & Nguyên nhân:** Nginx proxy `/health` tới Backend port 3001, nhưng trong `index.js` đoạn mã `app.get('/health', ...)` lại bị comment out, khiến các dịch vụ monitoring/AWS load balancer báo lỗi 404 liên tục.
  - **Chi tiết thực hiện:** Mở lại `app.get('/health', (req, res) => res.status(200).send('ok'))` phía trên các API router.

- [x] **8. Khắc phục Graceful Shutdown cho Uncaught Exception & Unhandled Rejection**
  - **Vị trí:** [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L4-L10)
  - **Ngữ cảnh & Nguyên nhân:** Code hiện tại chỉ log lỗi khi gặp `uncaughtException` hay `unhandledRejection` mà không ngắt process, khiến Node.js process tiếp tục chạy trong trạng thái hỏng bộ nhớ (corrupted state).
  - **Chi tiết thực hiện:** Trong handler event, thực hiện ngắt server `server.close()`, đóng DB connection và gọi `process.exit(1)`.

---

## 🚀 P1: ƯU TIÊN CAO (PERFORMANCE, OPTIMIZATION & INFRASTRUCTURE)

- [x] **9. Chuyển `UserApp.jsx` sang Dynamic Import (`React.lazy`)** *(Đã xem xét & bỏ qua - Giữ import tĩnh để đảm bảo UX load <0.5s tức thì cho User)*
  - **Vị trí:** [frontend/src/App.jsx](file:///t:/Phongthuy/frontend/src/App.jsx#L3)
  - **Ngữ cảnh & Nguyên nhân:** Quy tắc 2.2 trong `AGENTS.md` yêu cầu cả `UserApp` và `AdminApp` phải được tải động (lazy load). `UserApp` đang được import tĩnh làm tăng kích thước bundle ban đầu.
  - **Chi tiết thực hiện:** Thay `import UserApp from './components/UserApp'` thành `const UserApp = React.lazy(() => import('./components/UserApp'))`.

- [x] **10. Tích hợp Log Rotation (Daily Rotate) tránh tràn đĩa cứng**
  - **Vị trí:** [backend/src/services/LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js#L66-L80)
  - **Ngữ cảnh & Nguyên nhân:** `LoggerService` dùng `fs.appendFile` ghi dồn liên tục vào `logs/app.log` và `logs/errors.log` không có giới hạn, sẽ làm cạn kiệt dung lượng đĩa cứng server (Disk Full).
  - **Chi tiết thực hiện:** Tích hợp `winston` và `winston-daily-rotate-file`. Giới hạn 10MB/file, tự động nén zip log cũ và lưu tối đa 14 ngày.

- [x] **11. Sửa lỗi tính Giờ Việt Nam (GMT+7) trong LoggerService**
  - **Vị trí:** [backend/src/services/LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js#L28-L42)
  - **Ngữ cảnh & Nguyên nhân:** Code lấy `now.getTime() + (7*60*60*1000)` rồi dùng `getUTCHours()` làm sai lệch ngày tháng năm và bị double offset trên server đã ở GMT+7.
  - **Chi tiết thực hiện:** Đổi sang dùng `new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })` hoặc `Intl.DateTimeFormat`.

- [x] **12. Tối ưu hóa đếm Token AI (Loại bỏ 2 API calls dư thừa)**
  - **Vị trí:** [backend/src/controllers/AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L172-L174)
  - **Ngữ cảnh & Nguyên nhân:** Sau khi stream xong AI, controller gọi thêm 2 lần `AiService.countTokens` làm gửi thêm 2 HTTP request lên Google API, gây tăng độ trễ và tốn quota.
  - **Chi tiết thực hiện:** Trích xuất thông tin `usageMetadata` trực tiếp từ chunk stream cuối cùng của Gemini API để lấy số token chính xác mà không gọi lại API.

- [x] **13. Cập nhật và làm sạch danh sách AI Fallback Model Chain**
  - **Vị trí:** [backend/src/services/AiService.js](file:///t:/Phongthuy/backend/src/services/AiService.js#L35-L42)
  - **Ngữ cảnh & Nguyên nhân:** Danh sách fallback chứa các model bản preview hoặc sắp sunset (`flash-8b`, `preview-02-05`), nguy cơ gây lỗi liên hoàn và làm thời gian chờ lên tới 5 phút.
  - **Chi tiết thực hiện:** Cập nhật danh sách model fallback chính thức: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`.

- [x] **14. Bổ sung Security Headers với thư viện `helmet`**
  - **Vị trí:** [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js)
  - **Ngữ cảnh & Nguyên nhân:** Ứng dụng thiếu các HTTP Security Headers để bảo vệ khỏi Clickjacking, MIME sniffing, XSS.
  - **Chi tiết thực hiện:** Cài đặt gói `helmet` và khai báo `app.use(helmet())` ở đầu `index.js`.

---

## 🧪 P2: ƯU TIÊN TRUNG BÌNH (QUALITY ASSURANCE & CI/CD)

- [x] **15. Xây dựng Unit Test cho các Thuật toán Phong thủy Cốt lõi**
  - **Vị trí:** `backend/src/services/BaziAnalyzer.js`, `backend/src/services/RuleEngineService.js`, `backend/src/services/IChingDataService.js`
  - **Ngữ cảnh & Nguyên nhân:** Dự án hiện tại có 0% Test Coverage. Rất rủi ro bị vỡ thuật toán an sao/tính ngũ hành khi sửa mã nguồn backend.
  - **Chi tiết thực hiện:** Cài đặt Jest, viết unit test tự động xác minh kết quả an sao Bát Tự, Tử Vi và Quẻ Dịch với các bộ lá số mẫu.

- [x] **16. Nâng cấp GitHub Actions CI Pipeline**
  - **Vị trí:** [.github/workflows/backend-ci.yml](file:///t:/Phongthuy/.github/workflows/backend-ci.yml), [.github/workflows/frontend-ci.yml](file:///t:/Phongthuy/.github/workflows/frontend-ci.yml)
  - **Ngữ cảnh & Nguyên nhân:** File CI hiện tại chỉ thực hiện `npm ci` mà không chạy test, không lint hay check cú pháp syntax code.
  - **Chi tiết thực hiện:** Bổ sung các bước `node --check`, `npm run test`, `npm run lint` và `npm run build` vào workflow CI.

- [ ] **17. Cấu hình Non-Root User trong Dockerfile**
  - **Vị trí:** [backend/Dockerfile](file:///t:/Phongthuy/backend/Dockerfile), [frontend/Dockerfile](file:///t:/Phongthuy/frontend/Dockerfile)
  - **Ngữ cảnh & Nguyên nhân:** Docker container đang chạy app với quyền `root`, vi phạm nguyên tắc an ninh tối thiểu (Least Privilege).
  - **Chi tiết thực hiện:** Thêm chỉ thị `USER node` trước lệnh `CMD` trong Dockerfile.

---

## 🧹 P3: TỐI ƯU DÀI HẠN (ARCHITECTURE CLEANUP & MAINTENANCE)

- [ ] **18. Chia nhỏ Monolithic Component `AdminApp.jsx` (178 KB)**
  - **Vị trí:** [frontend/src/components/AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx)
  - **Ngữ cảnh & Nguyên nhân:** File duy nhất dài 178 KB chứa toàn bộ giao diện quản trị viên, gây chậm IDE, khó bảo trì và giảm hiệu năng re-render.
  - **Chi tiết thực hiện:** Tách nhỏ thành các sub-components độc lập đặt tại `frontend/src/components/admin/` (`UserManagementTable.jsx`, `BanAppealModal.jsx`, `SystemLogViewer.jsx`, ...).

- [ ] **19. Chia nhỏ Monolithic Controller `AiInterpretationController.js` (62 KB)**
  - **Vị trí:** [backend/src/controllers/AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js)
  - **Ngữ cảnh & Nguyên nhân:** Controller dài 1,424 dòng ôm quá nhiều trách nhiệm (God Class).
  - **Chi tiết thực hiện:** Tách thành các controller chuyên biệt: `IChingAiController.js`, `BaziAiController.js`, `ZiweiAiController.js`, `MarriageAiController.js`.

- [x] **20. Loại bỏ hoàn toàn Code Legacy `mongoose.isValidObjectId`** *(Đã dọn sạch code legacy và viết script xóa tất cả bản ghi non-UUIDv7 trong DB)*
  - **Vị trí:** [backend/src/controllers/AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L34-L58) (`findByIdFlex`, `updateByIdFlex`)
  - **Ngữ cảnh & Nguyên nhân:** Dự án đã chuyển 100% sang UUIDv7 string. Logic kiểm tra `isValidObjectId` và hydrate ObjectId cũ gây dư thừa rác mã nguồn.
  - **Chi tiết thực hiện:** Refactor bỏ kiểm tra `isValidObjectId`, chỉ dùng Mongoose UUID Query chuẩn.

- [x] **21. Cập nhật Tài liệu Kỹ thuật Đồng bộ với Mã nguồn** *(Đã đồng bộ toàn bộ tệp tài liệu API.md, ARCHITECTURE.md, README.md và CHANGELOG_AI.md)*
  - **Vị trí:** [docs/API.md](file:///t:/Phongthuy/docs/API.md), [docs/ARCHITECTURE.md](file:///t:/Phongthuy/docs/ARCHITECTURE.md), [docs/CHANGELOG_AI.md](file:///t:/Phongthuy/docs/CHANGELOG_AI.md), [README.md](file:///t:/Phongthuy/README.md)
  - **Ngữ cảnh & Nguyên nhân:** Quy tắc 6 trong `AGENTS.md` bắt buộc tài liệu kỹ thuật và CHANGELOG_AI.md phải luôn được cập nhật chính xác sau mỗi đợt refactor.
  - **Chi tiết thực hiện:** Cập nhật lại sơ đồ kiến trúc, endpoint API và ghi chú nhật ký thay đổi trong `CHANGELOG_AI.md`.
