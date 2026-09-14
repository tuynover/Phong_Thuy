# ☯️ Hệ thống Ứng dụng Phong Thủy & Gieo Quẻ (IChing - Bazi - Ziwei - Marriage - Admin)

Dự án này là một hệ thống ứng dụng web cung cấp các công cụ phân tích phong thủy, bao gồm phân tích **Kinh Dịch (IChing)**, **Tứ Trụ - Bát Tự (Bazi)**, **Lá Số Tử Vi (Ziwei)**, và **Xem Tuổi Kết Hôn (Marriage)**, hỗ trợ người dùng xem lá số, gieo quẻ, và nhận luận giải chuyên sâu từ AI tích hợp tính năng hỏi đáp chuyên sâu (Follow-up Chat).

Dự án được chia làm 2 phần chính: **Frontend** (giao diện người dùng) và **Backend** (máy chủ xử lý logic, cơ sở dữ liệu và tích hợp AI).

---

## 🏗️ Cấu trúc dự án

- `/backend`: Mã nguồn máy chủ (Node.js / Express.js v5 / MongoDB / Redis), tổ chức theo kiến trúc module chuyên trách (Domain-Driven Modular Architecture):
  ```text
  backend/src/
    ├── core/                    # Nền tảng cốt lõi dùng chung (Core Infrastructure)
    │   ├── ai/                  # Dịch vụ AI & stream (AiService, AiStreamHelper, ConversationContextService)
    │   ├── config/              # Cấu hình hệ thống (db, env, redis, ai, swagger)
    │   ├── controllers/         # Controller hệ thống (HealthController)
    │   ├── middleware/          # Middleware bảo vệ (auth, creditCheck, rateLimiter, logging, antiSpamLock...)
    │   ├── models/              # Mô hình tài khoản & chat (User, Conversation, Message)
    │   ├── services/            # Dịch vụ lõi (Logger, Cache, UserStats, SSE, RedisQueue, GoogleIndexing...)
    │   └── utils/               # Tiện ích bổ trợ (aiFormatters, transactionHelper, escapeRegExp)
    ├── modules/                 # Các phân hệ chuyên trách độc lập (Domain Modules)
    │   ├── bazi/                # Bát Tự & Hợp Hôn (Bazi + Marriage controllers, models, services, prompts, data)
    │   ├── ziwei/               # Tử Vi Đẩu Số (controllers, models, services, prompts, routes)
    │   ├── iching/              # Kinh Dịch Lục Hào (controllers, models, services, prompts, routes)
    │   ├── date/                # Xem Ngày Lành (controllers, services, routes)
    │   ├── blog/                # Blog & Khái Niệm (controllers, models, services, routes)
    │   ├── auth/                # Xác Thực & Thẻ Tag (controllers, routes, services)
    │   ├── admin/               # Quản Trị Hệ Thống (controllers tách nhỏ, models, routes)
    │   ├── history/             # Lịch Sử Bản Ghi (controllers tách nhỏ theo môn, routes)
    │   ├── notification/        # Thông Báo Tự Động (controllers, services, routes)
    │   ├── tts/                 # Đọc Luận Giải AI (controllers, audio services, cache)
    │   └── export/              # Xuất Bản PDF A4 (controllers, templates, generators)
    ├── routes/                  # Điểm kết nối router gốc (index.js, ai.js, seo.js)
    ├── shared/                  # Động cơ & tri thức cổ học dùng chung (AstrologyEngine, SymbolicAnalyzer, ungKyParser)
    └── scripts/                 # Kịch bản kiểm thử & bảo trì cơ sở dữ liệu
  ```
- `/frontend`: Mã nguồn giao diện người dùng (React 19 / Vite / Tailwind CSS), tổ chức theo kiến trúc module hướng miền (Domain-Driven Architecture):
  ```text
  frontend/src/
    ├── app/                     # Trình điều phối và shell ứng dụng (UserApp.jsx, AdminApp.jsx)
    ├── features/                # Các phân hệ nghiệp vụ độc lập (Domain-Driven Features)
    │   ├── iching/              # Kinh Dịch: IChingBoard.jsx, IChingInput.jsx
    │   ├── bazi/                # Bát Tự: BaziBoard.jsx, BaziInput.jsx, baziConstants.jsx
    │   │   └── components/      # Component con Bát Tự: BaziPillarsTable, BaziPillar, BaziFiveElementsChart, BaziDaiYunTimeline, BaziProfileHeader, BaziRemedyAndRelations, ThapThanStrengthTable
    │   ├── ziwei/               # Tử Vi: ZiweiBoard.jsx, ZiweiChart.jsx, ZiweiInput.jsx
    │   ├── marriage/            # Hợp Hôn: MarriageBoard.jsx, MarriageInput.jsx
    │   ├── xemngay/             # Xem Ngày Đẹp: DateSelectionBoard.jsx
    │   ├── blog/                # Kiến Thức Phong Thủy: BlogBoard.jsx
    │   ├── history/             # Lịch Sử Phân Tích: HistoryBoard.jsx
    │   │   └── components/      # Card lịch sử độc lập: IChingHistoryCard, BaziHistoryCard, ZiweiHistoryCard, MarriageHistoryCard
    │   ├── profile/             # Hồ Sơ Cá Nhân & Quản Trị: ProfileBoard.jsx
    │   ├── home/                # Trang Chủ Giới Thiệu: HomeBoard.jsx
    │   └── admin/               # Quản Trị Hệ Thống: AdminConfirmModal.jsx
    │       └── tabs/            # Tabs Admin chuyên trách: AdminOverviewTab, AdminUsersTab, AdminCalculationsTab, AdminAlertsTab, AdminBlogTab, AdminUserStatsModal
    ├── components/
    │   ├── common/              # Thành phần dùng chung (CustomDatePicker, CustomSelect, Tooltip...)
    │   ├── layout/              # Khung giao diện (Header.jsx, Footer.jsx...)
    │   ├── modals/              # Hộp thoại modal (AuthModal, PdfExportModal, MyFoldersModal...)
    │   ├── widgets/             # Widget tiện ích nổi (AiChatWidget, AudioPlayerDock, NotificationBell...)
    │   └── ...                  # Proxy Re-exports đảm bảo 100% tương thích ngược
    ├── hooks/                   # Custom Hooks dùng chung (useInterpretationStream, useRecordRating, usePublicToggle)
    ├── context/                 # Quản lý ngữ cảnh React (AuthContext.jsx)
    ├── services/                # Giao tiếp API & Giọng đọc AI (api.js, ttsEngine.js)
    └── utils/                   # Hàm tiện ích bổ trợ (baziUtils.js)
  ```

