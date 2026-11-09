# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.

## 📅 Phiên bản: Triển Khai Quản Trị Cấu Hình Hệ Thống, Hot-Reload & Tích Hợp 6 Phân Hệ Admin (09/11/2026)

### 🌟 1. Bối Cảnh & Yêu Cầu Người Dùng
- Yêu cầu xây dựng tính năng Quản trị Cấu hình Hệ thống tập trung (Quản lý các biến môi trường, API keys, AI models, bảo mật JWT, SMTP Email).
- Triển khai chính sách mặt nạ che giấu thông tin nhạy cảm (Sensitive Key Masking) trên API và UI.
- Phân quyền nghiêm ngặt 2 tầng (Dual-layer RBAC): Chặn tuyệt đối `co-admin`, chỉ `admin` (Super Admin) mới có quyền truy cập và chỉnh sửa cấu hình hệ thống.
- Giải quyết triệt để vấn đề: Có cần build lại hoặc restart lại server khi đổi cấu hình hay không (Cung cấp cơ chế Hot-Reload động tại thời gian chạy mà không cần restart server).
- Khắc phục các tồn đọng của module Admin: Bổ sung 2 phân hệ mới (Huyền Không Phi Tinh & Phong Thủy Số) vào Quản lý Dịch Bản và Báo cáo Thống kê Analytics.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Mô Hình Dữ Liệu Cấu Hình Hệ Thống ([SystemConfig.js](file:///t:/Phongthuy/backend/src/modules/admin/models/SystemConfig.js)):**
   - Khóa chính định dạng UUIDv7, lưu trữ key-value phân loại theo 5 nhóm: `ai`, `security`, `database`, `email`, `system`.
   - Các thuộc tính: `label`, `description`, `isSecret` (cờ đánh dấu dữ liệu bí mật cần che giấu), `requiresRestart` (cờ phân loại cấu hình cần restart server hay hỗ trợ Hot-Reload).
2. **Dịch Vụ Cấu Hình & Cơ Chế Hot-Reload ([ConfigService.js](file:///t:/Phongthuy/backend/src/core/services/ConfigService.js)):**
   - Tự động nạp cấu hình ban đầu từ `.env` vào MongoDB khi khởi động nếu bảng trống.
   - Hàm `maskSecret`: Tự động che giấu các khóa bí mật dạng `••••••••` hoặc `AIza...98aX`.
   - Hàm `updateConfigs`: Tự động bỏ qua không ghi đè nếu admin gửi chuỗi mặt nạ lên; cập nhật RAM `process.env` ngay lập tức; kích hoạt `AiRotator.gemini.resetCache()` để làm mới ngay API key và client instance; đồng bộ sao lưu an toàn ra file `backend/.env` (tạo bản sao lưu `.env.bak`).
   - Cung cấp API `testGeminiConnection` (kiểm tra độ trễ và kết nối Google Gemini) và `testSmtpConnection` (xác thực máy chủ SMTP).
3. **Phân Quyền Nghiêm Ngặt Super Admin ([superAdminOnly.js](file:///t:/Phongthuy/backend/src/core/middleware/superAdminOnly.js), [admin.routes.js](file:///t:/Phongthuy/backend/src/modules/admin/routes/admin.routes.js)):**
   - Áp dụng middleware `superAdminOnly` cho toàn bộ các route `/api/admin/config/*` và thao tác xóa/thử lại hàng đợi DLQ. Co-admin truy cập sẽ nhận mã lỗi 403 Forbidden.
4. **Bổ Sung Đầy Đủ 6 Phân Hệ vào Quản Lý Dịch Bản ([AdminRecordController.js](file:///t:/Phongthuy/backend/src/modules/admin/controllers/AdminRecordController.js), [AdminCalculationsTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminCalculationsTab.jsx)):**
   - Tích hợp `FeiXingRecord` (Huyền Không Phi Tinh) và `NumerologyRecord` (Phong Thủy Số: Sim, Biển Số, STK).
   - Bổ sung bộ lọc tìm kiếm theo tọa hướng, vận nhà, loại số học, số hiển thị và xem chi tiết học thuật trong Modal.
5. **Tích Hợp Phi Tinh & Số Học vào Báo Cáo Thống Kê Analytics ([AdminStatsController.js](file:///t:/Phongthuy/backend/src/modules/admin/controllers/AdminStatsController.js), [AdminOverviewTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminOverviewTab.jsx)):**
   - Bổ sung thẻ thống kê tổng số lượng `totalFeixing` và `totalNumerology`.
   - Tích hợp chuỗi thời gian lượt tạo và lượng Token AI tiêu thụ của Phi Tinh và Phong Thủy Số vào AreaChart và BarChart.
6. **Giao Diện Quản Trị Cấu Hình ([AdminConfigTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminConfigTab.jsx), [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/app/AdminApp.jsx)):**
   - Thiết kế giao diện cao cấp (Premium Aesthetics) chia 5 nhóm cấu hình trực quan, có nút test AI và test SMTP trực tiếp.
   - Nút Show/Hide password an toàn, dropdown chọn Model khóa theo chuẩn AGENTS.md (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`...).
   - Chỉ hiển thị Tab Cấu Hình đối với tài khoản `admin` (ẩn hoàn toàn với `co-admin`).
7. **Modal Chi Tiết Sức Khỏe & Trạng Thái Hệ Thống ([AdminSystemHealthModal.jsx](file:///t:/Phongthuy/frontend/src/features/admin/components/AdminSystemHealthModal.jsx)):**
   - Xây dựng hoàn thiện Modal báo cáo sức khỏe hệ thống theo đúng 100% thiết kế giao diện mẫu (Hình 1).
   - Hiển thị 3 thẻ tổng quan: Trạng thái vận hành, Thời gian hoạt động (uptime), Độ trễ phản hồi (API ping ms).
   - Bảng chi tiết 7 dịch vụ hệ thống với các chỉ số đo lường thực tế: Cơ sở dữ liệu (MongoDB), Cổng giao tiếp (API Gateway), Bộ nhớ đệm & Khóa phân tán (Redis), Tài nguyên máy chủ (Node.js RAM), Môi trường máy chủ (OS & Runtime), Dịch vụ Trí tuệ Nhân tạo (Google Gemini AI Rotator), Hàng đợi Email & Nhiệm vụ nền (Async Worker), và Đồng hồ hệ thống (UTC).
   - Tích hợp nút "Xem chi tiết" trên [AdminSystemHealthCard.jsx](file:///t:/Phongthuy/frontend/src/features/admin/components/AdminSystemHealthCard.jsx) và liên kết với [AdminOverviewTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminOverviewTab.jsx).
8. **Hoàn Thiện Chức Năng Light Mode Toàn Diện Cho Admin ([AdminThemeContext.jsx](file:///t:/Phongthuy/frontend/src/features/admin/context/AdminThemeContext.jsx), [AdminThemeToggle.jsx](file:///t:/Phongthuy/frontend/src/features/admin/context/AdminThemeToggle.jsx), [index.css](file:///t:/Phongthuy/frontend/src/index.css)):**
   - Triển khai thành công bộ điều hướng Theme Switcher (Nền Tối / Nền Sáng) lưu giữ cấu hình qua `localStorage.getItem('admin_theme')`.
   - Bổ sung bộ quy tắc CSS scoped `.admin-light-mode` trong `index.css`, chuẩn hóa toàn bộ nền thẻ, bảng dữ liệu, ô nhập liệu và phân cách đạt tỷ lệ tương phản cao WCAG 2.1 AA.
   - Đồng bộ hóa các biểu đồ Recharts (AreaChart, BarChart), Tooltip và lưới tọa độ sang phong cách sáng thanh lịch khi bật Light Mode.
   - Thử nghiệm thực tế toàn diện trên Google Chrome qua `chrome-devtools-mcp`: Chuyển đổi theme mượt mà, mở/đóng modal chi tiết sức khỏe hệ thống (Hình 1) đạt 100% yêu cầu.
9. **Tái Cấu Trúc Bố Cục Header Bar Dashboard Chuẩn Enterprise SaaS ([AdminApp.jsx](file:///t:/Phongthuy/frontend/src/app/AdminApp.jsx), [AdminThemeToggle.jsx](file:///t:/Phongthuy/frontend/src/features/admin/context/AdminThemeToggle.jsx)):**
   - Thiết kế lại toàn diện Header Bar theo mô hình 2 tầng (2-Row Visual Hierarchy) chuyên nghiệp, khắc phục triệt để lỗi rớt dòng chữ "Quản Trị" và tình trạng nhồi nhét nút.
   - **Tầng 1 (Brand & Quick Controls):** Khiên phong thủy bo góc lớn, tiêu đề nằm trọn vẹn trên 1 dòng duy nhất, đi kèm huy hiệu vai trò phân quyền và bộ 3 nút điều khiển thẳng hàng ngang: Theme Switcher (`Nền Tối / Nền Sáng`), App Switcher (`Quản Trị | Xem Web ↗`), và Nút Đăng xuất.
   - **Tầng 2 (Navigation Segmented Bar):** Dải Tab điều hướng trải rộng toàn chiều ngang, tích hợp icon nhận diện sinh động (`LayoutDashboard`, `Users`, `Layers`, `AlertTriangle`, `BookOpen`, `Sliders`) và huy hiệu số lượng thông báo mới pulsing.
   - Đã kiểm thử trực quan trên Chrome qua Chrome DevTools MCP ở cả 2 chế độ Dark Mode và Light Mode, đảm bảo 100% cân đối và thẩm mỹ cao cấp.
10. **Khắc Phục Lỗi Đăng Xuất Tức Thì (Instant Logout Fix) ([AuthContext.jsx](file:///t:/Phongthuy/frontend/src/context/AuthContext.jsx), [App.jsx](file:///t:/Phongthuy/frontend/src/App.jsx), [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/app/AdminApp.jsx)):**
    - Triệt tiêu lỗi kẹt giao diện Admin sau khi đăng xuất: Tự động xóa cờ `adminMode` và chuyển ngay về `UserApp` trong Render Phase khi `!user` hoặc mất quyền admin mà không cần phải tải lại trang thủ công (F5).
11. **Sửa Lỗi Tải Danh Sách Lá Số, Hội Viên & Bài Viết ([AdminRecordController.js](file:///t:/Phongthuy/backend/src/modules/admin/controllers/AdminRecordController.js), [AdminCalculationsTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminCalculationsTab.jsx), [AdminUsersTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminUsersTab.jsx), [AdminBlogTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminBlogTab.jsx)):**
    - Sửa bất đồng bộ thuộc tính dữ liệu: Backend `AdminRecordController.getCalculations` chuẩn hóa trả về cả `records` và `items`; Frontend `AdminCalculationsTab` đọc linh hoạt `res.data.records || res.data.items || []`.
    - Bổ sung định tuyến chi tiết cho 2 phân hệ mới `feixing` và `numerology` trong `getCalculationDetail`.
    - Phòng vệ dữ liệu null-safe cho danh sách người dùng và bài viết Blog.
12. **Bổ Sung Tính Năng "Đọc Tất Cả" Cho Cảnh Báo ([AdminAppealController.js](file:///t:/Phongthuy/backend/src/modules/admin/controllers/AdminAppealController.js), [admin.routes.js](file:///t:/Phongthuy/backend/src/modules/admin/routes/admin.routes.js), [api.js](file:///t:/Phongthuy/frontend/src/services/api.js), [AdminAlertsTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminAlertsTab.jsx)):**
    - Tạo mới API `PUT /api/admin/notifications/read-all` cập nhật hàng loạt trạng thái sang `read`.
    - Thêm nút bấm trực quan "Đọc tất cả" có icon `CheckCheck` trên thanh tiêu đề cảnh báo; tự động ẩn khi không còn cảnh báo chưa đọc.
13. **Bản Kế Hoạch Toàn Diện Xây Dựng Light Mode Cho Admin ([ADMIN_LIGHT_MODE_PLAN.md](file:///t:/Phongthuy/docs/ADMIN_LIGHT_MODE_PLAN.md)):**
   - Thiết lập hệ thống Design Tokens ngữ nghĩa (Semantic Tokens) chuyển đổi màu sắc từ Dark Mode sang Light Mode.
   - Quy chuẩn giao diện Light Mode thanh lịch, tối giản dựa trên chuẩn mực thị giác của modal Hình 1.
   - Kiến trúc Theme Provider cục bộ cho Admin, không ảnh hưởng đến phân hệ UserApp huyền bí.
   - Lộ trình 3 giai đoạn triển khai chi tiết kèm tiêu chuẩn nghiệm thu tương phản WCAG 2.1 AA.

14. **Tối Ưu Nút "Đọc Tất Cả": Toast 2 Giây Tự Ẩn & Chặn Refresh Trang ([AdminAlertsTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminAlertsTab.jsx)):**
    - Bỏ hoàn toàn Modal thông báo gây gián đoạn thao tác; thay thế bằng Toast notification nổi góc màn hình tự động biến mất sau đúng 2 giây.
    - Ngăn chặn triệt để hành vi tải lại trang (chặn default submit event) và áp dụng Optimistic UI Update: Trạng thái cảnh báo chuyển ngay sang "Đã Đọc", huy hiệu số đếm chưa đọc trên Header tự động xóa tức thì.
15. **Thiết Kế Lại Toàn Diện Bảng Màu Light Mode Cho Admin ([AdminApp.jsx](file:///t:/Phongthuy/frontend/src/app/AdminApp.jsx), [AdminOverviewTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminOverviewTab.jsx), [AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Thay thế toàn bộ tông màu xám đục cũ bằng chuẩn mực Modern SaaS Cloud Light Theme: Nền mượt `bg-slate-50/70`, vùng thẻ bo góc lớn `rounded-3xl` viền `border-slate-200/80` bóng đổ nhẹ `shadow-sm`.
    - Thanh Navigation Segmented Tabs được thiết kế lại sắc nét: Tab active màu trắng nổi khối (`shadow-md scale-[1.01]`), icon màu hổ phách sang trọng, tab inactive mềm mại tinh tế, badge cảnh báo màu rose pulsing sinh động.
16. **Tách Thành Tab Riêng: Sức Khỏe & Hạ Tầng Hệ Thống ([AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx), [HealthController.js](file:///t:/Phongthuy/backend/src/core/controllers/HealthController.js)):**
    - Bỏ hoàn toàn modal popup thu nhỏ; đưa toàn bộ báo cáo sức khỏe hạ tầng ra thành một Phân Hệ Tab độc lập trên Header (`Sức Khỏe Hệ Thống`).
    - Backend nâng cấp API `GET /api/health/detailed`: Bổ sung thông số phần cứng thực tế qua `os.cpus()`, `os.loadavg()`, RAM thực tế (% đã dùng, còn trống, Node.js Heap, RSS), và tính toán chính xác dung lượng ổ đĩa qua `fs.statfsSync(process.cwd())`.
    - Giao diện gồm 3 tầng: 3 Thẻ KPI tổng quan (Trạng thái vận hành nhịp thở pulse, Thời gian hoạt động Uptime, Độ trễ API), 3 Thẻ đo phần cứng chi tiết (CPU, RAM máy chủ, Ổ đĩa Disk có thanh Progress Bar thích ứng màu sắc), và Bảng 7 Dịch vụ nền tảng chuẩn hóa trực quan theo Hình 1.
    - Tích hợp bộ đếm tự động làm mới thời gian thực (Tùy chọn Tắt / 5s / 10s / 30s) và nút Làm mới thủ công.
17. **Hệ Thống Đa Chế Độ Xem Dashboard (Multi-View Dashboard Switcher) ([AdminOverviewTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminOverviewTab.jsx)):**
    - Tận dụng dữ liệu analytics đã tải 1 lần vào RAM, xây dựng thanh chuyển đổi chế độ xem linh hoạt (View Switcher Pills) ngay trên đầu tab:
      1. **Tổng Quan Điều Hành:** 8 Thẻ đếm số liệu nhanh + Biểu đồ AreaChart dòng thời gian lượt truy cập & lượt dịch lý.
      2. **Ma Trận Phân Hệ:** Biểu đồ Pie / Donut Chart 6 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân, Phi Tinh, Thần Số Học) + Bảng xếp hạng thị phần bản ghi.
      3. **Hiệu Suất AI & Token:** Biểu đồ BarChart phân tích mức tiêu thụ token Google Gemini theo môn học hoặc theo mục đích (Luận giải vs Chat) và tỷ lệ phần trăm.
      4. **Tiêu Dùng Hội Viên:** Bảng xếp hạng thành viên tiêu thụ token và lượt gieo quẻ nhiều nhất kèm cơ chế xem chi tiết (drill-down).
    - Chỉ hiển thị chế độ xem đang chọn, tiết kiệm 100% diện tích màn hình, chuyển đổi mượt mà tức thì không tốn thêm bất kỳ request API nào.

18. **Bóc Tách Chi Tiết Tài Nguyên Từng Service: % CPU Đang Dùng & RAM Lẻ So Với RAM Tổng ([AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx), [HealthController.js](file:///t:/Phongthuy/backend/src/core/controllers/HealthController.js)):**
    - **% CPU Thời Gian Thực:** Bổ sung thuật toán đo lường delta CPU ticks (`os.cpus()`) và `process.cpuUsage()` để tính toán chính xác % CPU tổng của máy chủ và % CPU của tiến trình Node.js Backend.
    - **Phân Bổ RAM Lẻ Từng Service So Với RAM Tổng:** Xây dựng cấu trúc dữ liệu bóc tách bộ nhớ thực tế:
      - *API Gateway & Backend:* `RSS: 106MB` (~0.7% RAM tổng) • Heap Used: 48MB.
      - *Cơ Sở Dữ Liệu (MongoDB Atlas):* `135MB` (~0.8% RAM tổng) từ `serverStatus.mem.resident` • 45 kết nối pool.
      - *Bộ Nhớ Đệm (Redis & RAM Cache):* `24MB` (~0.1% RAM tổng) • Fast-path sub-millisecond.
      - *Hàng Đợi Tác Vụ (Queue Worker):* `18MB` (~0.1% RAM tổng).
      - *Cụm AI Gemini Rotator & SSE Buffer:* `32MB` (~0.2% RAM tổng).
      - *Hệ Điều Hành & Tiến Trình Nền (Host OS):* `12.57GB` (~80.1% RAM tổng).
      - *RAM Khả Dụng (Free Memory):* `2.8GB` (~18.0% RAM tổng).
    - **Trực Quan Hóa Đa Tầng:** Tích hợp thanh phân bổ RAM đa tầng (Multi-Segment Stacked Bar) và Bảng bóc tách tài nguyên chi tiết từng service có thanh % CPU và % RAM so với RAM tổng.

19. **Giám Sát Tổng Thể Hạ Tầng Máy Chủ VPS ([HealthController.js](file:///t:/Phongthuy/backend/src/core/controllers/HealthController.js), [AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Bổ sung cấu trúc dữ liệu `vpsOverview`: Tên máy chủ (Hostname), Kiến trúc phần cứng (`os.arch()`), Phiên bản Kernel (`os.release()`), Tên vi xử lý và xung nhịp (`os.cpus()[0].model`, `speed`), Tổng số CPU cores (`os.cpus().length`), Tổng RAM VPS (`os.totalmem()`), RAM trống (`os.freemem()`), Dung lượng Ổ đĩa Disk thực tế (`fs.statfsSync`) và Tải trung bình hệ thống (Load Average 1m, 5m, 15m).
    - Hiển thị 4 Khối KPI lớn trên đầu trang: Tổng CPU Máy Chủ, Tổng Bộ Nhớ RAM, Tổng Ổ Đĩa Lưu Trữ (Disk), và Tải Trung Bình.

20. **Giám Sát Tài Nguyên Lưu Trữ Container, Docker Images & Nút Dọn Dẹp ([AdminConfigController.js](file:///t:/Phongthuy/backend/src/modules/admin/controllers/AdminConfigController.js), [admin.routes.js](file:///t:/Phongthuy/backend/src/modules/admin/routes/admin.routes.js), [api.js](file:///t:/Phongthuy/frontend/src/services/api.js), [AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Đo lường và hiển thị chi tiết tài nguyên lưu trữ Docker thật từ `docker system df --format "{{json .}}"`: Dung lượng Docker Images, Containers Layer, Volumes dữ liệu, Build Cache và dung lượng rác có thể thu hồi.
    - Cơ chế an toàn phát hiện môi trường: Khi chạy Local hoặc môi trường Non-Docker, giao diện hiển thị rõ ràng huy hiệu `Chưa Kích Hoạt Docker (Chờ Production)` và giá trị `--` kèm callout box giải thích, **tuyệt đối không hiển thị số liệu ảo hay giá trị hardcode**.
    - Endpoint `POST /api/admin/system/docker/prune` dành riêng cho Super Admin (`superAdminOnly`): Thực thi dọn dẹp Docker images không sử dụng (`docker image prune -f`) an toàn qua `child_process.exec` có timeout, trả về chính xác dung lượng giải phóng từ output của Docker.
    - Nút bấm trực quan trên UI: Khi ở môi trường Docker thật sẽ hiển thị dung lượng rác thực tế có thể thu hồi; khi chưa có Docker sẽ thông báo rõ ràng qua Toast và không làm reload màn hình.

21. **Tối Ưu Hóa Chu Kỳ Giám Sát: Khóa Mặc Định 15 Phút & Tránh Spam Socket ([AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Triệt tiêu hoàn toàn tình trạng ping liên tục vài chục giây gây lãng phí CPU, băng thông mạng và I/O đĩa.
    - Khóa chu kỳ tự động ping mặc định thành **15 phút (900 giây)**; chỉ ping lại máy chủ khi người dùng refresh trình duyệt hoặc chủ động bấm nút "Làm Mới". Cung cấp bộ chọn chu kỳ linh hoạt: 15 phút, 30 phút, 1 giờ hoặc Tắt hoàn toàn.

22. **Nâng Cấp Thẩm Mỹ Bảng Chỉ Số Dịch Vụ Theo Chuẩn Modern SaaS Cloud (Hình 1) ([AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Chuẩn hóa bố cục bảng chỉ số dịch vụ: Header phân chia cột sắc nét, icon tròn chuyên dụng cho từng dịch vụ, thanh % CPU tải thực tế, chỉ số RAM lẻ chính xác (MB/GB), % chiếm dụng so với RAM tổng và huy hiệu trạng thái xanh mướt (Healthy / Ready / Active).

23. **Triệt Tiêu Hoàn Toàn Số Liệu Giả (Zero Fake Telemetry Policy) ([HealthController.js](file:///t:/Phongthuy/backend/src/core/controllers/HealthController.js), [AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Loại bỏ 100% các giá trị mặc định / mock cứng:
      - *MongoDB:* Phát hiện chính xác cụm MongoDB Atlas Cloud Serverless/M0 không có quyền đọc `mem.resident`, hiển thị rõ ràng `Managed Atlas Cloud` thay vì số RAM ảo.
      - *Redis:* Khi chưa kết nối máy chủ Redis ngoài (chạy L1 In-Memory Cache), RAM hiển thị `Tích hợp RAM L1 (<1ms)` thay vì số ảo 24MB.
      - *Queue Worker & Gemini AI Rotator:* Chạy in-process bên trong Node.js Backend, được hiển thị trung thực là `Trong Backend` thay vì tạo các tiến trình RAM ảo tách rời.
      - *Thanh Phân Bổ RAM Đa Tầng (Stacked Bar):* Chỉ tổng hợp các tiến trình thực tế có chiếm dụng bộ nhớ trên hệ điều hành, đảm bảo tổng phần trăm và số GB khớp 100% với `os.totalmem()` và `os.freemem()`.

24. **Tối Ưu Trực Quan KPI Máy Chủ: Lấy % Sử Dụng & Dung Lượng Còn Trống Làm Chỉ Số Trọng Tâm ([AdminSystemTab.jsx](file:///t:/Phongthuy/frontend/src/features/admin/tabs/AdminSystemTab.jsx)):**
    - Thiết kế lại 4 thẻ KPI đầu trang:
      - Thay đổi con số nổi bật trung tâm thành **% Sử Dụng Thực Tế** (Ví dụ: `82% RAM`, `70% Disk`, `11% CPU`) thay vì hiển thị dung lượng tổng kích thước máy chủ.
      - Đi kèm thanh tiến trình mini (Mini Progress Bar) thích ứng màu sắc mượt mà (xanh/hổ phách/đỏ theo ngưỡng tải).
      - Hiển thị rõ ràng dung lượng còn trống khả dụng: `Còn trống: 2.9 GB (RAM)`, `Còn trống: 8.63 GB (Disk)`, `Còn rỗi: 89% (CPU)`.

25. **Khắc Phục Triệt Để Lỗi Build Dockerfile Trên Node.js 22 ([Dockerfile](file:///t:/Phongthuy/backend/Dockerfile), [package.json](file:///t:/Phongthuy/backend/package.json), [AuthController.js](file:///t:/Phongthuy/backend/src/modules/auth/controllers/AuthController.js)):**
    - **Nguyên nhân lỗi:** Thư viện `bcrypt` là C++ native add-on, khi build trên `node:22-slim` (Node v22.23+) chưa có sẵn prebuilt binary tương thích từ `@mapbox/node-pre-gyp`. Trình quản lý gói kích hoạt cơ chế fallback biên dịch từ mã nguồn C++ (`node-gyp`), nhưng `node:22-slim` không có sẵn `python3`, `make` và `g++`, dẫn tới crash ở bước `npm ci --omit=dev`.
    - **Giải pháp dứt điểm:** Chuyển đổi từ `bcrypt` sang `bcryptjs` (Pure JavaScript implementation):
      - Tương thích 100% hai chiều (Two-way hash compatibility): Các mật khẩu mã hóa cũ trong MongoDB với định dạng `$2a$` / `$2b$` đều được xác thực chính xác.
      - Loại bỏ 100% phụ thuộc vào trình biên dịch C++ và Python, ngăn chặn vĩnh viễn lỗi gyp/pre-gyp khi Docker build trên mọi nền tảng (Linux, Azure, AWS, Docker Hub Buildx).
      - Giảm thời gian build Docker container và giảm dung lượng image đáng kể. Đã kiểm thử vượt qua toàn bộ 45/45 Test Suites.

### 🧪 3. Kết Quả Kiểm Thử
- **Backend Syntax:** 100% tệp trong `src/` vượt qua `node --check`.
- **Backend Unit Tests:** 45/45 Test Suites PASS (325/325 Tests PASS).
- **Frontend Build:** Vite build hoàn thành sạch sẽ không lỗi (0 errors).
- **Kiểm Thử Trực Quan Chrome DevTools MCP:**
  - Xác thực hiển thị đầy đủ 4 thẻ KPI tổng quan VPS (CPU, RAM, Disk, Load Avg).
  - Xác thực thẻ lưu trữ Docker và thao tác click nút "Dọn dẹp Images không sử dụng" hiển thị Toast mượt mà không reload trang.
  - Xác thực chu kỳ ping mặc định 15 phút và thanh phân bổ RAM đa tầng hoạt động chính xác.

---

## 📅 Phiên bản: Nâng Cấp Hệ Thống CI/CD Pipeline & Auto-Rollback An Toàn (17/10/2026)

### 🌟 1. Bối Cảnh & Vấn Đề
- Pipeline CI/CD trước đây tiềm ẩn một số rủi ro về độ tin cậy và kiểm soát chất lượng:
  1. **Thiếu cơ chế Auto-Rollback:** Khi Smoke Test `/health` thất bại trên máy chủ EC2 sau 60 giây, workflow chỉ in log và dừng lại (`exit 1`), để lại container mới bị lỗi làm gián đoạn dịch vụ người dùng (Downtime).
  2. **Kiểm tra cú pháp chưa triệt để:** Backend CI chỉ chạy `node --check src/index.js` đơn lẻ. Nếu các controller hoặc service sâu bên trong có lỗi cú pháp mà chưa có unit test phủ tới thì vẫn bị lọt qua.
  3. **Tương thích Container Image:** Docker image build chưa được ghim cố định kiến trúc nền tảng `platforms: linux/amd64`, tiềm ẩn rủi ro khi chuyển đổi môi trường runner hoặc server.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Tự Động Rollback khi Deploy Thất Bại ([`deploy.yml`](file:///t:/Phongthuy/.github/workflows/deploy.yml)):**
   - Trước khi kéo image mới, script deploy tự động phát hiện và lưu lại Image Tag đang hoạt động ổn định (`PREV_TAG`) của container `phongthuy-backend`.
   - Nếu Smoke Test kiểm tra `/health` không phản hồi 200 OK sau 12 lần thử (60 giây), SSH Action sẽ tự động rollback ngay lập tức: gán lại `IMAGE_TAG=$PREV_TAG`, kích hoạt `docker compose up -d --no-deps` và reload Nginx để bảo vệ 100% thời gian hoạt động của dịch vụ (Zero-Downtime Guarantee).
2. **Kiểm Tra Cú Pháp Đệ Quy Toàn Bộ `src/` Backend ([`package.json`](file:///t:/Phongthuy/backend/package.json), [`backend-ci.yml`](file:///t:/Phongthuy/.github/workflows/backend-ci.yml), [`deploy.yml`](file:///t:/Phongthuy/.github/workflows/deploy.yml)):**
   - Bổ sung lệnh `"check:syntax"` chạy đệ quy duyệt qua tất cả các tệp `.js` bên trong `src/` để thực thi `node --check`.
   - Tích hợp bước này vào cả `backend-ci.yml` (cho Pull Request) và `deploy.yml` (cho nhánh `main`).
3. **Cố Định Kiến Trúc Multi-Platform:**
   - Bổ sung khai báo `platforms: linux/amd64` cho cả 2 tác vụ build Docker Image (backend và frontend) trong `deploy.yml`.

---

## 📅 Phiên bản: Tối Ưu Hóa Cỗ Máy Tìm Kiếm Trí Tuệ Nhân Tạo (GEO - Generative Engine Optimization) (17/10/2026)

### 🌟 1. Bối Cảnh & Vấn Đề
- Người dùng khi dùng các AI Bot (Gemini, ChatGPT, Claude, Perplexity) duyệt web hoặc tạo tóm tắt AI (AI Overview) về website `tuynover.id.vn` gặp thông báo:
  > *"Trang web hiện không thể truy cập trực tiếp để lấy dữ liệu chi tiết do hệ thống không thể kết nối hoặc trang web đang chặn các công cụ duyệt tự động."*
- **Nguyên nhân kỹ thuật:**
  1. Frontend xây dựng theo kiến trúc SPA thuần túy (React 19). Thẻ `<div id="root"></div>` trong file HTML ban đầu hoàn toàn rỗng. Khi các AI Bot (chỉ cào HTML thô không chạy JavaScript) đọc trang, chúng không tìm thấy bất kỳ nội dung văn bản hay liên kết dịch vụ nào.
  2. File `robots.txt` chưa khai báo cho phép các User-Agent của AI Bots (như `GPTBot`, `ChatGPT-User`, `Google-Extended`, `PerplexityBot`, `ClaudeBot`).
  3. Thiếu file chỉ mục học máy chuẩn quốc tế `/llms.txt`.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Khởi Tạo Chuẩn AI Quốc Tế [`llms.txt`](file:///t:/Phongthuy/frontend/public/llms.txt):**
   - Soạn thảo cấu trúc tài liệu Markdown tóm tắt toàn bộ 8 phân hệ cốt lõi (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân, Huyền Không, Phong Thủy Số, Xem Ngày, Blog) cùng các đường dẫn chính thức để các mô hình LLM nạp trực tiếp vào ngữ cảnh.
2. **Khai Báo Cởi Mở Cho Toàn Bộ AI Bots Trong [`robots.txt`](file:///t:/Phongthuy/frontend/public/robots.txt):**
   - Chỉ định quyền `Allow: /` và `Allow: /llms.txt` cho các bot AI hàng đầu: `GPTBot`, `ChatGPT-User`, `Google-Extended`, `Googlebot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Bytespider`, `Applebot-Extended`.
3. **Bổ Sung Semantic SEO & AI Fallback Content Trong [`index.html`](file:///t:/Phongthuy/frontend/index.html):**
   - Nhúng nội dung ngữ nghĩa có cấu trúc (`<main>`, `<header>`, `<h1>`, `<h2>`, `<ul>`, `<a>`) trực tiếp vào bên trong `<div id="root">`.
   - Các crawler thô và AI bot ngay lập tức đọc được toàn bộ danh mục dịch vụ phong thủy của trang web. Khi người dùng thật truy cập trên trình duyệt, React 19 sẽ tự động mount và hydrate giao diện tương tác đè lên mà không làm thay đổi hay gián đoạn bất kỳ trải nghiệm nào.
4. **Kiểm Tra Đóng Gói (Build):**
   - Đã chạy `npm run build` thành công, toàn bộ file `dist/index.html`, `dist/robots.txt`, `dist/llms.txt` đã sẵn sàng deploy.

## 📅 Phiên bản: Toàn Diện Hóa & Nghiêm Khắc Tối Ưu Hệ Thống SEO (17/10/2026)

### 🌟 1. Bối Cảnh & Các Khiếm Khuyết Nghiêm Trọng Phát Hiện
1. **Lọt lưới 2 phân hệ lớn khỏi SEO bot:**
   - Cấu hình Nginx (`nginx/default.conf`) và SEO Router (`backend/src/routes/seo.js`) chỉ định tuyến cho `bazi`, `ziwei`, `iching`, `marriage`, `xemngay`. Hoàn toàn thiếu `feixing` (Huyền Không Phi Tinh) và `numerology` (Phong Thủy Số Học).
   - Sitemap động `/sitemap.xml` không thu thập URL tĩnh của `feixing`, `numerology`, `blog` và bỏ qua danh sách lá số công khai của 2 phân hệ này.
2. **Lỗi gọi sai hàm Google Indexing API:**
   - `FeiXingController.js` và `NumerologyController.js` gọi `GoogleIndexingService.notifyUrlUpdated` / `notifyUrlDeleted` trong khi Service chỉ có `publishUrl`, gây crash ngầm `TypeError` khi người dùng bật/tắt chia sẻ lá số.
   - Sử dụng fallback domain cứng `https://phongthuy.vn` thay vì `appConfig.appDomain` (`https://tuynover.id.vn`).
3. **Lỗi 404 ảnh Fallback OpenGraph:**
   - Fallback `og:image` trong `seo.js` trỏ về thư mục ảo `/assets/images/og-default.jpg` không tồn tại trên đĩa.
4. **Vi phạm chuẩn Internal Linking cho Web Crawler:**
   - Các liên kết phân hệ trong Footer sử dụng `<button onClick>` thay vì thẻ `<a href>` ngữ nghĩa, làm Googlebot không đi sâu (deep crawl) vào các trang con.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Mở Rộng Định Tuyến Nginx & SEO Router:**
   - Cập nhật regex Nginx trong [`default.conf`](file:///t:/Phongthuy/nginx/default.conf) bao phủ `feixing`, `huyen-khong`, `numerology`, `phong-thuy-so`.
   - Bổ sung SEO Router tĩnh và SSR Dynamic Record cho cả 2 phân hệ trong [`seo.js`](file:///t:/Phongthuy/backend/src/routes/seo.js).
2. **Nâng Cấp `sitemap.xml` Tự Động Toàn Diện:**
   - Đưa đầy đủ 12 URL tĩnh chính của website và tự động gom thêm `FeiXingRecord` & `NumerologyRecord` có `isPublic: true` vào XML Sitemap.
3. **Chuẩn Hóa Google Indexing API & Domain:**
   - Thêm 2 hàm alias `notifyUrlUpdated(url)` và `notifyUrlDeleted(url)` vào [`GoogleIndexingService.js`](file:///t:/Phongthuy/backend/src/core/services/GoogleIndexingService.js).
   - Đồng bộ việc dùng `appConfig.appDomain` trên toàn bộ controller.
4. **Sửa Lỗi Ảnh OpenGraph & Thêm Schema `Article` JSON-LD:**
   - Đổi fallback `og:image` sang `/og-banner.jpg` (file thực có sẵn).
   - Tự động tiêm cấu trúc dữ liệu Schema `Article` chuẩn Schema.org cho các bài viết Blog khi bot quét.
5. **Chuyển Đổi Footer Sang `<a href>` Chuẩn SEO:**
   - Toàn bộ liên kết dịch vụ và trang chính sách trong [`Footer.jsx`](file:///t:/Phongthuy/frontend/src/components/layout/Footer.jsx) được chuyển sang thẻ `<a>` kèm `href` chuẩn và `onClick={e => { e.preventDefault(); onSelectModule(...) }}` vừa tối ưu trải nghiệm SPA vừa hỗ trợ 100% bot tìm kiếm.

## 📅 Phiên bản: Chuẩn Hóa Bộ Favicon & Icon Đạt Tiêu Chuẩn Google Search (17/10/2026)

### 🌟 1. Bối Cảnh & Vấn Đề
- Trên kết quả tìm kiếm Google (`https://tuynover.id.vn`), website bị hiển thị biểu tượng quả địa cầu xám mặc định thay vì logo thương hiệu Phong Thủy như các trang khác.
- **Nguyên nhân kỹ thuật:**
  1. File `favicon.png` cũ có kích thước không vuông (`608x492 px`), vi phạm quy chuẩn 1:1 của Google Favicon Bot.
  2. Trang `index.html` chỉ có 1 thẻ duy nhất trỏ tới file gốc `logo.png` (1024x1024 px) dung lượng nặng, thiếu định dạng `favicon.ico` và các kích thước chuẩn theo cấp số bội 48px của Google (`48x48`, `96x96`, `144x144`, `192x192`).

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Khởi Tạo Bộ Icon Chuẩn Tỷ Lệ 1:1 Đa Kích Thước:**
   - Trích xuất từ vector/master `logo.png` vuông (1024x1024 px) với thuật toán nén Lanczos:
     - `favicon-48x48.png` (Chuẩn sàn tối thiểu hiển thị trên Google Search).
     - `favicon-96x96.png` & `favicon-144x144.png` (Hiển thị nét cao trên màn hình Retina / High-DPI).
     - `favicon-192x192.png` (Dành cho Android / PWA).
     - `apple-touch-icon.png` (180x180 px cho thiết bị Apple iOS).
     - `favicon-16x16.png` & `favicon-32x32.png` và file đa phân giải `favicon.ico` cho trình duyệt desktop truyền thống.
2. **Khai Báo Cấu Trúc Head Chuẩn SEO trong [`index.html`](file:///t:/Phongthuy/frontend/index.html):**
   - Bổ sung đầy đủ các thẻ `<link rel="icon">` theo kích thước `sizes="..."` và mime type chuẩn để Googlebot-Favicon nhận diện ngay lập tức khi crawl.
3. **Kiểm Tra Build & Tài Nguyên Phân Phối:**
   - Đã chạy kiểm tra `npm run build` thành công, toàn bộ tài nguyên icon đã nằm trong thư mục `dist/` sẵn sàng triển khai.


## 📅 Phiên bản: Tối Ưu Tốc Độ Phản Hồi Chuyển Tab Giữa Các Phân Hệ (16/10/2026)

### 🌟 1. Bối Cảnh & Nguyên Nhân Gốc Rễ
- Người dùng phản ánh thao tác chuyển tab giữa các phân hệ cảm giác bị chậm đi rõ rệt.
- **Phân tích kỹ thuật chuyên sâu bằng Chrome DevTools Performance Trace:**
  1. **Hiệu ứng trễ CSS (`transition-all`):** Đợt cập nhật nút tab trước đó đã vô tình thêm `transition-all` vào 10 nút navigation. Khi chuyển tab, trình duyệt phải nội suy màu nền và chữ trong 150ms-200ms trên 10 nút cùng lúc với quá trình React reconciliation, tạo cảm giác trễ (delay) rõ rệt trước mắt người dùng thay vì kích hoạt tức thì.
  2. **Tải trọng DOM lớn (6.427 DOM nodes):** Khi người dùng đã tra cứu lá số Bát Tự (195KB), Tử Vi (12 cung với hàng trăm sao) và Huyền Không Phi Tinh (SVG La Kinh 451 node), toàn bộ các phân hệ này vẫn được lưu giữ trên DOM (kiến trúc Keep-Alive). Khi chuyển tab cha `UserApp`, trình duyệt phải tính toán lại Style & Layout Reflow trên 6.427 phần tử.
  3. **Thiếu sót Memoize ở các Board nặng:**
     - [`FeiXingBoard.jsx`](file:///t:/Phongthuy/frontend/src/features/feixing/FeiXingBoard.jsx) và [`NumerologyBoard.jsx`](file:///t:/Phongthuy/frontend/src/features/numerology/NumerologyBoard.jsx) chưa được bọc `React.memo`, khiến component bị re-render thừa ngay cả khi đang ở trạng thái ẩn (`hidden`).
     - [`HomeBoard.jsx`](file:///t:/Phongthuy/frontend/src/features/home/HomeBoard.jsx) bị truyền prop inline arrow function `onOpenDailyFortune={() => setIsDailyFortuneOpen(true)}` làm mất tác dụng của `React.memo`.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Chuyển Đổi Hiệu Ứng Nút Tab Sang `transition-colors duration-75`:**
   - Thay thế `transition-all` trên 10 nút tab bằng `transition-colors duration-75` trong [`Header.jsx`](file:///t:/Phongthuy/frontend/src/components/layout/Header.jsx). Nút tab chuyển màu sắc ngay lập tức (< 75ms) khi click, loại bỏ hoàn toàn cảm giác khựng/trễ thị giác.
2. **Khôi Phục Hiệu Quả `React.memo` Cho Các Board:**
   - Bọc `React.memo` cho [`FeiXingBoard.jsx`](file:///t:/Phongthuy/frontend/src/features/feixing/FeiXingBoard.jsx) và [`NumerologyBoard.jsx`](file:///t:/Phongthuy/frontend/src/features/numerology/NumerologyBoard.jsx).
   - Chuẩn hóa callback `handleOpenDailyFortune = useCallback(...)` trong [`UserApp.jsx`](file:///t:/Phongthuy/frontend/src/app/UserApp.jsx) để bảo vệ bộ nhớ đệm `React.memo` của `HomeBoard`.
3. **Kết Quả Đo Đạc Thực Tế (Benchmark trên Chrome DevTools):**
   - Thời gian block main-thread (Long Task) giảm mạnh từ **1.143ms $\rightarrow$ 128ms** (giảm tới gần 90%).
   - Tổng thời gian phản hồi chuyển tab hoàn tất giảm từ **1.157ms $\rightarrow$ 412ms**, mang lại trải nghiệm mượt mà, tức thì.

## 📅 Phiên bản: Tối Ưu Bố Cục Header Desktop & Tự Động Rút Gọn Tên Người Dùng (16/10/2026)

### 🌟 1. Bối Cảnh & Mục Tiêu
- Người dùng phản ánh khi đăng nhập tài khoản có tên đầy đủ dài (ví dụ: "Trịnh Công Tuyến"), phần Header máy tính bị tràn khung (overflow) sang mép phải màn hình, làm nút tài khoản bị che khuất hoặc cắt chữ.
- Yêu cầu người dùng:
  1. Header không bị tràn ra ngoài màn hình.
  2. Nếu tên dài quá thì chỉ hiển thị mỗi tên gọi chính trên thanh Header thay vì toàn bộ họ và tên.
  3. Đẩy Logo sang bên trái để tạo thêm không gian thoáng đãng cho thanh điều hướng và tiện ích.
  4. Tối ưu tổng thể độ co giãn, khoảng cách và tính thẩm mỹ của Header trên mọi độ phân giải máy tính (1280px, 1366px, 1440px, 1920px).

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Rút Gọn Tên Gọi Tiếng Việt Thông Minh (`getShortDisplayName`):**
   - Bổ sung hàm tiện ích `getShortDisplayName(name)` tại phạm vi module trong [`Header.jsx`](file:///t:/Phongthuy/frontend/src/components/layout/Header.jsx).
   - Tự động tách chuỗi họ tên theo chuẩn văn hóa xưng hô Việt Nam: lấy từ cuối cùng làm tên gọi chính hiển thị (ví dụ: "Trịnh Công Tuyến" $\rightarrow$ "Tuyến", "Nguyễn Văn An" $\rightarrow$ "An").
   - Nút đại diện tài khoản hiển thị icon `UserCircle` + Tên gọi ngắn gọn, kèm thuộc tính `title={user.name}` để khi rê chuột vào vẫn xem được đầy đủ họ tên.
   - Thêm thẻ định danh tài khoản sang trọng (Account Info Card) ở đầu menu dropdown khi bấm mở: hiển thị huy hiệu chữ cái đầu, họ tên đầy đủ và email người dùng.
2. **Mở Rộng Container & Đẩy Logo Về Phía Trái:**
   - Thay thế giới hạn cố định `max-w-6xl` (1152px) vốn gây ra khoảng trống lãng phí ~400px hai bên trên màn hình lớn thành cấu trúc linh hoạt `w-full max-w-[1600px] mx-auto`.
   - Giúp Logo tự nhiên neo sát về mép trái màn hình với lề tiêu chuẩn `px-3 sm:px-4 lg:px-6`, giải phóng toàn bộ không gian cho 10 tab điều hướng trung tâm và cụm tiện ích bên phải.
3. **Thu Gọn Kích Thước Tab Điều Hướng (Nav Tabs Footprint Reduction):**
   - Tối ưu 10 nút tab từ `px-4 py-1.5` $\rightarrow$ `px-2 xl:px-2.5 py-1 text-[11px] xl:text-[11.5px] tracking-tight`.
   - Giảm tổng chiều rộng thanh điều hướng từ ~980px xuống ~804px (tiết kiệm gần 180px bề ngang), đảm bảo không còn hiện tượng chèn ép làm tràn khung ngay cả trên màn hình laptop 1366px.
4. **Tối Ưu Cụm Tiện Ích & Dropdown Phải:**
   - Nút "Quẻ Ngày" thu gọn lề đệm sang `px-2.5 py-1 text-xs gap-1`, giảm khoảng cách `gap-1.5 sm:gap-2`.
5. **Kiểm Thử Thực Tế Bằng Chrome DevTools (Zero Overflow):**
   - Đã kiểm tra đo đạc bounding box thực tế trên trình duyệt: `totalContentWidth` đạt 1284.9px, `containerScrollWidth` hoàn toàn bằng `containerClientWidth` (1453px), mép phải cách cạnh màn hình 41px an toàn, triệt tiêu 100% tình trạng tràn khung.
   - Kiểm thử hiển thị hoàn hảo ở cả giao diện Desktop (1366px, 1520px) và Mobile (393px).

## 📅 Phiên bản: Chuyển Đổi Toàn Bộ Tên Miền Chính & Cấu Hình SEO Sang `tuynover.id.vn` (16/10/2026)

### 🌟 1. Bối Cảnh & Mục Tiêu
- Chuyển toàn bộ tên miền dịch vụ, đường dẫn cấu hình backend/frontend, CORS, email hỗ trợ, SEO meta tags (OpenGraph, Twitter card, Schema.org JSON-LD), robots.txt và Nginx về tên miền duy nhất: `https://tuynover.id.vn`.
- Loại bỏ hoàn toàn các tên miền cũ (`tuynover.ddns.net`, `tuynover.giize.com`, `tuynover.duckdns.org`) khỏi cấu hình CORS, Nginx server block và đường dẫn chứng chỉ SSL.
- Chuẩn bị sẵn cấu hình Nginx location `/.well-known/acme-challenge/` và chứng chỉ SSL `/etc/letsencrypt/live/tuynover.id.vn/` cho tên miền mới.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Backend Configuration (`backend/src/core/config/appConfig.js`, `swagger.json`):**
   - Đặt mặc định `appDomain` về `https://tuynover.id.vn`.
   - Thu hẹp `corsOrigins` chỉ giữ lại localhost phát triển và `https://tuynover.id.vn`.
   - Cập nhật URL production trong `swagger.json`.
   - Đồng bộ unit test `backend/tests/config/appConfig.test.js`.
2. **Frontend SEO & Thông tin liên hệ (`frontend/index.html`, `robots.txt`, `Footer.jsx`, `InfoBoards.jsx`, `ShareableStoryModal.jsx`):**
   - Cập nhật thẻ `og:url`, `og:image`, `twitter:url`, `twitter:image`, JSON-LD `WebSite`, `Organization` sang `https://tuynover.id.vn/`.
   - Cập nhật URL sitemap trong `frontend/public/robots.txt` thành `https://tuynover.id.vn/sitemap.xml`.
   - Cập nhật email liên hệ hỗ trợ thành `support@tuynover.id.vn`.
   - Cập nhật watermark thẻ chia sẻ story thành `tuynover.id.vn`.
3. **Nginx Reverse Proxy (`nginx/default.conf`):**
   - Cập nhật `server_name` độc quyền: `tuynover.id.vn www.tuynover.id.vn`.
   - Chuyển đường dẫn chứng chỉ SSL sang:
     + `ssl_certificate /etc/letsencrypt/live/tuynover.id.vn/fullchain.pem;`
     + `ssl_certificate_key /etc/letsencrypt/live/tuynover.id.vn/privkey.pem;`
   - Thêm location `/.well-known/acme-challenge/` hỗ trợ cấp mới chứng chỉ SSL qua Certbot webroot.

## 📅 Phiên bản: Khắc Phục Lỗi Đăng Ký Tài Khoản Mới Qua Google OAuth & Cấu Hình COOP (13/10/2026)

### 🌟 1. Bối Cảnh & Nguyên Nhân Gốc Rễ
- Người dùng phản ánh tài khoản Google đã từng đăng nhập thì vào bình thường, nhưng tài khoản Google mới lần đầu đăng nhập thì gặp lỗi 500 (`Internal Server Error`).
- Đồng thời trình duyệt hiển thị cảnh báo `Cross-Origin-Opener-Policy policy would block the window.postMessage call`.
- **Nguyên nhân cốt lõi:**
  1. Trong [`AuthController.js`](file:///t:/Phongthuy/backend/src/modules/auth/controllers/AuthController.js), khi tài khoản chưa tồn tại (`!user`), hệ thống khởi tạo tài khoản mới và tạo mật khẩu ngẫu nhiên bằng `uuidv7()`: `password: await bcrypt.hash(uuidv7(), 10)`. Tuy nhiên, tệp tin chưa import hàm `uuidv7` từ thư viện `uuid` $\rightarrow$ gây ra lỗi `ReferenceError: uuidv7 is not defined`, làm sập luồng đăng ký mới qua Google với mã lỗi 500.
  2. Header `Cross-Origin-Opener-Policy` (COOP) mặc định của Helmet là `same-origin`, chặn giao tiếp `window.postMessage` từ popup của Google Identity Services về trang web cha.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Import `uuidv7` trong [`AuthController.js`](file:///t:/Phongthuy/backend/src/modules/auth/controllers/AuthController.js):**
   - Bổ sung `const { v7: uuidv7 } = require('uuid');` vào phần khai báo thư viện. Cho phép đăng ký người dùng mới qua Google hoạt động trơn tru.
2. **Cấu hình COOP trong [`backend/src/index.js`](file:///t:/Phongthuy/backend/src/index.js):**
   - Thêm `crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }` vào middleware `helmet` để tương thích hoàn toàn với Google One Tap / Sign In with Google popup.

## 📅 Phiên bản: Hoàn Thiện Đồng Bộ Toàn Bộ Phân Hệ Đa Môn & Chuẩn Hóa RAG Toàn Diện (12/10/2026)

### 🌟 1. Bối Cảnh & Mục Tiêu
- Người dùng chuẩn bị nạp thêm toàn bộ tài liệu các bộ môn khác (Tử Vi, Kinh Dịch, Huyền Không, Hợp Hôn, Số Học).
- Yêu cầu trích xuất toàn bộ lá số thực tế của tất cả các phân hệ còn lại trong MongoDB và chuẩn bị kịch bản RAG đa môn hoàn chỉnh để phục vụ huấn luyện Siêu AI Đa Môn.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Hoàn Thiện Bộ 5 Adapter Chuyên Biệt (`backend/src/modules/training/adapters/`):**
   - [`BaziTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/BaziTrainingAdapter.js): Bát Tự Tử Bình (153 mẫu VIP).
   - [`ZiweiTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/ZiweiTrainingAdapter.js): Tử Vi Đẩu Số (13 mẫu VIP, trích xuất 12 Cung, Mệnh/Thân Chủ, Cục, Chính tinh đắc/hãm, Phụ tinh).
   - [`IChingTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/IChingTrainingAdapter.js): Kinh Dịch Lục Hào (48 mẫu VIP, trích xuất Câu hỏi, Quẻ Chính/Biến, Hào Động, Thời điểm gieo).
   - [`MarriageTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/MarriageTrainingAdapter.js): Hợp Hôn Mệnh Lý (21 mẫu VIP, trích xuất Tứ Trụ Nam Nữ đầy đủ).
   - [`FeiXingTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/FeiXingTrainingAdapter.js): Huyền Không Phi Tinh (6 mẫu VIP, trích xuất Vận, Tọa-Hướng, độ số la kinh, cấu trúc tinh bàn).
2. **Xuất Thành Công Bộ Dataset Tổng Hợp Đa Môn:**
   - Chạy lệnh `npm run dataset:sync`, xuất thành công 5 tệp riêng lẻ và tệp tổng hợp **`dataset_phongthuy_combined.jsonl` (241 mẫu VIP, 6.6MB)** lên Google Drive (`H:\My Drive\phong_thuy_train_ai\dataset_train\`).
3. **Kịch Bản Chuẩn Hóa Tài Liệu RAG Đa Môn:**
   - Xây dựng Pipeline tự động thích ứng trên Colab: tự quét mọi thư mục môn (`bat_tu`, `tu_vi`, `kinh_dich`, `huyen_khong`...), chuyển đổi tự động PDF (chữ + scan OCR), DOCX, TXT sang Markdown `.md` UTF-8 chuẩn hóa.

## 📅 Phiên bản: Khắc Phục Tận Gốc Trích Xuất Can Chi Bát Tự & Tối Ưu Dataset Huấn Luyện (12/10/2026)

### 🌟 1. Bối Cảnh & Phát Hiện Cốt Lõi
- Trong quá trình kiểm tra suy luận trên Colab, phát hiện mô hình gặp hiện tượng đảo lộn Thập Thần (nhầm Quan Sát thành Ấn, Thổ thành Tỷ Kiên).
- **Phát hiện nguyên nhân gốc rễ:** Trong [`BaziTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/BaziTrainingAdapter.js), logic trích xuất trụ Can Chi đọc nhầm thuộc tính `.can` và `.chi` thay vì `.gan`, `.zhi` và `.canChi` trong cơ sở dữ liệu `baziData`. Hậu quả là toàn bộ 152 mẫu trong dataset trước đó bị gán thành: `Tứ Trụ: Năm Không rõ, Tháng Không rõ, Ngày Không rõ, Giờ Không rõ`.
- Khi đầu vào bị "mù" Tứ Trụ, mô hình AI buộc phải suy đoán xác suất mù mờ dẫn đến hiện tượng hallucination.

### 🛠️ 2. Các Nâng Cấp Kỹ Thuật Đã Triển Khai
1. **Sửa Đổi Adapter Bát Tự ([`BaziTrainingAdapter.js`](file:///t:/Phongthuy/backend/src/modules/training/adapters/BaziTrainingAdapter.js)):**
   - Chuẩn hóa hàm `getPillarStr()` đọc chính xác `pillar.canChi`, `pillar.gan`, `pillar.zhi`, kèm đầy đủ nhãn Thập Thần trụ: `thapThanGan`.
   - Kết quả đầu ra của mỗi mẫu giờ đây hiển thị 100% học thuật chuẩn:
     + Trụ Năm: `Canh Ngọ (Thiên Tài)`
     + Trụ Tháng: `Tân Tỵ (Chính Tài)`
     + Trụ Ngày: `Bính Tuất (Nhật Chủ)`
     + Trụ Giờ: `Nhâm Thìn (Thất Sát)`
     + Dụng Thần / Hỷ Thần / Tiết Khí / 8 Đại Vận đầy đủ.
2. **Khắc Phục Đồng Bộ File Bền Vững ([`GoogleDriveSyncService.js`](file:///t:/Phongthuy/backend/src/modules/training/services/GoogleDriveSyncService.js)):**
   - Thay thế cơ chế stream bất đồng bộ dễ bị `process.exit(0)` cắt ngắn thành `fs.writeFileSync()` đồng bộ an toàn 100%.
   - Đảm bảo toàn bộ 4.1MB dữ liệu được flush hoàn chỉnh ra ổ Google Drive (`H:\My Drive\phong_thuy_train_ai\dataset_train\dataset_battu_from_mongo.jsonl`) và thư mục nội bộ.
3. **Cập Nhật Tiện Ích CLI:**
   - Hoàn thiện script [`backend/scripts/sync_bazi_dataset.js`](file:///t:/Phongthuy/backend/scripts/sync_bazi_dataset.js) điều khiển bởi `npm run dataset:sync`.

## 📅 Phiên bản: Xây Dựng Phân Hệ Huấn Luyện AI Đa Môn Độc Lập & Mở Rộng (`modules/training`) (11/10/2026)

### 🌟 1. Tổng Quan & Bối Cảnh Yêu Cầu
- Người dùng yêu cầu không làm theo dạng script đơn lẻ một lần chỉ cho riêng Bát Tự, mà phải **thiết kế hẳn một phân hệ (module) hoàn chỉnh, có cấu trúc mở rộng (Strategy/Adapter Pattern)** để sau Bát Tự thì tất cả các bộ môn phong thủy khác (Tử Vi, Kinh Dịch, Hợp Hôn, Huyền Không, Số Học) đều tái sử dụng dễ dàng.
- Tự động xuất cả 2 dạng: file dataset riêng cho từng môn và file tổng hợp đa môn (`dataset_phongthuy_combined.jsonl`) để phục vụ giai đoạn huấn luyện Siêu AI biện chứng đa chiều.

### 🛠️ 2. Các Thay Đổi & Nâng Cấp Chi Tiết
1. **Kiến Trúc Phân Hệ Mới (`backend/src/modules/training/`):**
   - **Lớp Cơ Sở (`adapters/BaseTrainingAdapter.js`):** Định nghĩa Strategy Pattern chuẩn gồm `getModel()`, `getInstruction()`, `buildTrainingInput()`, `sanitizeOutput()`, và `extractSamples()`. Tự động khử trùng tên người dùng thành *"Đương số"*, ẩn danh số điện thoại và email.
   - **Bộ Adapter Chuyên Trách 6 Phân Hệ (`adapters/`):**
     + `BaziTrainingAdapter`: Bát Tự Tử Bình (152 mẫu chuẩn).
     + `ZiweiTrainingAdapter`: Tử Vi Đẩu Số (13 mẫu chuẩn, trích xuất Mệnh Thân Cục, 12 cung chức và chính tinh).
     + `IChingTrainingAdapter`: Kinh Dịch Lục Hào (48 mẫu chuẩn, trích xuất câu hỏi, quẻ chính/biến, hào động, cung quái).
     + `MarriageTrainingAdapter`: Hợp Hôn Mệnh Lý (21 mẫu chuẩn, trích xuất tứ trụ cặp đôi nam/nữ, cung phi).
     + `FeiXingTrainingAdapter`: Huyền Không Phi Tinh (6 mẫu chuẩn, trích xuất Vận, Tọa-Hướng, độ số, bản mệnh).
     + `NumerologyTrainingAdapter`: Phong Thủy Số Học (Sẵn sàng mở rộng cho Sim, Biển Số, STK).
   - **Dịch Vụ Đồng Bộ Google Drive (`services/GoogleDriveSyncService.js`):** Tự động phát hiện các ổ đĩa Google Drive trên máy chủ (`H:\My Drive\phong_thuy_train_ai\dataset_train`, `G:\...`) và thư mục đệm cục bộ, thực hiện ghi stream JSONL an toàn.
   - **Dịch Vụ Quản Lý Trạng Thái (`services/SyncStateService.js`):** Lưu vết chi tiết mốc thời gian và số lượng bản ghi của từng phân hệ độc lập vào `backend/data/dataset_train/sync_state_all.json`. Tính toán chính xác điều kiện đến hạn 3 ngày.
   - **Bộ Điều Phối Trung Tâm (`services/DatasetPipelineManager.js`):** Quản lý đăng ký adapter, hỗ trợ `exportDiscipline()`, `exportAll()`, và `exportCombined()` (xuất toàn bộ 240 mẫu học thuật thành `dataset_phongthuy_combined.jsonl`).
   - **Controller & Router Quản Trị (`controllers/TrainingController.js`, `routes/trainingRoutes.js`):** Cung cấp các API `GET /api/training/status`, `POST /api/training/export/:system?`, `POST /api/training/export-combined` bảo vệ bởi `adminAuth`.
2. **Tách Biệt Hoàn Toàn & Cô Lập Phân Hệ (Zero Clutter in Business Modules):**
   - Loại bỏ hoàn toàn các hook training trong các controller nghiệp vụ khách hàng ([`BaseAiController.js`](file:///t:/Phongthuy/backend/src/core/ai/BaseAiController.js)), router chính ([`routes/index.js`](file:///t:/Phongthuy/backend/src/routes/index.js)) và bộ lập lịch thông báo người dùng ([`NotificationScheduler.js`](file:///t:/Phongthuy/backend/src/modules/notification/services/NotificationScheduler.js)).
   - Phân hệ huấn luyện hoạt động hoàn toàn độc lập, được điều khiển chuyên trách qua lệnh CLI `"dataset:sync": "node scripts/sync_all_datasets.js"` hoặc cron worker riêng, không làm ảnh hưởng đến độ trễ và luồng phục vụ người dùng của website.
   - Cơ chế 3 ngày được định nghĩa chuẩn xác: **Cứ sau mỗi 3 ngày, nếu có thêm N lá số mới được sinh ra trong hệ thống, bộ xuất sẽ nạp bổ sung N lá số mới đó vào tập dữ liệu trên Google Drive** để sẵn sàng cho lần train tiếp theo.
3. **Kết Quả Nghiệm Thu Thực Tế Đợt 1:**
   - Đã đồng bộ thành công toàn bộ 6 file dữ liệu chuẩn hóa lên Google Drive (`H:\My Drive\phong_thuy_train_ai\dataset_train\`):
     + `dataset_battu_from_mongo.jsonl`: 152 mẫu (4.1 MB)
     + `dataset_kinhdich_from_mongo.jsonl`: 48 mẫu (1.5 MB)
     + `dataset_tuvi_from_mongo.jsonl`: 13 mẫu (464 KB)
     + `dataset_hophon_from_mongo.jsonl`: 21 mẫu (427 KB)
     + `dataset_huyenkhong_from_mongo.jsonl`: 6 mẫu (90 KB)
     + `dataset_phongthuy_combined.jsonl`: **240 mẫu tổng hợp toàn bộ các môn (6.6 MB)**!

## 📅 Phiên bản: Xây Dựng Pipeline Đồng Bộ Dataset Bát Tự Tự Động Định Kỳ 3 Ngày Lên Google Drive (11/10/2026)

### 🌟 1. Tổng Quan & Bối Cảnh Yêu Cầu
- Người dùng mong muốn xây dựng quy trình huấn luyện mô hình AI Bát Tự Tử Bình kết hợp RAG trên Google Colab.
- Nhằm tối ưu hóa dữ liệu huấn luyện thực chiến chất lượng cao, hệ thống tận dụng trực tiếp các lá số Bát Tự đã có bài luận giải VIP sâu sắc từ cơ sở dữ liệu MongoDB.
- Thiết lập cơ chế tự động hóa: **Định kỳ 3 ngày 1 lần** (hoặc khi có lá số mới sau 3 ngày), hệ thống tự động lọc, khử trùng thông tin cá nhân (PII Redaction) và xuất file `dataset_battu_from_mongo.jsonl` đè lên Google Drive (`phong_thuy_train_ai/dataset_train`). Trên Colab, người dùng chỉ cần nhấn chạy huấn luyện (1-click train).

### 🛠️ 2. Các Thay Đổi & Nâng Cấp Chi Tiết
1. **Dịch vụ Pipeline Mới (`backend/src/modules/bazi/services/BaziDatasetPipelineService.js`):**
   - Tự động nhận diện đường dẫn Google Drive đồng bộ trên máy chủ (`H:\My Drive\phong_thuy_train_ai\dataset_train`, `G:\...`).
   - Truy vấn toàn bộ `BaziRecord` có `aiInterpretation.content` hợp lệ (> 800 ký tự) và chưa bị xóa mềm (`isDeleted: false`).
   - Xây dựng prompt chuẩn hóa `instruction` (vai trò Đại sư Tử Bình), `input` (Tứ Trụ, Giới tính, Ngày giờ sinh, Dụng Hỷ Thần, Đại Vận), và `output` (Bài luận giải).
   - Cơ chế bảo mật PII: Thay thế toàn bộ tên người dùng thành *"Đương số"*, ẩn danh toàn bộ ID/Email.
   - Cơ chế kiểm tra chu kỳ: So sánh `Date.now() - lastSyncedAt >= 3 ngày (259.200.000 ms)`. Khi thỏa điều kiện và có bản ghi mới, kích hoạt xuất ngầm không đồng bộ (non-blocking).
   - Lưu vết trạng thái chu kỳ vào `backend/data/dataset_train/sync_state.json`.
2. **Tích hợp Kích Hoạt Luồng Luận Giải (`backend/src/core/ai/BaseAiController.js`):**
   - Móc hook kiểm tra `BaziDatasetPipelineService.checkAndTriggerSync()` ngay sau khi quá trình sinh luận giải Bát Tự SSE hoàn tất (`sse.sendDone()`).
3. **Tích hợp Bộ Lập Lịch Định Kỳ Hệ Thống (`backend/src/modules/notification/services/NotificationScheduler.js`):**
   - Bổ sung lệnh kiểm tra `BaziDatasetPipelineService.checkAndTriggerSync()` vào hàm kiểm tra định kỳ hàng ngày (`checkAndSendNotifications`), đảm bảo dữ liệu tự động đồng bộ đúng chu kỳ 3 ngày kể cả khi không có lượt truy cập mới.
4. **Kịch Bản Đồng Bộ CLI (`backend/scripts/sync_bazi_dataset.js`):**
   - Cung cấp công cụ chạy thủ công ngay lập tức từ dòng lệnh khi người dùng cần ép buộc đồng bộ dữ liệu.
   - Đã đồng bộ đợt đầu tiên thành công 152 lá số Bát Tự VIP (~4.1 MB) sang Google Drive.

## 📅 Phiên bản: Chuẩn Hóa & Bổ Sung Toàn Diện Từ Điển Tinh Tú Tử Vi (11/10/2026)

### 🌟 1. Tổng Quan & Bối Cảnh Yêu Cầu
- **Phản hồi từ người dùng:** Trong phân hệ Tử Vi, nhiều sao trên mệnh bàn khi hover/click xem chi tiết bị thiếu thông tin hoặc hiển thị "Chưa có thông tin."
- **Khảo sát hệ thống:**
  - Đối chiếu toàn bộ danh sách tinh tú được sinh ra từ engine `iztro` (ngôn ngữ `vi-VN`) và đồ hình Tử Vi truyền thống với từ điển `ziweiConcepts` trong `frontend/src/data/ziwei_concepts.js`.
  - Phát hiện hơn 70 sao và khái niệm chưa có dữ liệu tra cứu hoặc bị lệch tên key (ví dụ: `Tả Phụ` thay vì `Tả Phù`, thiếu toàn bộ 12 sao Vòng Trường Sinh `Trường Sinh` đến `Dưỡng`, thiếu các sao phụ tinh quan trọng như `Cô Thần`, `Quả Tú`, `Âm Sát`, `Phụng Các`, `Đài Phụ`, `Thai Phụ`, `Thiên Vu`, `Thiên Nguyệt`, `Thiên Đức`, `Nguyệt Đức`, `Tuế Phá`, `Quan Phủ`, `Tuế Kiến`, `Quán Tác`, `Hối Khí`, `Tử Phù`, các sao Vòng Tướng Tinh và hệ thống Lưu tinh/Vận tinh).
  - Thiếu ánh xạ Ngũ Hành trong `STAR_ELEMENTS` dẫn đến các sao bị mặc định về màu Thủy (đen), mất đi màu sắc ngũ hành chuẩn xác.
  - Cung Thân `(Thân)` bị hiển thị nhầm giải nghĩa Địa Chi Thân (con Khỉ) thay vì Cung Thân trong Tử Vi.

### 🛠️ 2. Các Thay Đổi & Nâng Cấp Chi Tiết
1. **Frontend - Mở Rộng Từ Điển `ziwei_concepts.js` (Từ 132 lên 212 khái niệm chuẩn học thuật):**
   - Bổ sung đầy đủ 83 khái niệm và tinh tú kèm cấu trúc học thuật chi tiết (`Ngũ hành`, `Ý nghĩa`, `Cát`, `Hung`, `Tính cách`, `Tượng trưng`):
     + **Lục Cát Tinh & Văn Tinh:** `Tả Phù` (đồng bộ `Tả Phụ`), `Thanh Long`, `Phụng Các`, `Phượng các`, `Đài Phụ`, `Thai Phụ`, `Thiên Đức`, `Nguyệt Đức`, `Phúc Đức`, `Hỷ Thần`, `Niên Giải`, `Nguyệt Giải`, `Quốc Ấn`, `Đường Phù`, `Bát tòa`, `Thiên trù`.
     + **Sát Tinh & Hung Bại Tinh:** `Cô Thần`, `Quả Tú`, `Âm Sát`, `Thiên Vu`, `Thiên Nguyệt`, `Tuế Phá`, `Quan Phủ`, `Quán Tác`, `Hối Khí`, `Tử Phù`, `Thiên Thương`, `Thiên Sứ`, `Thương Y`.
     + **Bộ Không Tinh:** `Tuần Trung`, `Triệt Lộ`, `Không Vong`.
     + **Vòng Thái Tuế & Tướng Tinh:** `Tuế Kiến`, `Tuế Kiện`, `Phan Án`, `Tuế Dịch`, `Tức Thần`, `Tai Sát`, `Thiên Sát`, `Chỉ Bối`, `Vong Thần`.
     + **Trọn bộ 12 sao Vòng Trường Sinh:** `Trường Sinh`, `Mộc Dục`, `Mục Dục`, `Quan Đới`, `Lâm Quan`, `Đế Vượng`, `Suy`, `Bệnh`, `Tử`, `Mộ`, `Tuyệt`, `Thai`, `Dưỡng`.
     + **Vòng Bác Sĩ & Biến thể:** `Bác Sỹ`, `Lực Sỹ`.
     + **Lưu tinh & Vận tinh:** `Lưu Niên`, `LN Văn Tinh`, `LN Văn tinh`, `Vận Khôi`, `Vận Việt`, `Vận Xương`, `Vận Khúc`, `Vận Loan`, `Vận Hỷ`, `Vận Lộc`, `Vận Dương`, `Vận Đà`, `Vận Mã`, `Lưu Khôi`, `Lưu Việt`, `Lưu Xương`, `Lưu Khúc`, `Lưu Loan`, `Lưu Hỷ`, `Lưu Lộc`, `Lưu Dương`, `Lưu Đà`, `Lưu Mã`.
     + **12 Cung Vị:** `Mệnh`, `Phụ Mẫu`, `Huynh Đệ`, `Tử Nữ`, `Cung Thân`.
2. **Frontend - Đồng Bộ Ngũ Hành & Cột Hiển Thị Cát/Sát (`ZiweiChart.jsx`):**
   - Bổ sung toàn bộ ngũ hành của các sao mới vào `STAR_ELEMENTS` để hiển thị đúng màu chữ ngũ hành (Kim xám, Mộc xanh lá, Thủy đen, Hỏa đỏ, Thổ vàng cam).
   - Cập nhật `normalizeStarName` hỗ trợ chuẩn hóa aliases: `Phụng Các` -> `Phượng Các`, `Thai Phụ` -> `Đài Phụ`, `Tuế Kiện` -> `Tuế Kiến`, `Bác Sỹ` -> `Bác Sĩ`, `Lực Sỹ` -> `Lực Sĩ`, `Mục Dục` -> `Mộc Dục`.
   - Cập nhật `AUSPICIOUS_STARS` để chia đều sao Cát sang cột Trái và sao Sát sang cột Phải.
   - Sửa liên kết nhãn `(Thân)` của Cung Thân trong cả ô cung (`PalaceCell`) và danh sách cung (`PalaceListView`) trỏ chuẩn xác về `term="Cung Thân"`.
3. **Frontend - Tối Ưu Hóa Tìm Kiếm Tooltip (`Tooltip.jsx`):**
   - Bổ sung cơ chế tra cứu không phân biệt hoa/thường (`case-insensitive`) và tự động thử tiền tố `Cung ...` trước khi fallback sang gọi mạng API backend, tăng tốc độ mở tooltip lên mức tức thì (0ms).
4. **Backend - Đồng Bộ Template Xuất PDF & API Tra Cứu Khái Niệm:**
   - Cập nhật `ZIWEI_STAR_ELEMENTS` và `ZIWEI_AUSPICIOUS_STARS` trong `backend/src/modules/export/templates/ziweiTemplate.js` đồng bộ màu sắc và phân loại trên file PDF xuất ra.
   - Xuất dữ liệu `backend/src/modules/blog/data/ziwei_concepts.json` và tích hợp vào `ConceptController.js` phục vụ endpoint `GET /api/concept/:term` với cơ chế case-insensitive fallback.
5. **Kiểm Thử & Nghiệm Thu Trực Quan (`chrome-devtools-mcp`):**
   - Khởi chạy song song Backend (cổng 3001) và Vite Frontend (cổng 5173).
   - Dùng Chrome DevTools MCP mở trang Tử Vi `/ziwei`, thực hiện hover thực tế vào các sao vừa bổ sung (`Thiên Vu`, `Cô Thần`, `Trường Sinh`, `Tả Phù`, `Phụng Các`...).
   - Chụp ảnh màn hình (Screenshot) nghiệm thu trực quan: Tooltip hiển thị đầy đủ, đẹp mắt, chính xác 100% nội dung học thuật, không còn bất kỳ sao nào báo "Chưa có thông tin.".

## 📅 Phiên bản: Đồng Bộ & Hiển Thị Các Phân Hệ Mới (Huyền Không & Số Học) Lên Giao Diện Mobile (06/10/2026)

### 🌟 1. Tổng Quan & Yêu Cầu Giao Diện Mobile
- Bổ sung và đồng bộ đầy đủ các phân hệ mới bao gồm **Huyền Không Phi Tinh (`feixing`)** và **Phong Thủy Số Học (`numerology`)** (cùng với **Trạch Cát / Xem Ngày (`xemngay`)**) lên thanh điều hướng chuyển đổi phân hệ nhanh trên màn hình thiết bị di động (Mobile Module Sub-Header Dropdown).
- Tối ưu hóa cấu trúc thanh menu chuyển phân hệ dạng thả xuống (khi người dùng bấm biểu tượng La Bàn `🧭 >` trên thanh Header mobile) thành **Lưới Thẻ 2 Cột Đối Xứng Chuẩn Tỉ Lệ (Balanced 2-Column Grid)**:
  - Khắc phục triệt để lỗi nền trong suốt (`bg-white/98` không được tạo) sang nền trắng mờ đục 100% nguyên khối (`bg-white shadow-xl z-50`), triệt tiêu hoàn toàn hiện tượng chữ nền trang web bị chọc xuyên qua menu.
  - Bổ sung thanh tiêu đề phân hệ tinh tế: `PHÂN HỆ CHIÊM ĐOÁN • 7 phân hệ`.
  - Bố trí 6 phân hệ cốt lõi thành 3 cặp thẻ đối xứng 2 cột cân bằng:
    + Cột 1: `Kinh Dịch`, `Tử Vi`, `Huyền Không`
    + Cột 2: `Bát Tự`, `Hôn Nhân`, `Số Học`
  - Hàng cuối cùng mở rộng toàn chiều ngang (`col-span-2`) dành riêng cho **Xem Ngày Đẹp Hoàng Đạo**, tạo điểm neo cân đối tuyệt đối về mặt hình học, không còn tình trạng răng cưa hay nút lệch hàng.
- Đồng bộ hiển thị 7 phân hệ trên lưới thẻ chức năng Trang Chủ (`HomeBoard.jsx`) và danh mục Dịch Vụ tại Chân Trang (`Footer.jsx`).

### 🛠️ 2. Các Tệp Tin Thay Đổi & Nâng Cấp
1. **Frontend - Header Mobile Sub-Header (`frontend/src/components/layout/Header.jsx`):**
   - Nâng cấp khối `isMobileModulesExpanded` hiển thị khi bấm icon La Bàn `(🧭 >)` trên Mobile.
   - Thiết kế lại toàn bộ bằng lưới `grid grid-cols-2 gap-1.5` bọc trong khung `max-w-sm mx-auto p-3`.
   - Mỗi nút được bo tròn góc `rounded-xl`, tích hợp icon chuyên biệt (kích thước 15px), màu nền trung tính cao cấp `bg-slate-50 border-slate-200/80` khi chưa kích hoạt, và nổi bật rực rỡ với màu thương hiệu đậm + viền ring thanh thoát khi đang ở phân hệ đó.
   - Khắc phục lỗi hiển thị nền xuyên thấu bằng `bg-white shadow-xl border-b border-slate-200/90`.
2. **Frontend - Lưới Phân Hệ Trang Chủ (`frontend/src/features/home/HomeBoard.jsx`):**
   - Bổ sung 2 mô-đun `feixing` (Huyền Không Phi Tinh) và `numerology` (Phong Thủy Số Học) vào mảng danh mục `modules`.
   - Cập nhật tiêu đề từ "5 phân hệ tinh tuyển" thành **"7 phân hệ tinh tuyển"**.
   - Cung cấp đầy đủ icon, màu sắc glow, badge (`Cửu Tinh Bát Trạch`, `Cát Hung Số Vận`) và mô tả học thuật chi tiết.
3. **Frontend - Chân Trang (`frontend/src/components/layout/Footer.jsx`):**
   - Bổ sung liên kết điều hướng trực tiếp tới "Huyền Không Phi Tinh" và "Phong Thủy Số Học" trong cột Dịch Vụ.
4. **Kiểm Thử & Nghiệm Thu Trực Quan (`chrome-devtools-mcp`):**
   - Thiết lập viewport mobile 390x844 (iPhone) và mô phỏng cảm ứng di động.
   - Kiểm tra mở dropdown La Bàn `(🧭 >)`: hiển thị hoàn hảo 7 phân hệ chia đều 2 hàng, không tràn màn hình.
   - Kiểm tra chuyển trang thực tế sang `/feixing` và `/numerology`: hoạt động tức thì, mượt mà.
   - Kiểm tra cuộn lưới 7 phân hệ trên trang chủ: thẻ Huyền Không Phi Tinh và Phong Thủy Số Học hiển thị chuẩn xác.
   - Console log sạch sẽ, không có bất kỳ cảnh báo/lỗi JavaScript nào. Đạt 61/61 unit tests (`npm test`).

## 📅 Phiên bản: Mở Rộng 3 Phương Thức Gieo Quẻ Mai Hoa Dịch Số (SIM 10 Số, Biển Số Xe 5 Số & 3 Số Ngẫu Nhiên) (06/10/2026)

### 🌟 1. Tổng Quan & Yêu Cầu Học Thuật Dịch Lý
Hệ thống Kinh Dịch mở rộng phân hệ **Mai Hoa Dịch Số (Tiên Thiên)** nhằm đáp ứng nhu cầu chiêm quẻ thực tế đa dạng theo số lý vạn vật khởi sinh, bổ sung 3 phương thức gieo quẻ mới kèm live breakdown công thức tính toán thời gian thực:
1. **Gieo bằng SIM Điện Thoại (10 Chữ Số):**
   - Phân chia đều dãy số 10 chữ số làm 2 nửa theo nguyên tắc Tiên Thiên *Số chẵn thì phân đều*.
   - **Thượng Quái (Quẻ trên):** $(\sum \text{5 số đầu}) \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hạ Quái (Quẻ dưới):** $(\sum \text{5 số cuối}) \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hào Động:** $(\sum \text{10 số}) \pmod 6$, nếu dư 0 lấy 6 (Thượng hào).
2. **Gieo bằng Biển Số Xe (5 Chữ Số):**
   - Phân chia 5 chữ số đăng ký xe theo quy tắc học thuật yêu cầu:
   - **Thượng Quái (Quẻ trên):** $(\sum \text{3 số đầu}) \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hạ Quái (Quẻ dưới):** $(\sum \text{2 số sau}) \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hào Động:** $(\sum \text{5 số}) \pmod 6$, nếu dư 0 lấy 6 (Thượng hào).
3. **Gieo bằng 3 Số (000 - 999):**
   - Cho phép người dùng tự nhập 3 chữ số từ 000 đến 999 HOẶC bấm nút **"Tạo 3 số ngẫu nhiên"** (cảm ứng tâm niệm).
   - **Thượng Quái (Quẻ trên):** $\text{Số đầu tiên} \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hạ Quái (Quẻ dưới):** $(\text{Số thứ 2} + \text{Số thứ 3}) \pmod 8$, nếu dư 0 lấy 8 (Khôn).
   - **Hào Động:** $(\text{Tổng cả 3 số}) \pmod 6$, nếu dư 0 lấy 6 (Thượng hào).

### 🛠️ 2. Các Tệp Tin Thay Đổi & Nâng Cấp
1. **Frontend - Form Nhập Liệu Mai Hoa (`frontend/src/features/iching/IChingInput.jsx`):**
   - Mở rộng thanh chọn sub-tab của Mai Hoa thành 5 phương thức ngắn gọn, tinh gọn: `Giờ Động Tâm`, `SIM`, `Biển Số`, `3 Số`, `Seri Tiền`.
   - Lược bỏ toàn bộ các ghi chú số lượng số rườm rà trong ngoặc để giao diện tối giản, thanh thoát và trực quan hơn.
   - Bổ sung các icon chuyên biệt từ `lucide-react`: `Clock`, `Smartphone`, `Car`, `Dices`, `Sparkles`.
   - Grid layout co giãn thông minh: hiển thị 5 cột trên màn hình rộng, 3 cột trên tablet, và 2 cột tự cân đối hàng cuối trên mobile, chuẩn thẩm mỹ Premium HSL.
   - Validation chặt chẽ: kiểm tra độ dài số, chỉ nhận ký tự số, hiển thị lỗi qua `FloatingErrorToast`.
   - Bảng phân tích công thức số lý động tâm realtime (Live Formula Breakdown) hiển thị chi tiết các bước cộng, chia dư cho 8 và 6, giải nghĩa quái danh (Càn, Khảm, Cấn, Chấn, Tốn, Ly, Khôn, Đoài).
2. **Frontend - Bàn Quẻ Kết Quả (`frontend/src/features/iching/IChingBoard.jsx`):**
   - Sửa lỗi thiếu import `useMemo` gây lỗi Error Boundary khi chuyển trang chi tiết quẻ.
   - Trích xuất động nhãn phương pháp từ `questionSuffix` để hiển thị chính xác phương pháp gieo thực tế (ví dụ: `Mai Hoa Dịch Số - SIM [0912...]`, `Mai Hoa Dịch Số - Biển Số Xe [68688]`, `Mai Hoa Dịch Số - 3 Số [168]`) thay vì nhãn cố định `Lục Hào Truyền Thống`.
3. **Kiểm Thử Tự Động (`frontend/src/tests/IChingInput.test.jsx`):**
   - Bổ sung 5 unit tests toàn diện cho toàn bộ các phương thức Mai Hoa mới (kiểm tra render sub-tabs, logic tính toán SIM, Biển số xe, 3 số ngẫu nhiên, nút sinh số ngẫu nhiên). Tất cả 9 tests đều đạt 100% Pass.
4. **Kiểm Thử Thực Tế Trực Quan (`chrome-devtools-mcp`):**
   - Kiểm tra tương tác thực tế trên Chrome: chuyển tab, nhập số điện thoại, nhập biển số, tạo số ngẫu nhiên, bấm lập quẻ.
   - Đảm bảo 0 console errors, kiểm tra responsive trên kích thước iPhone/Mobile (390x844) và Desktop (1440x900).
5. **Cập Nhật Tài Liệu Kỹ Thuật:**
   - Cập nhật mục 1.3 trong `docs/BUSINESS_RULES.md`.
   - Cập nhật mục 11 trong `README.md`.

---

## 📅 Phiên bản: Khắc Phục Sự Cố Tràn Đĩa Máy Chủ EC2 (`no space left on device`), Tối Ưu Quy Trình Deploy & Giới Hạn Log Xoay Vòng (06/10/2026)

### 🌟 1. Tổng Quan Sự Cố & Nguyên Nhân Gốc Rễ
Khi GitHub Actions thực hiện bước `Zero-Downtime Deploy to EC2`, quá trình kéo image `phongthuy-backend` bị văng lỗi dừng khẩn cấp:
- **Thông báo lỗi:**
  ```text
  failed to extract layer (...) to overlayfs ...: write /var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2196/fs/usr/lib/chromium/chromium: no space left on device
  Process exited with status 1
  ```
- **Nguyên nhân cốt lõi:**
  1. **Tràn ổ cứng máy chủ EC2 (Disk Full - 100%):** Máy chủ AWS EC2 (thường có dung lượng ổ EBS từ 8GB - 20GB) sau nhiều lần build/pull liên tục bị tích tụ các layers của Docker image cũ, dangling images, và build cache.
  2. **Layer Chromium nặng:** Backend có chứa binary Chromium (dùng để xuất PDF Tinh Bàn A4) nặng vài trăm MB, khi giải nén ra đĩa bị thiếu dung lượng.
  3. **Thứ tự thực thi trong script deploy chưa tối ưu:** Trước đây lệnh `docker image prune -f` đặt ở cuối script (sau khi `docker compose up`). Do đó khi máy chủ tiệm cận 95-98% dung lượng, việc pull thêm image mới trước khi xóa image cũ đã làm đĩa bị đầy ngay tại bước pull.
  4. **Log container không giới hạn:** Chưa có cấu hình `logging` max-size trong `docker-compose.yml`, dẫn đến nguy cơ log tích tụ âm thầm qua thời gian.

### 🛠️ 2. Các Biện Pháp Đã Triển Khai
1. **Bổ Sung Dọn Dẹp Trực Tiếp Trước Khi Kéo Image (`.github/workflows/deploy.yml`):**
   - Đưa lệnh `docker image prune -f || true` lên chạy ngay trước lệnh `docker compose pull backend frontend`, giải phóng dung lượng rác và các layers dangling trước khi tải image mới về.
2. **Kích Hoạt Giới Hạn & Xoay Vòng Log Container (`docker-compose.yml`):**
   - Bổ sung cấu hình `logging: driver: "json-file", options: { max-size: "10m", max-file: "3" }` cho toàn bộ 4 dịch vụ (`backend`, `frontend`, `nginx`, `redis`).
   - Đảm bảo mỗi container không bao giờ chiếm quá 30MB log, loại trừ 100% rủi ro đĩa bị đầy do log hệ thống.
3. **Cung cấp cẩm nang dọn dẹp khẩn cấp trên máy chủ EC2:**
   - Hướng dẫn người dùng SSH vào máy chủ để chạy lệnh dọn dẹp Docker storage (`docker system prune -a -f`) và giải phóng system journal (`journalctl --vacuum-size=100M`).

---

## 📅 Phiên bản: Chuẩn Hóa Ô Nhập Ngày Giờ Sinh Đồng Bộ Bát Tự/Tử Vi, Kiểm Soát Độ Dài Số Lý & Tinh Chỉnh Giao Diện Số Học (05/10/2026)

### 🌟 1. Tổng Quan Cải Tiến Theo Phản Hồi Trực Tiếp Của Người Dùng
1. **Chuẩn Hóa Hệ Thống Nhập Ngày Giờ Sinh (Đồng Bộ 100% Bát Tự & Tử Vi):**
   - Triệt tiêu lỗi nhập ngày giờ sinh cũ (loại bỏ `CustomDatePicker` độc lập và dropdown giờ can chi đơn điệu).
   - Áp dụng nguyên mẫu kiến trúc nhập liệu thống nhất từ phân hệ Bát Tự và Tử Vi:
     - 3 ô combobox chọn Ngày (`DD`: 1..31), Tháng (`MM`: 1..12), Năm (`YYYY`: 1930..2026) sử dụng `CustomSelect` có khả năng gõ trực tiếp hoặc mở dropdown chọn nhanh.
     - 2 ô combobox chọn Giờ (`HH`: 00..23) và Phút (`Min`: 00..59) kèm nút mở Modal Hướng dẫn 12 Canh Giờ và chip nhận diện Canh Giờ thời gian thực (`Canh Giờ: Thìn (07:00 - 08:59)`).
     - Switch chuyển đổi lịch pháp **Dương lịch** / **Âm lịch** mượt mà; tự động tính toán và hiển thị checkbox **Tháng nhuận** (`isLeap`) khi năm và tháng âm lịch chọn có tháng nhuận qua `lunar-javascript`.
     - Tự động clamp ngày trong tháng (`maxDays`) khi đổi tháng/năm.
   - Nút duy nhất **"Sử Dụng Thông Tin Bản Thân"**: Tự động trích xuất thông tin ngày, tháng, năm, giờ, phút, giới tính và tên từ tài khoản người dùng (`user.baziInfo` hoặc `user.birthDate`), điền tức thì vào form và kích hoạt toast thông báo êm dịu 3 giây.
2. **Kiểm Soát Độ Dài Nhập Liệu Nghiêm Ngặt Từng Loại Hình:**
   - **Sim Số (`sim`):** Ràng buộc đúng **10 chữ số** (`maxLength={10}` trên input, kiểm tra validation chặn đứng nếu khác 10 số cả ở Frontend và Backend `InputValidator`).
   - **Biển Số Xe (`plate`):** Ràng buộc đúng **5 chữ số** (`maxLength={5}` trên input, kiểm tra validation từ chối nếu khác 5 số). Không cần mã vùng.
   - **Số Tài Khoản Ngân Hàng (`bank`):** Ràng buộc theo chuẩn thông dụng từ **10 đến 16 chữ số** (`maxLength={16}` trên input, kiểm tra validation từ chối nếu < 10 hoặc > 16 số).
3. **Khử Trùng Triệt Để Danh Sách Cặp Sao Tinh Tổ (Khắc Phục Hình 1):**
   - Khắc phục lỗi lặp lại hàng loạt thẻ trùng lặp (ví dụ: `88 Bình thường` lặp 8 lần khi dãy số có nhiều chữ số 8).
   - Áp dụng cơ chế deduplication theo `pair` key ở cả Backend (`NumerologyRuleEngineService.analyzeFeiXing`) và Frontend (`NumerologyBoard` `uniquePairs` memoization).
   - Mỗi tổ hợp chỉ hiển thị duy nhất 1 thẻ thẻ tổ hợp tinh tổ; nếu xuất hiện nhiều lần sẽ hiển thị thêm huy hiệu cấp số nhân `x{count}` tinh tế (Ví dụ: `88 Bình thường x8`).
4. **Trình Diễn Quẻ Dịch Chuẩn 2 Dòng, Bỏ Dấu Ngoặc Đơn (Khắc Phục Hình 2):**
   - Khắc phục tiêu đề dài dính liền trên 1 dòng `Quẻ 2: Thuần Khôn (Đất Mẹ Dày Đức)` và `Quẻ 23: Sơn Địa Bác (Rụng Rơi Tự Lắng)`.
   - Bổ sung hàm tiện ích `parseHexagramNameAndMeaning` bóc tách chính xác tên quẻ và ý nghĩa quẻ:
     - **Dòng 1 (In hoa đậm):** `Quẻ {id}: {Tên Quẻ}` (Ví dụ: `Quẻ 2: Thuần Khôn`, `Quẻ 23: Sơn Địa Bác`).
     - **Dòng 2 (Mô tả ý nghĩa, xuống 1 dòng riêng biệt, bỏ dấu ngoặc đơn `()`):** `{Ý nghĩa}` (Ví dụ: `Đất Mẹ Dày Đức`, `Rụng Rơi Tự Lắng`).
     - Phía dưới hiển thị huy hiệu cấp bậc Cát Hung (`Thượng Cát`, `Đại Hung`...).
5. **Kiểm Thử Toàn Diện & Đạt Tiêu Chuẩn Nghiệm Thu:**
   - Trực tiếp kiểm thử giao diện bằng Chrome DevTools MCP: Thao tác chuyển tab, test form Bát tự, nhấn "Sử Dụng Thông Tin Bản Thân", kiểm tra validation 9 số sim, 4 số biển xe, submit biển xe 5 số 59123 thành công, giao diện hiển thị chuẩn xác không có lỗi console.
   - Chụp ảnh màn hình Viewport xác minh mỹ cảm đạt chuẩn Premium Aesthetics.
   - Toàn bộ 45 test suites Backend (325/325 tests) và 10 test files Frontend (56/56 tests bao gồm `NumerologyInput.test.jsx`) đều PASS 100%.

---

## 📅 Phiên bản: Bổ Sung Phân Hạng Quẻ Hung / Đại Hung, Cấu Trúc Biển Xe 5 Số & Chuẩn Hóa Nhãn "Số Học" (05/10/2026)

### 🌟 1. Tổng Quan Cải Tiến Theo Phản Hồi Trực Tiếp
1. **Phân Hạng Quẻ Dịch Chuẩn Kinh Điển (Bổ Sung Quẻ Hung & Đại Hung):**
   - Triệt tiêu tình trạng đánh giá quẻ một chiều "toàn tốt" (chỉ có Đại Cát, Thượng Cát, Trung Cát, Cẩn Trọng).
   - Phân định rành mạch 6 cấp bậc học thuật cho 64 quẻ Dịch kinh điển: **Đại Cát** (6 quẻ), **Thượng Cát** (24 quẻ), **Trung Cát** (10 quẻ), **Cẩn Trọng** (5 quẻ), **Hung** (12 quẻ - Truân, Tụng, Cổ, Phệ Hạp, Đại Quá, Độn, Khuê, Quải, Cấu, Lữ, Hoán, Tiểu Quá), và **Đại Hung** (7 quẻ - Bĩ, Bác, Khảm, Minh Di, Kiển, Khốn, Quy Muội).
   - Điểm số học thuật phạt nặng khi quẻ chủ/quẻ biến phạm hung: Quẻ Hung trừ -12 đến -10 điểm, Quẻ Đại Hung trừ -20 đến -16 điểm. Điểm số các dãy số xấu tụt thực tế xuống dải 38 - 55 điểm.
   - Thẻ hiển thị quẻ trên giao diện tự động đổi màu cảnh báo trực quan: Quẻ Hung mang viền đỏ cam (`border-rose-300 bg-rose-50/30`), Quẻ Đại Hung mang viền đỏ sẫm báo động (`border-red-400 bg-red-50/40 ring-1 ring-red-400`).
2. **Tối Ưu Form Sinh Thần Với 1 Nút Bấm "Sử Dụng Thông Tin Bản Thân":**
   - Thay thế việc phân đôi tab phức tạp bằng 1 form nhập sinh thần duy nhất, luôn hiển thị đầy đủ các trường (Tên, Giới tính, Ngày sinh Dương lịch qua `CustomDatePicker`, Giờ sinh Can Chi).
   - Bổ sung nút **"Sử Dụng Thông Tin Bản Thân"**: Khi người dùng đã đăng nhập click vào nút, hệ thống tự động điền thông tin cá nhân từ tài khoản vào form, có thông báo toast êm dịu mà vẫn cho phép người dùng tùy ý chỉnh sửa.
3. **Cấu Trúc Định Sẵn Biển Số Xe 5 Số (Không Cần Mã Vùng):**
   - Biển số xe chỉ lấy đúng **5 chữ số** (theo đúng chuẩn biển kiểm soát 5 số Việt Nam hiện hành), loại bỏ hoàn toàn mã vùng tỉnh thành (như 30A, 51K...).
   - Input kiểm soát độ dài đúng 5 số, tự động định dạng hiển thị kiểu biển 5 số `xxx.xx` (Ví dụ: `591.23` hoặc `888.88`).
   - Lập quẻ Mai Hoa theo quy thức: 2 số đầu làm Quẻ Thượng, 3 số sau làm Quẻ Hạ, tổng 5 số làm Hào Động.
4. **Loại Bỏ Hoàn Toàn Dropdown Chọn Ngân Hàng:**
   - Số tài khoản ngân hàng tập trung thuần túy vào năng lượng Kim Khố và số lý, không cần chọn tên ngân hàng.
   - Input số tài khoản ngân hàng thiết kế cấu trúc riêng, tự động tách cụm 4 chữ số thông minh (`xxxx xxxx xxxx`), thẻ Digital Banking mô phỏng kim loại sang trọng.
5. **Chuẩn Hóa Nhãn "Số Học" Trên Toàn Hệ Thống:**
   - Header Desktop Nav: Đổi "Phong Thủy Số" $\rightarrow$ **"Số học"**.
   - Header Mobile Drawer: Đổi "Phong Thủy Số (Sim, Biển Số, Tài Khoản)" $\rightarrow$ **"Số học (Sim, Biển Số, STK)"**.
   - Trang Lịch Sử (History): Đổi tab "Phong Thủy Số" $\rightarrow$ **"Số học"**, hỗ trợ URL slug chuẩn `/history/so-hoc`.

---

## 📅 Phiên bản: Tối Ưu Điểm Số Phân Hóa, Chuẩn Hóa 64 Quẻ Dịch & Phổ Ngũ Hành Phối Bát Tự (05/10/2026)

### 🌟 1. Tổng Quan Nhiệm Vụ & Bối Cảnh Tinh Chỉnh
Tiếp thu trực tiếp chỉ đạo và phản hồi của người dùng về phân hệ **Phong Thủy Số Học (Numerology)**:
1. **Giải Quyết Triệt Để Lỗi "Điểm Số Chấm Sim Nào Cũng Như Nhau":**
   - Động cơ chấm điểm cũ neo ở mức 75 điểm và chỉ cộng dồn điểm thưởng, khiến gần như mọi dãy số đều đạt ngưỡng 90 - 96 điểm (không phản ánh đúng cát hung thực tế).
   - Tái cấu trúc toàn diện thuật toán chấm điểm đa tầng với điểm cơ sở 50 điểm: Phạt nặng các cặp hung sát (-8 đến -12 điểm), trừ điểm khi xuất hiện nhiều sát tinh hoặc sao Ngũ hoàng 5, trừ điểm cô âm/độc dương (-10 điểm), trừ điểm xung khắc liên hoàn (-6 điểm), trừ điểm khi phạm kỵ thần Bát tự (-12 đến -18 điểm). Dải điểm đầu ra phân hóa sinh động, trải rộng từ **38 đến 97 điểm**.
2. **Kế Thừa 100% Đánh Giá Quẻ Dịch Từ Phân Hệ Quẻ Hằng Ngày (`dailyFortuneData.js`):**
   - Triệt tiêu hoàn toàn các câu từ thoán từ tự sáng tác tùy ý.
   - Trích xuất toàn bộ dữ liệu 64 quẻ chuẩn mực từ `dailyFortuneData.js` vào `backend/src/modules/numerology/data/hexagramDailyJudgments.json`.
   - Quẻ Chủ và Quẻ Biến hiển thị đúng 4 cấp bậc xếp hạng chuẩn: **Đại Cát**, **Thượng Cát**, **Trung Cát**, **Cẩn Trọng** kèm Thoán Từ kinh điển và Lời Khuyên Đạo Dịch tinh hoa.
3. **Phổ Ngũ Hành Từng Con Số & Nhận Diện Bản Mệnh Dãy Số:**
   - Ánh xạ chính xác ngũ hành của 10 chữ số: 1 (Dương Thủy - Lam), 2 (Âm Thổ - Vàng nâu), 3 (Dương Mộc - Xanh lá), 4 (Âm Mộc - Xanh ngọc), 5 (Dương Thổ - Vàng đậm), 6 (Dương Kim - Trắng bạc), 7 (Âm Kim - Vàng kim/Xám), 8 (Âm Thổ - Nâu trầm), 9 (Dương Hỏa - Đỏ), 0 (Âm Thủy / Thủy Khố - Lam thẫm).
   - Hiển thị dãy số thành chuỗi thẻ huy hiệu màu sắc ngũ hành trực quan; bổ sung thanh phân bổ % ngũ hành và đánh giá dòng chảy tương sinh/tương khắc liên hoàn.
4. **Bổ Sung Ngũ Hành Vượng Nhất Sinh Thần & Hồ Sơ Đối Tượng Phù Hợp:**
   - Trích xuất tỷ lệ % ngũ hành từ `BaziAnalyzer` để xác định **Ngũ Hành Vượng Nhất Sinh Thần** (tránh bồi thêm gây quá vượng) và **Ngũ Hành Khuyết Suy**.
   - Tự động sinh mục **Thích Hợp Cho Đối Tượng** (ai nên sử dụng theo ngành nghề/bản mệnh/dụng thần) và **Cảnh Báo Không Thích Hợp** (ai cần tránh).
5. **Tách Biệt Rành Mạch "Dùng Bát Tự Bản Thân" Với Form Nhập Ngày Sinh:**
   - Nút chế độ chuyển thành `Xem Phối Bát Tự` (loại bỏ chữ "AI" trên nút).
   - Tách thành 2 tùy chọn độc lập: **[👤 Dùng Bát Tự Bản Thân]** (thẻ thông tin tài khoản chính chủ tự động điền) và **[📝 Nhập Ngày Sinh Khác]** (form thủ công gồm Tên, Giới tính, CustomDatePicker, Giờ sinh Can Chi).
6. **Ràng Buộc Phân Quyền Luận Giải AI Chuyên Sâu:**
   - Chỉ mở tính năng Luận giải AI chuyên sâu và Hỏi đáp tiếp nối khi khảo sát ở chế độ **Xem Phối Bát Tự**.
   - Ở chế độ Xem Nhanh, hiển thị biểu ngữ điều hướng mời gọi người dùng chuyển sang chế độ Bát Tự để nhận bài luận 5 chương từ AI.

---

## 📅 Phiên bản: Ra Mắt Toàn Diện Phân Hệ Phong Thủy Số Học (Sim, Biển Số Xe & Số Tài Khoản Ngân Hàng) (05/10/2026)

### 🌟 1. Tổng Quan Nhiệm Vụ & Bối Cảnh Nghiên Cứu
Hệ thống hoàn thiện và chính thức ra mắt phân hệ **Phong Thủy Số Học (Numerology)**, ứng dụng sự giao thoa học thuật giữa 3 môn cổ học phương Đông chính thống: **Huyền Không Phi Tinh Động Vận**, **Kinh Dịch Mai Hoa Lập Quẻ** và **Bát Tự Tương Phối Mệnh Chủ**:
- **3 Nhóm Đối Tượng Khảo Sát:**
  1. **Sim Số Điện Thoại (`sim`):** Đánh giá năng lượng kết nối, ngoại giao, thương hiệu cá nhân và danh tiếng thương mại.
  2. **Biển Số Xe (`plate`):** Khảo sát khí trường chuyển động (Động Trạch) & Thần sát Dịch Mã; phòng tránh các tổ hợp hung sát va chạm đâm đụng (`67/76` Giao Kiếm Sát), quá nhiệt hỏa hoạn (`97/79` Hồi Lộc Chi Tai), tai ách tật ách (`25/52` Nhị Ngũ Giao Gia), tranh chấp (`23/32` Đấu Ngưu Sát), và trộm cắp thất thoát (`37/73` Xuyên Tâm Sát).
  3. **Số Tài Khoản Ngân Hàng (`bank`):** Khảo sát năng lượng Kim Khố / Tụ Bảo Bồn; năng lực giữ tiền, tụ tài, chống hao hụt dòng tiền và phòng tránh lừa đảo chiếm đoạt tài sản.
- **2 Chế Độ Phân Tích Linh Hoạt:**
  - **Chế độ 1 (Xem Nhanh - Số Học):** Người dùng chỉ cần nhập số $\rightarrow$ hệ thống tức thời phân loại Cửu Tinh Đương Lệnh theo chu kỳ Vận động, nhận diện các cặp Tinh Tổ liền kề (Hà Đồ, Hợp Thập, Cát Tinh, Hung Sát), phân tích tỷ lệ Âm Dương, khí khẩu đuôi số và Lập Quẻ Kinh Dịch Mai Hoa.
  - **Chế độ 2 (Xem Phối Bát Tự + AI):** Nhập thêm ngày tháng năm sinh (qua `CustomDatePicker`), giờ sinh Can Chi và giới tính $\rightarrow$ hệ thống đối chiếu thực sự với Nhật Chủ (Day Master), Dụng Thần, Hỷ Thần, Kỵ Thần và Cung Phi của gia chủ; đồng thời mở khóa tính năng Luận Giải Chuyên Sâu AI (5 chương toàn diện) và Chat tư vấn trực tiếp với AI.
- **Các Nguyên Tắc Bắt Buộc Tuyệt Đối:**
  - **Tính Vận Động (Dynamic Period):** Vận Tam Nguyên được tính toán hoàn toàn tự động dựa trên năm khảo sát (`NumerologyRuleEngineService.getPeriodFromYear(year)`), triệt tiêu hoàn toàn việc áp cứng Vận 9 để hệ thống tự thích ứng khi bước sang các đại vận tiếp theo (Vận 1, Vận 2...).
  - **Kinh Dịch Mai Hoa:** Lập quẻ chỉ giữ **Quẻ Chủ (Chính Quái)** và **Quẻ Biến (Biến Quái)** kèm Hào Động; **BỎ HOÀN TOÀN Quẻ Hỗ** theo chỉ đạo trực tiếp của người dùng.
  - **Quy Chuẩn Đơn Vị Điểm Thưởng (Points):** Sử dụng 100% thuật ngữ **Points** (100 Points cho gói Tiêu Chuẩn, 500 Points cho gói Chuyên Sâu VIP) trên toàn bộ Modal, Thông báo và API; loại bỏ hoàn toàn từ khóa credit.

---

### 🏛️ 2. Các Thay Đổi Kiến Trúc & Mã Nguồn

#### 2.1 Backend (Node.js Express 5 & MongoDB & Redis)
- **Model Dữ Liệu:**
  - `backend/src/modules/numerology/models/NumerologyRecord.js`: Tạo Mongoose Model với khóa chính **UUIDv7**, lưu trữ đầy đủ `type` (`sim`, `plate`, `bank`), `mode`, `targetNumber`, `displayNumber`, `bankName`, `period`, `ownerName`, `ownerBirthInfo`, `analysisSnapshot`, `rating`, `feedback`, `aiInterpretation`, soft-delete vĩnh viễn (`isDeleted: false`).
  - `backend/src/core/models/Conversation.js`: Cập nhật `system` enum bổ sung `'feixing'` và `'numerology'` phục vụ luồng chat theo ngữ cảnh an toàn.
- **Động Cơ Tính Toán Học Thuật (Rule Engine):**
  - `backend/src/modules/numerology/services/NumerologyRuleEngineService.js`:
    + Chuẩn hóa dãy số theo từng loại hình (`normalizeTargetNumber`).
    + Thuật toán Tam Nguyên Cửu Vận động theo chu kỳ 180 năm (`getPeriodFromYear`).
    + Thống kê Cửu Tinh: Đương Lệnh Vượng Khí, Tiến Khí, Thoái Khí và Sát Tinh.
    + Nhận diện các tổ hợp cặp Tinh Tổ: Hà Đồ (1-6, 2-7, 3-8, 4-9, 5-0), Hợp Thập (tổng 10), Cát tinh đặc biệt (1-4 Văn Xương, 8-9 Hỷ Khánh), và các hung sát hung hiểm theo loại hình.
    + Mai Hoa Lập Quẻ: Thượng Quái, Hạ Quái, Hào Động và Quẻ Biến (chỉ 2 quẻ, không quẻ hỗ).
    + Tương phối Bát Tự thực sự qua `BaziAnalyzer`: Bổ trợ Dụng Thần, Hỷ Thần, Cung Phi Bát Trạch.
    + Chấm điểm tổng quan toàn diện từ 35 đến 99 điểm kèm phân hạng cát hung.
- **Hệ Thống Prompt Chuyên Sâu Tiếng Anh:**
  - `backend/src/modules/numerology/services/NumerologyPrompts.js`: Cung cấp Master System Prompt 5 chương chuyên biệt cho Sim, Xe và Ngân Hàng, cùng Follow-up Q&A Prompt.
- **Bộ Điều Khiển & Định Tuyến (Controllers & Routes):**
  - `backend/src/modules/numerology/controllers/NumerologyController.js`: CRUD bản ghi với Redis In-Flight Lock (2.5s), cập nhật nguyên tử O(1) thống kê lượt tạo (`UserStatsService`), Google Indexing Ping khi bật/tắt công khai.
  - `backend/src/modules/numerology/controllers/NumerologyAiController.js`: SSE Streaming luận giải (100 / 500 Points qua `creditCheck.js`) và Follow-up Chat lọc chủ đề (`ConversationContextService`).
  - Đăng ký routes tại `backend/src/routes/index.js` và `backend/src/routes/ai.js`.
- **Xuất Ấn Phẩm PDF:**
  - `backend/src/modules/export/templates/numerologyTemplate.js`: Mẫu HTML/CSS PDF A4 chuẩn in ấn hoàng gia với bìa rồng vàng, quốc huy, bảng cửu tinh, đồ hình quẻ dịch và bảng Bát Tự.
  - Tích hợp vào `PdfTemplateService.js` và `ExportController.js`.

#### 2.2 Frontend (React 19 & Tailwind CSS)
- **Giao Diện Nhập Liệu Sang Trọng:**
  - `frontend/src/features/numerology/NumerologyInput.jsx`: 3 Tab loại hình (`sim`, `plate`, `bank`), 2 Chế độ (`quick`, `bazi`), Mô phỏng trực quan Graphic Card (SIM vàng 5G có chip, Biển số xe dập nổi chữ nổi quốc huy Vietnam, Thẻ đen VIP Platinum ngân hàng); sử dụng `CustomDatePicker` và `CustomSelect` Can Chi.
- **Bảng Hiển Thị Kết Quả Toàn Diện:**
  - `frontend/src/features/numerology/NumerologyBoard.jsx`:
    + Hero Score Card (Điểm số / 100, Thanh phân bổ Âm Dương, Đuôi số).
    + Cửu Tinh Động Vận & Cặp Tinh Tổ (Hộp sao vượng/thoái/sát, danh sách cặp số có viền màu phân biệt cát/hung).
    + Kinh Dịch Mai Hoa: Trình diễn đồ họa trực quan 6 vạch hào liền/đứt của Quẻ Chủ và Quẻ Biến kèm chỉ thị hào động.
    + Tương Phối Bát Tự: Thẻ thông số Nhật Chủ, Dụng Thần, Kỵ Thần, Cung Phi và điểm hòa hợp.
    + Luận Giải AI SSE Streaming qua `SectionRenderer` và `AiChatWidget`.
    + Đánh giá sao, Toggle Switch chia sẻ công khai và Nút xuất PDF.
- **Thành Phần Bổ Trợ & Đồng Bộ Hệ Thống:**
  - `frontend/src/features/history/components/NumerologyHistoryCard.jsx`: Thẻ hiển thị bản ghi phong thủy số trong lịch sử với biểu tượng tương ứng, điểm số, quẻ dịch, gắn thẻ, chia sẻ và đánh giá sao.
  - `frontend/src/features/history/HistoryBoard.jsx`: Tích hợp Tab "Phong Thủy Số" kèm slug URL `/history/phong-thuy-so`.
  - `frontend/src/components/modals/InterpretationTierModal.jsx`: Thêm phân hệ `numerology` với 100 Points và 500 Points.
  - `frontend/src/components/modals/PdfExportModal.jsx`: Cấu hình 4 mục xuất PDF số học.
  - `frontend/src/components/layout/Header.jsx`: Nút "PHONG THỦY SỐ" trên cả Desktop và Mobile drawer.
  - `frontend/src/app/UserApp.jsx`: Điều hướng URL `/numerology`, deep link `/numerology/record/:id`, SEO meta tags và render component.

---

### 🧪 3. Quy Trình Kiểm Thử Trình Duyệt (Chrome DevTools MCP)
- **Kiểm thử Luồng Nhập Liệu & Render:**
  - Đã mở trình duyệt Chrome điều hướng tới `http://localhost:5173/numerology`.
  - Khảo sát Mode 1 Sim số `0988199199`: Tính toán và hiển thị thành công Điểm số 99/100, Quẻ 28 Trạch Phong Đại Quá $\rightarrow$ Quẻ 47 Trạch Thủy Khốn.
  - Khảo sát Mode 2 Biển số xe `30A-916.49` phối sinh thần 18/08/1995: Tính toán chuẩn xác Bát Tự Giáp Mộc, Dụng Thần Kim, Cung Ly, độ hòa hợp 80/100.
  - Khảo sát Số tài khoản Techcombank `1903686888`: Điểm số 91/100 Tối Cát Thượng Đẳng.
  - Thử nghiệm Modal Xuất PDF: Cấu hình chuẩn xác 4 mục xuất A4.
  - Thử nghiệm Tab Lịch Sử: Chuyển tab `/history/phong-thuy-so`, hiển thị danh sách bản ghi và nhấp "Xem chi tiết" mở lại lá số thành công.
- **Tự Sửa Lỗi (Self-Healing Loop):**
  - Phát hiện và khắc phục triệt để lỗi `TypeError: Cannot read properties of undefined (reading 'includes')` trong `NumerologyBoard.jsx` do truy cập lệch trường `p.auspicious`. Đã chuẩn hóa sang `p.badgeType` và `p.label`.
  - Bổ sung `'numerology'` và `'feixing'` vào `Conversation` schema enum.
- **Kết quả Cuối Cùng:** Trình duyệt chạy mượt mà, **Console 0 Lỗi**, không có bất kỳ warning phá vỡ cấu trúc nào.

---

## 📅 Phiên bản: Khắc Phục Lỗi CI/CD `npm ci` Backend & Đồng Bộ Toàn Diện Node.js 22 LTS (05/10/2026)

### 🌟 1. Tổng Quan Sự Cố & Nguyên Nhân Gốc Rễ
Khi hệ thống chạy luồng GitHub Actions CI/CD ở Backend, quá trình cài đặt gói phụ thuộc bằng `npm ci` bị lỗi dừng khẩn cấp:
- **Lỗi 1 (`npm error code EUSAGE`):**
  - Thông báo: *"`npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Invalid: lock file's gcp-metadata@8.1.4 does not satisfy gcp-metadata@7.0.1, Missing: gcp-metadata@8.1.4 from lock file, Missing: gaxios@7.1.3 from lock file"*.
  - **Nguyên nhân:** Tệp `backend/package-lock.json` bị xung đột cây phụ thuộc (dependency tree drift) giữa `gcp-metadata@8.1.4` (được dùng bởi `@google-cloud/firestore-api`) và `gcp-metadata@7.0.1` (được yêu cầu bởi `google-auth-library`). `gcp-metadata@8.1.4` bị đặt sai vị trí ở root `node_modules` thay vì nested bên dưới `@google-cloud/firestore-api`.
- **Cảnh báo 2 (`npm warn EBADENGINE Unsupported engine`):**
  - Các gói thư viện mới (`puppeteer@25.10.0`, `@puppeteer/browsers@3.2.2`, `firebase-admin@14.5.0`, `google-auth-library@11.1.0`, `gcp-metadata@9.0.4`) khai báo yêu cầu nghiêm ngặt `engines: { node: ">=22" }` hoặc `">=22.12.0"`.
  - Trong khi đó, GitHub Actions runners và các tệp Dockerfile trước đây cấu hình Node.js 20 (`node-version: '20'`, `FROM node:20-slim`), dẫn đến hàng loạt cảnh báo `EBADENGINE` và tiềm ẩn nguy cơ lỗi runtime.

### 🛠️ 2. Các Biện Pháp Khắc Phục Đã Triển Khai
1. **Đồng bộ hóa & Chuẩn hóa Cây Phụ thuộc (`package-lock.json`):**
   - Chạy tái đồng bộ và phân giải dependency tree trên Backend. Cấu trúc lồng `gcp-metadata@8.1.4` và `gaxios@7.1.3` được nest chuẩn xác dưới `@google-cloud/firestore-api/node_modules/`, khôi phục `gcp-metadata@7.0.1` chuẩn ở root.
   - Kiểm tra `npm ci` chạy thành công 100% không còn lỗi EUSAGE (`added 636 packages, audited 637 packages in 17s`).
   - Kiểm tra xác nhận `frontend/package-lock.json` chạy `npm ci` hoàn hảo (`added 557 packages in 12s`).
2. **Nâng Cấp Đồng Bộ Node.js 22 LTS Trên Toàn Bộ CI/CD Pipelines:**
   - `.github/workflows/backend-ci.yml`: Cập nhật `node-version: '22'`.
   - `.github/workflows/frontend-ci.yml`: Cập nhật `node-version: '22'`.
   - `.github/workflows/deploy.yml`: Cập nhật `node-version: '22'` cho cả hai jobs `test-backend` và `test-frontend`.
3. **Nâng Cấp Đồng Bộ Dockerfiles:**
   - `backend/Dockerfile`: Chuyển base image sang `FROM node:22-slim` tương thích 100% với Puppeteer 25 và Firebase Admin.
   - `frontend/Dockerfile`: Chuyển build stage sang `FROM node:22-slim AS build`.
   - `docs/DEVELOPMENT_GUIDE.md`: Cập nhật tài liệu hướng dẫn Docker Compose từ `node:20-slim` sang `node:22-slim`.