---

## 🎨 1. Hệ thống Frontend

### 🛠️ Công nghệ sử dụng
- **Core:** React 19, Vite.
- **Styling:** Tailwind CSS (v3), PostCSS.
- **Icons:** Lucide React.
- **HTTP Client:** Axios.
- **Markdown Renderer:** React Markdown & remark-gfm (hiển thị kết quả luận giải và bài viết phong thủy định dạng Markdown/GFM đẹp mắt, hỗ trợ bảng tự động và chèn ảnh minh họa).
- **Linter:** ESLint.

### 🌟 Chức năng chính theo từng Phân hệ

#### A. Kinh Dịch (IChing Board)
* Giao diện tích hợp tất cả các phương thức gieo quẻ vào một thành phần duy nhất **[`IChingInput.jsx`](file:///t:/Phongthuy/frontend/src/components/IChingInput.jsx)** mà vẫn giữ nguyên 100% giao diện và trải nghiệm người dùng:
  * **Gieo Quẻ Lục Hào (Coin Toss):** Mô phỏng gieo quẻ ảo (tung 3 đồng xu 6 lần), tính toán Quẻ Chính, Quẻ Biến, Hào Động, Vượng Suy, Vòng Trường Sinh (12 giai đoạn), Quái Thân và các mối quan hệ Ngũ Hành.
  * **Mai Hoa Dịch Số (Mai Hoa Input):** Hỗ trợ lập quẻ theo 2 phương thức: **Giờ Động Tâm** (tính toán dựa trên ngày giờ) và **Seri Tiền 8 Số** (dãy số ngẫu nhiên). Công thức Số Lý Động Tâm được hiển thị trực quan và chi tiết ngay trên màn hình.
  * **Nhập Thủ Công (Manual Input):** Nhập trực tiếp các âm dương của 6 hào.
* **Thầy Dịch Giải AI & Luận Giải Chuyên Sâu 6 Chương:** Cung cấp 2 tầng luận giải: Cơ bản (1 Credit) và Chuyên sâu (5 Credits). Bản chuyên sâu áp dụng cấu trúc 6 Chương Biện Chứng Tượng - Hào: Khởi Quái Tượng Pháp Chu Dịch, Biện Chứng Lục Hào Dụng Thần 100% câu hỏi cốt lõi, Động Hào Biến Khí, Đối Chiếu Biện Chứng Tượng - Hào Ma Trận Biểu vs Lý, Định Lượng Thời Khắc Ứng Kỳ theo 4 nhóm ngữ cảnh (Phương án B: tích hợp Bảng Tra Cứu Lịch Pháp Gần Nhất - Calendar Ground Truth từ `lunar-javascript` nạp sẵn tọa độ gieo quẻ, bảng các ngày vàng gần nhất trong vòng 1 - 14 ngày tới để chủ động hành động ngay kết hợp tháng mục tiêu), quy đổi song song sang ngày/tháng Dương lịch cụ thể (`DD/MM/YYYY`) trong Bảng Ma Trận Ứng Kỳ 4 cột, và Kim Chỉ Nam Đạo Dịch Diệu Kế Hành Động.
* Tệp tin liên quan: [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/features/iching/IChingBoard.jsx), [IChingInput.jsx](file:///t:/Phongthuy/frontend/src/features/iching/IChingInput.jsx).

#### B. Mệnh Số Bát Tự (Bazi Board)
* Nhập ngày giờ sinh để lập lá số Tứ Trụ.
* Phân tích bản mệnh ngũ hành, xác định Nhật Chủ (Day Master) mạnh/yếu, định Dụng Thần (Useful God) dựa trên Nguyệt Lệnh, phân tích Thập Thần và vòng Trường Sinh.
* Cấu trúc module phân rã sạch sẽ gồm 7 component con chuyên trách: `BaziPillarsTable.jsx`, `BaziPillar.jsx`, `BaziFiveElementsChart.jsx`, `BaziDaiYunTimeline.jsx`, `BaziProfileHeader.jsx`, `BaziRemedyAndRelations.jsx`, `ThapThanStrengthTable.jsx`.
* Màu sắc trực quan được tùy biến theo quy luật tương sinh tương khắc của Ngũ Hành.
* Tệp tin liên quan: [BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/features/bazi/BaziBoard.jsx), [BaziInput.jsx](file:///t:/Phongthuy/frontend/src/features/bazi/BaziInput.jsx).

#### C. Lá Số Tử Vi (Ziwei Board & Chart)
* **Form Nhập Liệu Tách Riêng (`ZiweiInput.jsx`):** Được tách thành component độc lập theo cấu trúc của `BaziInput.jsx`. Hỗ trợ vừa nhập vừa chọn (Combobox `editable={true}`), không khởi tạo sẵn giá trị mặc định cho Ngày, Tháng, Năm, Giờ, Phút (khởi tạo rỗng `''`), tích hợp component lịch chọn ngày tùy chỉnh `CustomDatePicker`.
* **Mệnh bàn 4x4 truyền thống:** Đồ hình 12 cung sắp xếp vòng quanh Trung Cung theo tọa độ Địa Chi chuẩn cổ học phương Đông.
* **Phân tích Tinh Tú:** Hiển thị Chính tinh kèm độ sáng (Miếu, Vượng, Đắc, Bình, Hãm), Lục cát tinh, Lục sát tinh và tạp tinh được chia thành các cột Cát/Sát rõ ràng, phân biệt màu sắc ngũ hành từng sao.
* **Vòng Trường Sinh & Hạn:** Hiển thị Đại Hạn, Tiểu Hạn, Nguyệt Hạn tương ứng trên các cung vị.
* **Mobile List View:** Tự động tối ưu hóa và thu gọn bố cục thành danh sách rút gọn mượt mà trên thiết bị di động.
* **Thầy Tử Vi AI:** Gửi yêu cầu giải đoán trực tiếp. Hệ thống hiển thị dòng văn bản luận giải trực quan qua luồng SSE Stream thời gian thực tương tự như Kinh Dịch và Bát Tự.
* Tệp tin liên quan: [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/features/ziwei/ZiweiBoard.jsx), [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/features/ziwei/ZiweiChart.jsx), [ZiweiInput.jsx](file:///t:/Phongthuy/frontend/src/features/ziwei/ZiweiInput.jsx).

#### D. Hợp Hôn - Xem Tuổi Kết Hôn (Marriage Board)
* Cho phép nhập đầy đủ thông tin ngày giờ sinh của cả Nam và Nữ để kiểm tra mức độ hòa hợp.
* Đối chiếu bản mệnh ngũ hành, Bát Tự, Mệnh Quái (Đông/Tây tứ mệnh), Cung Phi bát trạch.
* AI hỗ trợ giải đoán chi tiết về hôn nhân gia đạo, ưu nhược điểm của cặp đôi và giải pháp hóa giải xung khắc.
* Tệp tin liên quan: [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/features/marriage/MarriageBoard.jsx), [MarriageInput.jsx](file:///t:/Phongthuy/frontend/src/features/marriage/MarriageInput.jsx).

#### E. Kiến Thức Phong Thủy & Chia Sẻ (Blog Board)
* Trang tin tức và bài viết chiêm nghiệm học thuật công khai với 6 danh mục phong thủy chính.
* Đồng bộ đường dẫn tĩnh Deep-Linking dạng `https://tuynover.ddns.net/?post={slug}` cho từng bài viết.
* Tích hợp thanh chia sẻ đa nền tảng (Sao chép link, Facebook Sharer, Web Share API di động).
* Trình diễn bài viết với `ReactMarkdown` & `remark-gfm`, tự động định dạng bảng GFM (`Vertical Pipe Normalizer`) và chèn ảnh minh họa sắc nét.
* Tệp tin liên quan: [BlogBoard.jsx](file:///t:/Phongthuy/frontend/src/features/blog/BlogBoard.jsx).

#### F. Trang Quản Trị (Admin App)
* Dashboard chuyên sâu dành cho Quản trị viên và Đồng quản trị viên (Admin / Co-Admin). Phân rã gọn gàng thành 5 tab độc lập (`AdminOverviewTab`, `AdminUsersTab`, `AdminCalculationsTab`, `AdminAlertsTab`, `AdminBlogTab`) và modal thống kê token `AdminUserStatsModal`.
* Quản lý người dùng, khóa/mở tài khoản, cấp phát Credits/Coins.
* **Quản lý bài viết Blog:** Viết bài mới với bộ chuyển đổi **Soạn Thảo Markdown** vs **Xem Trước (Preview)**, tự động sinh slug thời gian thực, lưu bản nháp/công khai.
* Kiểm tra lịch sử tính toán, khóa/mở hoặc xóa các bản ghi phong thủy vi phạm.
* Quản lý khiếu nại (Ban Appeals) và xem nhật ký hệ thống thời gian thực qua Server-Sent Events (SSE).
* Tệp tin liên quan: [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/app/AdminApp.jsx).

#### F. Tiện ích Phụ trợ & UI/UX Đột phá
* **Luận Giải Chuyên Sâu VIP & Gói Luận Giải Đa Tầng:**
  * **Modal Chọn Gói 2 Cột Đa Phân Hệ (`InterpretationTierModal.jsx`):** Khi chưa luận giải, hiển thị bảng chọn 2 cột tự động tùy biến theo từng phân hệ (`bazi`, `ziwei`, `marriage`, `iching`): Bên trái là Luận Giải Cơ Bản (1 Credit, 800 - 1.200 từ), bên phải là Luận Giải Chuyên Sâu VIP (5 Credits, viền vàng hoàng gia, huy hiệu Khuyên Dùng, mô tả chuyên sâu phù hợp từng môn cổ học).
  * **Banner Nâng Cấp VIP (`VipUpgradeBanner.jsx`):** Khi người dùng đã xem bản cơ bản, banner xuất hiện cuối bài luận giải gợi ý nâng cấp sang bản VIP chỉ với 4 Credits chênh lệch kèm từ khóa học thuật đặc trưng của phân hệ.
  * **Nút Nâng Cấp Nổi (Floating Button):** Nút "Nâng Cấp VIP (4 Cr)" được đặt cố định ở góc dưới bên phải, nằm ngay **PHÍA TRÊN** của nút "Hỏi Thêm Thầy" để tạo cảm giác tiện dụng và kích thích chuyển đổi.
  * **Reset Trạng Thái Tức Thời 0ms & Tiến Độ Thời Gian Thực:** Khi nhấn xác nhận nâng cấp, bài viết cũ lập tức biến mất ngay trên state, kích hoạt thanh tiến độ thời gian thực (`VipProgressTracker.jsx`) theo dõi từng bước hoàn thành: 6 Chương cho Bát Tự & Kinh Dịch, 5 Chương cho Tử Vi hoặc 4 Chương cho Hợp Hôn.
  * **Bảo toàn Bản quyền VIP:** Khi đã hoàn thành bài VIP, giao diện ẩn hoàn toàn các nút nâng cấp và banner VIP, chỉ giữ lại nút "Hỏi Thêm Thầy".
* **Khung Chat Thông Minh & Đồng Bộ Ngữ Cảnh VIP (AiChatWidget & VIP Chat Memory):** 
  * Bounded Slide-in Panel trượt mềm mại từ góc phải màn hình, hỗ trợ hiển thị luồng SSE thời gian thực từ AI, có thanh tiến độ độ tin cậy (Confidence Bar), Ứng Kỳ (Timing), Cảnh báo rủi ro (Risk) và bộ đếm cooldown 8-10s tránh spam.
  * **Đồng Bộ Ngữ Cảnh Bài Luận VIP (Hybrid VIP Context Memory):** Nút *"💬 Đàm đạo mục này"* được bố trí trực tiếp trên từng thanh tiêu đề thẻ Accordion Cụm/Chương (`SectionRenderer.jsx`). Khi bấm, Chat Widget tự động trượt ra kèm **Context Banner** tím nổi bật (`🏷️ Ngữ cảnh: [Tên Cụm/Chương]`), nút hủy ngữ cảnh `✕` và các phím gợi ý nhanh (**Quick Suggestion Chips**). Backend tự động cắt lát thông minh (~800 - 1.200 từ) hoặc định tuyến từ khóa ngữ nghĩa (`ConversationContextService.js`), giúp AI phản hồi chuẩn xác 100% theo từng chương mục mà không làm quá tải token context.
* **State Persistence:** Sử dụng `localStorage` lưu trữ trạng thái phân hệ, quẻ hiện tại, lá số hiện tại và lịch sử chat để tránh mất dữ liệu khi Refresh/F5.
* **Tạo Lá số Độc lập & Concurrency Mutex Lock:** Bỏ kiểm tra trùng lặp cũ khi tạo lá số/quẻ. Mỗi lần gửi yêu cầu hợp lệ đều tạo lá số mới độc lập, đồng thời trang bị Mutex Lock 2.5s trên Redis/RAM ngăn chặn spam 10 request đồng thời.
* **Xóa mềm (Soft Delete) & Hủy liên kết:** Danh sách lịch sử gieo quẻ/lá số được xóa dưới dạng xóa mềm (`isDeleted: true`). Nếu bản ghi bị xóa trùng khớp với liên kết lá số bản thân của người dùng, hệ thống sẽ tự động hủy liên kết đó trong hồ sơ cá nhân (`ownBaziRecordId`/`ownZiweiRecordId` đặt về `null`).
* **Kiểm soát Dữ liệu Đầu vào 2 Bước & Real-time Auto-Clamp:** Tích hợp dịch vụ [`InputValidator.js`](file:///t:/Phongthuy/backend/src/services/InputValidator.js) phía Backend và component [`CustomSelect`](file:///t:/Phongthuy/frontend/src/components/MaiHoaInput.jsx#L54) Combobox Dropdown + [`FloatingErrorToast.jsx`](file:///t:/frontend/src/components/FloatingErrorToast.jsx) cố định ở đỉnh màn hình phía Frontend. Tự động ép ngày hợp lệ (auto-clamp Ngày 29/02 sang 28 ở năm không nhuận, ngày 31 sang 30 ở tháng 30 ngày), tự động ép ngưỡng khi gõ tay (gõ $>31 \rightarrow 31$, gõ $>12 \rightarrow 12$), lọc triệt tiêu toàn bộ ký tự chữ cái (A-Z) và vô hiệu hóa nút bấm khi dữ liệu không hợp lệ.
* **Xuất Tệp PDF Học Thuật & Trang Bìa Cá Nhân Hóa 4 Phân Hệ (`PdfExportModal.jsx`):** Modal thiết kế theo phong cách Hoàng Gia Á Đông (Imperial Luxury) cho phép người dùng linh hoạt chọn lọc tải riêng hoặc kết hợp giữa **Trang Bìa Cá Nhân Hóa (Personal Cover Page)**, Lá số / Đồ hình và bài Luận giải AI (hỗ trợ in toàn văn bài luận giải hoặc chọn lẻ từng chương cho Bát Tự và Kinh Dịch). Trang bìa A4 được cá nhân hóa hoàn toàn (khử 100% text viện nghiên cứu), trang bị 4 bảng màu chuyên biệt cho từng môn: Đỏ Chu Sa (Kinh Dịch), Vàng Hổ Phách (Bát Tự), Tím Huyền Không (Tử Vi), Đỏ Mận (Hợp Hôn). Biểu tượng Thái Cực Đồ chuẩn canonical S-curve phản ánh chính xác quy luật "trong âm có dương, trong dương có âm". Ấn triện tứ phân son 56px có đường chỉ crosshair 1px (`DỊCH LÝ CHÍNH TÔNG`, `TỨ TRỤ MỆNH LÝ`, `TỬ VI ĐẨU SỐ`, `HỢP HÔN GIA ĐẠO`) sắc sảo không tràn viền. Sử dụng phông chữ **`Noto Serif`** hiển thị chuẩn nét 100% tiếng Việt UTF-8. Tích hợp chốt an toàn vô hiệu hóa nút bấm khi `selectedCount === 0`.
* **Phân Lập Tuyệt Đối Luồng AI Luận Giải:** Đảm bảo tính toàn vẹn học thuật cho từng phân hệ; phân tách độc lập các bộ Prompt Kinh Dịch (`IChingPrompts`), Tử Vi (`ZiweiPrompts`), Hôn Nhân (`MarriagePrompts`) và Bát Tự, ngăn chặn triệt để hiện tượng rò rỉ thuật ngữ Tử Bình / Nhật Chủ sang Kinh Dịch và Tử Vi.
* **Grid Selector:** Thay thế dropdown chọn giờ sinh bằng bảng chọn Can Chi 3 cột trực quan.
* Tệp tin liên quan: [InterpretationTierModal.jsx](file:///t:/Phongthuy/frontend/src/components/InterpretationTierModal.jsx), [VipUpgradeBanner.jsx](file:///t:/Phongthuy/frontend/src/components/VipUpgradeBanner.jsx), [VipProgressTracker.jsx](file:///t:/Phongthuy/frontend/src/components/VipProgressTracker.jsx), [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx), [FloatingErrorToast.jsx](file:///t:/Phongthuy/frontend/src/components/FloatingErrorToast.jsx), [PdfExportModal.jsx](file:///t:/Phongthuy/frontend/src/components/PdfExportModal.jsx), [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx), [NotificationBell.jsx](file:///t:/Phongthuy/frontend/src/components/NotificationBell.jsx).

---

## ⚙️ 2. Hệ thống Backend

### 🛠️ Công nghệ sử dụng
- **Core:** Node.js, Express.js (v5).
- **Database & Cache:** MongoDB (Mongoose v9, maxPoolSize: 100), Redis (`ioredis`, Redis Alpine), Hybrid L1 RAM + L2 Redis Cache.
- **PDF Engine:** Puppeteer (Headless Chromium pool, Semaphore FIFO Queue, SSD Disk Cache 24h).
- **Security & Reliability:** JWT, bcryptjs, CORS, Global API Rate Limiter (300 req/5min), creditCheck Middleware, antiSpamLock Middleware (Distributed Mutex Lock), Readiness & Observability Health Probes (`/health`, `/health/detailed`).
- **AI Engine:** Google Gemini API (`@google/generative-ai` model `gemini-3.1-flash-lite`, tích hợp chuỗi dự phòng đa tầng OpenRouter Qwen / Groq Llama, AI VIP Concurrency Limiter).
- **Phong thủy Logic:** `lunar-javascript` (Lịch pháp âm dương, Can Chi, Bát Tự).


### 🌟 Kiến trúc lõi & Các dịch vụ xử lý chuyên sâu

1. **Rule Engine chuyên sâu (`RuleEngineService.js`):**
   * Tính toán các tham số học thuật tĩnh cho Kinh Dịch: tự động tìm Dụng Thần (dựa trên câu hỏi và giới tính), phân tích tương quan Nhật/Nguyệt (Ngày/Tháng gieo quẻ) tác động lên các hào.
   * Tệp tin: [RuleEngineService.js](file:///t:/Phongthuy/backend/src/services/RuleEngineService.js).
2. **Hệ Thống An Sao Tử Vi (`ZiweiFormatter.js` & `ZiweiValidators.js`):**
   * Xây dựng đồ hình Tử Vi, xác định Cung Mệnh/Thân, Cục, sao chủ và an hệ thống phụ tinh phong phú (Bác Sĩ, Trường Sinh, Tuế Tiền, Tướng Tinh, Tuần, Triệt...).
   * Tệp tin: [ZiweiFormatter.js](file:///t:/Phongthuy/backend/src/services/ZiweiFormatter.js).
3. **Phân Tích Bát Tự Ngũ Hành (`BaziAnalyzer.js`):**
   * Xử lý tính toán ngũ hành Bát Tự theo thuật toán 4.0 với các cơ chế điều chỉnh phần trăm tương đối, quy tắc hợp giải xung (ưu tiên tổ hợp địa chi), đa thấu phân khí, tiết khí cực đoan (con vượng mẹ kiệt) và cơ chế phá điểm sàn phục vụ nhận diện cách cục Tòng Cách chính xác.
   * Tệp tin: [BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js).
4. **Hợp nhất Lược đồ Chat:**
   * Thay thế các bảng chat riêng rẽ bằng cấu trúc dùng chung [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js) (phân loại qua trường `system`: `'iching' | 'bazi' | 'ziwei' | 'marriage'`) và [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js) để tối ưu lưu trữ.
5. **Gộp Controller Core xử lý AI và Lịch sử:**
   * [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js): Xử lý stream SSE luận đoán ban đầu và trò chuyện follow-up cho toàn bộ các phân hệ.
   * [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js): Xem lịch sử bản ghi, xếp hạng đánh giá (rate), liên kết dữ liệu guest vào tài khoản (link), xóa bản ghi.
6. **Quản lý Prompt động:**
   * Tách biệt các bộ prompt chuyên môn bằng tiếng Anh giúp nâng cao chất lượng phản hồi từ Gemini: [IChingPrompts.js](file:///t:/Phongthuy/backend/src/services/IChingPrompts.js), [BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js), [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js), [MarriagePrompts.js](file:///t:/Phongthuy/backend/src/services/MarriagePrompts.js).
6.1. **Bộ Máy Luận Giải Chuyên Sâu Đa Tầng (`backend/src/services/deep-interpretation/`):**
   * Tổ chức tinh gọn thành 3 tệp tin chức năng cốt lõi:
     - `DeepInterpretationCore.js`: Hạ tầng kỹ thuật (xoay vòng API key qua `OpenRouterRotator`, bộ giao tiếp `LlmProviderService` tích hợp timeout và giới hạn token `maxTokens: 3000` chống lỗi 402, cùng bộ phát dòng SSE `SseStreamHelper`).
      - `DeepInterpretationConfigs.js`: Cấu hình học thuật và prompts chuyên sâu cho 4 phân hệ (Bát Tự 6 Chương, Tử Vi 5 Chương, Hợp Hôn 4 Chương, Kinh Dịch 6 Chương Tượng - Hào).
      - `DeepInterpretationPipelines.js`: Điều phối tiến trình xử lý đa tầng chuyên biệt phủ sóng toàn diện 4 phân hệ gồm `BaziDeepPipeline` (3 tầng Bát Tự), `ZiweiDeepPipeline` (4 tầng Tử Vi), `MarriageDeepPipeline` (3 tầng Hợp Hôn) và `IChingDeepPipeline` (3 tầng Kinh Dịch 6 Chương).
    * Lớp Facade [MultiAgentPipelineService.js](file:///t:/Phongthuy/backend/src/services/MultiAgentPipelineService.js) đảm bảo tương thích ngược 100% cho toàn bộ controller.
7. **Hệ thống Nhật ký cao cấp (`LoggerService.js`):**
   * Hoạt động song song: In console có mã màu ANSI và ghi tệp log vật lý (`logs/app.log`, `logs/errors.log`). Tự động truy quét định danh JWT để ghi nhận IP, Email người dùng và ẩn mật khẩu bảo mật.
   * Tệp tin: [LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js).
8. **Duy trì kết nối SSE Keepalive Ping:**
   * Gửi gói tin heartbeat định kỳ mỗi 15 giây ngăn chặn lỗi ngắt kết nối rác do Idle Timeout khi phân phối qua Nginx, Render hoặc Vercel.
9. **Cơ chế Cache Tối ưu & Redis Hybrid (L1 RAM + L2 Redis):**
   * Đệm thông tin Profile User trong bộ nhớ RAM L1 (`userProfileRamCache`) giúp phản hồi auth dưới 1ms, gộp các lệnh RateLimiter trong 1 Redis Pipeline duy nhất, bọc Fast Fail Timeout (`withTimeout` max 300ms-500ms) và kích hoạt `family: 4` chống trễ DNS AAAA trên AWS EC2. Tự động lưu snapshot luận giải (`analysisSnapshot`) và lưu trữ đệm qua [MemoryCacheService.js](file:///t:/Phongthuy/backend/src/services/MemoryCacheService.js) để tái sử dụng, giúp giảm thiểu tối đa chi phí gọi Gemini API.
10. **Hệ thống SEO Tự Chủ, Dynamic Sitemap & Google Indexing API:**
    * **SEO & Meta Tags:** Viết bộ xử lý render tĩnh HTML (`backend/src/routes/seo.js`), tự động nạp index.html của frontend và tiêm (inject) các thẻ meta tags Open Graph động phục vụ hiển thị ảnh đại diện và mô tả khi chia sẻ link Bát tự/Tử vi/Kinh dịch công khai lên các mạng xã hội.
    * **Dynamic XML Sitemap:** Endpoint `/sitemap.xml` tự động tổng hợp danh sách các trang chính tĩnh, bài viết Blog đã xuất bản, và các liên kết lá số công khai (`isPublic: true`) của người dùng để dẫn đường cho bot tìm kiếm thu thập dữ liệu.
    * **Google Indexing API:** Tự động gửi các sự kiện ping thông báo (`URL_UPDATED` khi tạo bài viết/bật chia sẻ, hoặc `URL_DELETED` khi xóa mềm/tắt chia sẻ) lên API Google Indexing để đẩy nhanh tốc độ lập chỉ mục nội dung.
11. **Tối Ưu Hóa Form Nhập Liệu, Hệ Thống Thẻ Thư Mục Đồng Bộ & Tải Lá Số Chuẩn (08/2026):**
    * **Gộp Form Nhập Kinh Dịch (`IChingInput.jsx`):** Hợp nhất toàn bộ 3 phương thức gieo quẻ (Lục Hào Tung Xu, Mai Hoa Giờ Động Tâm / Seri Tiền, Nhập Thủ Công) về một component duy nhất `IChingInput.jsx` để dễ quản lý và dọn dẹp các tệp dư thừa (`CoinToss.jsx`, `MaiHoaInput.jsx`, `ManualInput.jsx`).
    * **Tách Form Tử Vi (`ZiweiInput.jsx`):** Đóng gói form nhập Tử Vi thành component độc lập theo chuẩn của `BaziInput.jsx`, hỗ trợ Combobox vừa nhập vừa chọn, không nhập sẵn giá trị mặc định cho Ngày, Tháng, Năm, Giờ, Phút (khởi tạo rỗng `''`), tích hợp component lịch tùy chỉnh `CustomDatePicker`.
    * **Đồng Bộ Nút Thẻ Thư Mục (Tags):** Bổ sung đầy đủ Badge nhãn thẻ `🏷️ [Tên thẻ]` và nút Icon Tag 🏷️ cho cả 4 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân) trên thẻ danh sách `HistoryBoard.jsx` và modal `MyFoldersModal.jsx`.
    * **Tự Động Tải Chi Tiết Lá Số (Full-Detail Fetching):** Xử lý tự động bóc tách dữ liệu lồng `baziData`/`marriageData`/`analysisSnapshot` ở `BaziBoard.jsx` và `MarriageBoard.jsx`. Tự động kích hoạt gọi API `getBaziRecord(id)` và `getMarriageRecord(id)` khi bấm xem chi tiết từ Lịch sử / Lá số của tôi, khắc phục triệt để lỗi màn hình trắng hay trống trơn dữ liệu.
12. **Xuất Tệp PDF Học Thuật Đa Phân Hệ & Trang Bìa Hoàng Gia (`PdfGeneratorService.js`, `PdfTemplateService.js`, `ExportController.js`):**
     * Tự động dàn trang HTML/CSS in ấn theo bảng màu Hoàng Gia Á Đông (Imperial Luxury) cho cả 4 phân hệ (Bát Tự, Tử Vi, Kinh Dịch, Hợp Hôn), tích hợp **Trang Bìa Hoàng Gia (Cover Page)** viền kép mạ vàng đồng, ấn triện son đỏ 4 chữ riêng biệt từng môn, biểu tượng Thái Cực và mã định danh UUIDv7.
     * Bố cục ma trận Đại Vận 2 hàng x 5 cột (100 năm) kèm huy hiệu Cát/Hung đối chiếu Dụng Thần; tự động định dạng bảng Markdown GFM chống vỡ trang in.
     * Hỗ trợ bộ chọn phân đoạn granular (chọn trang bìa / từng phần lá số / từng chương luận giải), tích hợp chốt an toàn vô hiệu hóa nút xuất khi chưa chọn mục (`selectedCount === 0`).
    * Quản trị phiên Chromium Headless Singleton với cơ chế giới hạn tải song song (`maxConcurrent = 2`), tự giải phóng RAM sau 5 phút không hoạt động và bộ đệm Redis Base64 24 giờ.
    * Ranh giới bảo mật nghiêm ngặt: Lá số công khai (`isPublic: true`) cho phép tải tự do, lá số riêng tư (`isPublic: false`) chỉ chính chủ sở hữu mới có quyền tải về; audit logging với UUIDv7 `requestId`.

---

## 📡 3. Bản đồ API (RESTful Endpoints)

Hệ thống API Backend sử dụng tiền tố `/api` và phân chia thành các cụm chức năng sau:

### 🔐 Xác thực & Người dùng (`/api/auth`)
* `POST /api/auth/register`: Đăng ký tài khoản.
* `POST /api/auth/login`: Đăng nhập nhận JWT.
* `PUT /api/auth/bazi`: Lưu thông tin ngày sinh mặc định của người dùng.
* `PUT /api/auth/profile`: Cập nhật thông tin hồ sơ cá nhân.
* `PUT /api/auth/change-password`: Thay đổi mật khẩu người dùng.

### ☯️ Gieo Quẻ Kinh Dịch
* `POST /api/iching/calculate` (và các alias `/api/hexagrams/calculate`, `/api/calculate`): Tính toán thông số quẻ Kinh Dịch từ dữ liệu tung xu hoặc số lý Mai Hoa.

### 🌌 Lá Số Tứ Trụ Bát Tự
* `POST /api/bazi/analyze`: Lập lá số Bát Tự dựa trên ngày giờ sinh.

### 👫 Xem Tuổi Kết Hôn
* `POST /api/marriage/analyze`: So khớp Bát Tự Nam - Nữ và tính toán điểm tương hợp sơ bộ.

### 🌠 Hệ thống Tử Vi (`/api/ziwei` & `/api/tu-vi`)
* `POST /api/ziwei/`: Tạo lập đồ hình Tử Vi thô.
* `GET /api/ziwei/:id`: Chi tiết bản ghi Tử Vi.

### ☯️ Tra cứu khái niệm học thuật (`/api/concept`)
* `GET /api/concept/:term`: Tra cứu chi tiết một thuật ngữ phong thủy/gieo quẻ (Lục Thân, Lục Thú, hào Thế/Ứng) phục vụ hiển thị Tooltip giải thích.

### 🤖 Luận Giải AI & Trò chuyện Chat (`/api/ai` hoặc thông qua `/api/history`)
* `POST /api/ai/iching/:id/interpret` (hoặc `/api/history/iching/:id/interpret`): Stream kết quả phân tích quẻ Kinh Dịch (SSE).
* `POST /api/ai/iching/:id/chat` (hoặc `/api/history/iching/:id/chat`): Chat hỏi đáp sâu về quẻ Kinh Dịch (SSE).
* `POST /api/ai/bazi/:id/interpret` (hoặc `/api/history/bazi/:id/interpret`): Stream luận giải lá số Bát Tự.
* `POST /api/ai/bazi/:id/chat` (hoặc `/api/history/bazi/:id/chat`): Chat hỏi đáp về Bát Tự.
* `POST /api/ai/ziwei/:id/interpret` (hoặc `/api/history/ziwei/:id/interpret`): Stream kết quả luận giải lá số Tử Vi (SSE).
* `POST /api/ai/ziwei/:id/chat` (hoặc `/api/history/ziwei/:id/chat`): Chat hỏi đáp về Tử Vi.
* `POST /api/history/marriage/:id/interpret`: Stream luận đoán kết hôn/hợp hôn.
* `POST /api/history/marriage/:id/chat`: Chat hỏi đáp về kết hôn/hợp hôn.

### 🗂️ Lịch sử & Đánh giá (`/api/history`)
* `GET /api/history/iching/:userId`: Lấy lịch sử gieo quẻ Kinh Dịch.
* `GET /api/history/bazi/:userId`: Lấy lịch sử lập lá số Bát Tự.
* `GET /api/history/ziwei/:userId`: Lấy lịch sử lập lá số Tử Vi.
* `GET /api/history/marriage/:userId`: Lấy lịch sử xem tuổi kết hôn.
* `PUT /api/history/:type/:id/rate`: Đánh giá 1-5 sao cho bản ghi tương ứng.
* `PUT /api/history/:type/:id/link`: Liên kết bản ghi guest vào userId cụ thể sau khi đăng nhập.
* `DELETE /api/history/calculations/:type/:id`: Xóa bản ghi (chuyển trạng thái `isDeleted = true`).

### 🛠️ Quản trị hệ thống (`/api/admin`)
* `GET /api/admin/users`: Danh sách người dùng hệ thống.
* `PUT /api/admin/users/:id/role`: Cập nhật phân quyền (Admin / Co-Admin / User).
* `PUT /api/admin/users/:id/credits`: Cộng/trừ tiền ảo (Credits) của người dùng.
* `POST /api/admin/users/:id/lock` / `unlock`: Khóa/Mở khóa tài khoản.
* `GET /api/admin/calculations`: Xem toàn bộ các lượt tính toán của hệ thống.
* `DELETE /api/admin/calculations/:type/:id`: Xóa/Khóa bản ghi tính toán của người dùng.
* `GET /api/admin/analytics`: Thống kê tổng hợp hoạt động của máy chủ.
* `GET /api/admin/notifications`: Lấy danh sách thông báo hệ thống và khiếu nại.
* `POST /api/admin/appeals/:id/resolve`: Giải quyết đơn khiếu nại mở khóa.
* `GET /api/admin/events`: Đăng ký luồng sự kiện quản trị thời gian thực (SSE).

### 🔔 Thông báo Người dùng (`/api/notifications`)
* `GET /api/notifications`: Lấy danh sách thông báo nhắc nhở Ứng Kỳ của người dùng hiện tại.
* `PUT /api/notifications/read-all`: Đánh dấu đọc tất cả thông báo.
* `PUT /api/notifications/:id/read`: Đánh dấu đọc một thông báo cụ thể.

### 📄 Xuất Tệp PDF (`/api/export`)
* `POST /api/export/pdf/:type/:id`: Xuất tệp PDF lá số và luận giải AI theo cấu hình phân đoạn (scope). Áp dụng rate limit 5 req/min, Redis cache 24h, bảo vệ quyền sở hữu nghiêm ngặt và theo dõi kiểm toán qua `X-Request-ID`.

---

---

## 🚀 Hướng dẫn khởi chạy dự án tại địa phương

### Bước 1: Khởi động MongoDB
Đảm bảo MongoDB đã chạy trên máy của bạn (mặc định tại `mongodb://localhost:27017`).

### Bước 2: Cài đặt và cấu hình Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` tại thư mục `/backend` với nội dung mẫu:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/phongthuy
   JWT_SECRET=your_secret_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Khởi chạy máy chủ:
   ```bash
   npm run dev
   ```
5. Khởi chạy Unit Test Suite (Jest - 35 Test Suites, 257/257 Tests PASSED 100%):
   ```bash
   npm test
   ```

### Bước 3: Cài đặt và cấu hình Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` tại thư mục `/frontend` nếu cần chỉ định API URL:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
4. Khởi chạy Unit Test Suite Frontend (Vitest - 4 Test Suites, 29/29 Tests PASSED 100%):
   ```bash
   npm test
   ```
5. Khởi chạy giao diện nhà phát triển:
   ```bash
   npm run dev
   ```
6. Mở trình duyệt và truy cập `http://localhost:5173`.

### 🐳 Cách 2: Khởi chạy bằng Docker Compose và Luồng Tự Động CI/CD

Dự án đã được tích hợp quy trình **Tích hợp và Triển khai Liên tục (CI/CD)** đa tầng qua GitHub Actions:
- **Frontend CI (`.github/workflows/frontend-ci.yml`)**: Tự động kích hoạt khi có push/PR vào nhánh `main`, chạy 29 bài unit tests Vitest và đóng gói bundle `npm run build`.
- **Backend CI (`.github/workflows/backend-ci.yml`)**: Kiểm tra cú pháp và chạy toàn bộ 257 bài tests Jest tự động.
- **Deploy Pipeline (`.github/workflows/deploy.yml`)**: Kiểm tra nghiêm ngặt cả Frontend lẫn Backend trước khi build Docker, đẩy lên Docker Hub và tự động cập nhật lên máy chủ AWS EC2.
(Xem chi tiết tại [DEVELOPMENT_GUIDE.md](file:///t:/Phongthuy/docs/DEVELOPMENT_GUIDE.md)).

Nếu bạn muốn chạy đóng gói thủ công trên máy cục bộ, hãy làm theo các bước sau:

1. Đảm bảo đã tạo và cấu hình tệp `.env` tại thư mục `/backend` (kết nối MongoDB Atlas, cấu hình JWT_SECRET, GEMINI_API_KEY...).
2. Tại thư mục gốc của dự án, khởi chạy Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Toàn bộ hệ thống sẽ được phục vụ qua cổng `80` (HTTP) của máy host thông qua Nginx:
    - Truy cập `http://localhost/` hoặc địa chỉ IP public của máy ảo AWS để trải nghiệm giao diện người dùng (Frontend).
    - Truy cập `http://localhost/health` để kiểm tra trạng thái hoạt động của Backend.

---

## 💾 4. Hệ thống Sao lưu & Đồng bộ Google Drive Tự động

Dự án cung cấp sẵn một bộ công cụ tự động hóa sao lưu cơ sở dữ liệu MongoDB Atlas và tải lên Google Drive của bạn định kỳ để phòng ngừa sự cố mất mát dữ liệu.

### 📁 Các Script hỗ trợ (Thư mục `/scripts`)
* [backup.sh](file:///t:/Phongthuy/scripts/backup.sh): Khởi chạy container `mongo:8` chạy `mongodump` theo URI trong `.env`, nén file thành `.tar.gz` lưu trữ tại `backups/` và giới hạn tối đa 7 bản lưu cục bộ. Tự động gọi tiếp `upload_drive.sh` và `cleanup_drive.sh`.
* [upload_drive.sh](file:///t:/Phongthuy/scripts/upload_drive.sh): Sử dụng cấu hình `rclone` (trong `config/rclone/rclone.conf`) đồng bộ bản sao lưu lên tài khoản Google Drive đã liên kết.
* [cleanup_drive.sh](file:///t:/Phongthuy/scripts/cleanup_drive.sh): Tự động xóa các bản sao lưu cũ trên Google Drive, chỉ giữ lại **30 bản gần nhất**.
* [restore.sh](file:///t:/Phongthuy/scripts/restore.sh): Khôi phục dữ liệu từ tệp tin backup `.tar.gz`.

### ⏱️ Tự động hóa qua Host-level Cronjob (GMT+7)
Thiết lập cronjob chạy tự động vào **00:00 đêm hàng ngày** trên hệ điều hành của máy chủ AWS/VPS:
1. Đăng nhập vào Server qua SSH.
2. Cấp quyền chạy cho các script:
   ```bash
   chmod +x scripts/*.sh
   ```
3. Mở cấu hình cronjob của Server:
   ```bash
   crontab -e
   ```
4. Thêm cấu hình chạy lúc 00:00 hàng ngày (đảm bảo Server đã được đổi múi giờ Việt Nam qua lệnh `sudo timedatectl set-timezone Asia/Ho_Chi_Minh`):
   ```cron
   0 0 * * * /bin/bash /home/ubuntu/phongthuy/Phong_Thuy/scripts/backup.sh >> /home/ubuntu/phongthuy/Phong_Thuy/logs/backup.log 2>&1
   ```
5. Theo dõi nhật ký chạy tại `/home/ubuntu/phongthuy/Phong_Thuy/logs/backup.log`.
