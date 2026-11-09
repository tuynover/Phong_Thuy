# ☀️ BẢN KẾ HOẠCH XÂY DỰNG LIGHT MODE CHO PHÂN HỆ QUẢN TRỊ (ADMIN DASHBOARD)

> **Mục tiêu:** Cung cấp trải nghiệm thị giác đa dạng cho Quản trị viên (Super Admin & Co-Admin) thông qua cơ chế chuyển đổi mượt mà giữa **Dark Mode** (mặc định hiện tại) và **Light Mode** (phong cách thanh lịch, tối giản, tương tự modal Sức Khỏe Hệ Thống Hình 1), đảm bảo tiêu chuẩn tương phản WCAG 2.1 AA, tính nhất quán nhận diện và không gây giật lag (FOUC).

---

## 🏛️ 1. Hiện Trạng Kiến Trúc Giao Diện Admin Hiện Tại

### 1.1 Đặc điểm hiện hữu
- Phân hệ Admin (`AdminApp.jsx` và các Tab con `AdminOverviewTab`, `AdminUsersTab`, `AdminCalculationsTab`, `AdminAlertsTab`, `AdminBlogTab`, `AdminConfigTab`, `AdminSystemHealthCard`, `AdminDlqModal`) đang sử dụng các class Tailwind CSS cố định thuộc tông màu tối:
  - Nền tổng thể: `bg-slate-950` / `bg-[#0b0f19]`
  - Nền container/card: `bg-slate-900/60`, `bg-slate-950/40`, `bg-slate-900`
  - Viền phân cách: `border-slate-800`, `border-slate-800/80`, `border-slate-850`
  - Chữ chính: `text-slate-100`, `text-slate-200`
  - Chữ phụ/thứ cấp: `text-slate-400`, `text-slate-500`, `text-slate-550`
  - Điểm nhấn: `amber-500` (Thương hiệu hoàng gia phong thủy), `purple-400` (Token AI), `blue-400` (Hạ tầng hệ thống).

### 1.2 Vấn đề khi cần chuyển đổi
- Hiện tại các component lồng ghép các class màu sắc trực tiếp (`hardcoded color classes`), chưa có lớp trừu tượng (abstraction layer) hoặc `theme token` đại diện cho ngữ nghĩa (semantic tokens như `bg-surface`, `border-divider`, `text-primary`).
- Giao diện modal mới tạo theo Hình 1 (`AdminSystemHealthModal.jsx`) đã được thiết kế theo phong cách Light Mode độc lập (nền trắng tinh tế, viền xám mềm mại, chữ đen xám sang trọng). Đây là chuẩn mực thị giác mẫu để đồng bộ hóa cho toàn bộ Admin App.

---

## 🎨 2. Hệ Thống Thiết Kế Token (Design Tokens) Dark vs Light

### 2.1 Bảng Quy Đổi Màu Sắc Ngữ Nghĩa (Semantic Color Tokens)

| Thành Phần Giao Diện | Dark Mode (Hiện tại) | Light Mode (Kế hoạch - Phong cách Hình 1) | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Nền Toàn Trang (App Background)** | `bg-[#07090e]` / `bg-slate-950` | `bg-slate-50` / `bg-[#f8fafc]` | Nền bao quát toàn bộ Admin Dashboard |
| **Thanh Điều Hướng (Header/Sidebar)** | `bg-slate-950/90 border-slate-800` | `bg-white/95 border-slate-200` | Header cố định, kính mờ (backdrop-blur) |
| **Thẻ Bao Bọc (Card Surface)** | `bg-slate-900/60 border-slate-800` | `bg-white border-slate-200/80 shadow-sm` | Các khối container, thống kê, danh sách |
| **Thẻ Nổi / Phân Khối (Sub-card / Pill)** | `bg-slate-950/40 border-slate-800/60` | `bg-slate-50/80 border-slate-100` | Các ô con bên trong card lớn |
| **Viền Phân Cách (Borders/Dividers)** | `border-slate-800` / `border-slate-850` | `border-slate-200` / `border-slate-150` | Đường kẻ chia bảng, phân tách dòng |
| **Văn Bản Tiêu Đề (Text Primary)** | `text-slate-100` / `text-white` | `text-slate-900` / `text-slate-850` | H1, H2, tên người dùng, số liệu lớn |
| **Văn Bản Thân (Text Secondary)** | `text-slate-300` / `text-slate-400` | `text-slate-600` / `text-slate-700` | Mô tả, nhãn trường, nội dung bảng |
| **Văn Bản Ghi Chú (Text Muted)** | `text-slate-500` / `text-slate-550` | `text-slate-400` / `text-slate-500` | Timestamps, placeholder, breadcrumbs |
| **Ô Nhập Liệu (Input / Select)** | `bg-slate-950/80 border-slate-700` | `bg-white border-slate-300 text-slate-800` | Form tìm kiếm, cấu hình, date picker |
| **Hàng Bảng Khi Hover (Table Row Hover)**| `hover:bg-slate-900/50` | `hover:bg-slate-50/80` | Hiệu ứng trỏ chuột vào danh sách |
| **Modal Nổi (Dialog / Backdrop)** | `bg-black/80` + `bg-slate-950` | `bg-slate-900/40 backdrop-blur-sm` + `bg-white` | Popup chi tiết, xác nhận hành động |

### 2.2 Quy Chuẩn Trạng Thái Huy Hiệu (Badges & Statuses)
- **Trạng thái Hoạt Động / Thành Công (Success):**
  - *Dark:* `bg-emerald-950/40 text-emerald-400 border-emerald-800/50`
  - *Light:* `bg-emerald-50 text-emerald-700 border-emerald-200` (Chuẩn theo Hình 1: `Đang kết nối`, `Hoạt động tốt`, `Sẵn sàng`)
- **Trạng thái Cảnh Báo (Warning):**
  - *Dark:* `bg-amber-950/40 text-amber-400 border-amber-800/50`
  - *Light:* `bg-amber-50 text-amber-700 border-amber-200`
- **Trạng thái Nguy Hiểm / Lỗi (Danger):**
  - *Dark:* `bg-rose-950/40 text-rose-400 border-rose-800/50`
  - *Light:* `bg-rose-50 text-rose-700 border-rose-200`

---

## 🛠️ 3. Phương Án Kỹ Thuật Triển Khai (Implementation Architecture)

### 3.1 Giải Pháp: Theme Provider Cục Bộ Cho Phân Hệ Quản Trị
Để bảo đảm phân hệ Khách hàng (`UserApp.jsx` - mang phong cách Huyền Học Huyền Bí, nền tối phong thủy kinh dịch) không bị ảnh hưởng, cơ chế Theme của Admin sẽ được cô lập cục bộ:

```
[AdminApp Container]
       │
       ├── State: `adminTheme` ('dark' | 'light')
       │   └── Khởi tạo: `localStorage.getItem('admin_theme') || 'dark'`
       │
       └── Thêm Class ngữ cảnh lên Root Wrapper:
           <div className={`admin-root min-h-screen ${adminTheme === 'light' ? 'admin-theme-light' : 'admin-theme-dark'}`}>
```

### 3.2 Tận Dụng Sức Mạnh Của Tailwind CSS v4 / CSS Variables
Khai báo bộ biến CSS gọn nhẹ trong `frontend/src/index.css` scoped theo `.admin-theme-light`:

```css
/* LIGHT THEME TOKENS FOR ADMIN */
.admin-theme-light {
  --admin-bg-base: #f8fafc;
  --admin-bg-surface: #ffffff;
  --admin-bg-subtle: #f1f5f9;
  --admin-border: #e2e8f0;
  --admin-border-subtle: #edf2f7;
  --admin-text-primary: #0f172a;
  --admin-text-secondary: #475569;
  --admin-text-muted: #94a3b8;
  --admin-input-bg: #ffffff;
  --admin-table-hover: #f8fafc;
}
```

Và kết hợp hỗ trợ trực tiếp các class điều kiện tinh gọn của Tailwind:
`adminTheme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'`
hoặc sử dụng hook `useAdminTheme()` chia sẻ qua Context `AdminThemeContext`.

### 3.3 Thiết Kế Nút Gạt Theme Switcher (UI UX)
- **Vị trí đặt:** Nằm ở Header của Admin Bar, cạnh Avatar người dùng và nút "VỀ GIAO DIỆN USER".
- **Hiệu ứng:** 
  - Khi ở Dark Mode: Icon Mặt Trăng 🌙 (`Moon`, màu vàng dịu).
  - Khi ở Light Mode: Icon Mặt Trời ☀️ (`Sun`, màu hổ phách/cam ấm).
  - Có Tooltip: *"Chuyển sang chế độ Sáng (Light Mode)"* / *"Chuyển sang chế độ Tối (Dark Mode)"*.
  - Lưu tức thì vào `localStorage.setItem('admin_theme', newTheme)` để giữ nguyên trạng thái khi reload.

---

## 🗺️ 4. Lộ Trình Triển Khai Chi Tiết (Roadmap)

### Giai đoạn 1: Nền tảng & Theme Switcher (Foundations)
1. Tạo `AdminThemeContext.jsx` cung cấp `theme`, `toggleTheme` và `isLight`.
2. Tích hợp nút `ThemeSwitcher` vào Header Bar của `AdminApp.jsx`.
3. Lưu và khôi phục trạng thái từ `localStorage`.

### Giai đoạn 2: Di chuyển từng Tab (Component Migration)
1. **Overview Tab (`AdminOverviewTab.jsx`):**
   - 8 thẻ chỉ số tổng quan (Users, Records, IChing, Bazi, Ziwei, Marriage, Feixing, Numerology).
   - Biểu đồ Recharts (`AreaChart`, `BarChart`): Chuyển màu nền lưới tọa độ `CartesianGrid` và tooltip sang nền trắng viền xám nhẹ trong Light Mode.
   - Bảng top người dùng tiêu thụ tokens.
2. **DevOps Card (`AdminSystemHealthCard.jsx`):**
   - Chuyển 4 khối Card MongoDB, Redis, Server RAM, Async Queue sang tông nền sáng `bg-white border-slate-200`.
   - Kết nối mượt mà với `AdminSystemHealthModal.jsx` (đã là Light Mode 100%).
3. **Users Tab (`AdminUsersTab.jsx`):**
   - Bảng danh sách hội viên, input tìm kiếm, bộ lọc role/status, modal điều chỉnh credits.
4. **Calculations Tab (`AdminCalculationsTab.jsx`):**
   - Bộ thanh 6 Tab phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hợp Hôn, Phi Tinh, Thần Số Học).
   - Bảng hiển thị kết quả tính toán và modal xem chi tiết dịch bản.
5. **Config Tab (`AdminConfigTab.jsx`):**
   - 5 nhóm cấu hình (AI, Security, Database, SMTP, System).
   - Input ẩn/hiện key nhạy cảm, dropdown chọn Gemini model, nút Test Connection.
6. **Blog & Alerts Tab (`AdminBlogTab.jsx`, `AdminAlertsTab.jsx`):**
   - Bảng bài viết và danh sách cảnh báo bảo mật.

### Giai đoạn 3: Kiểm Thử & Kiểm Toán Tương Phản (Contrast & QA)
1. Đo kiểm độ tương phản WCAG 2.1 AA (tỷ lệ tương phản tối thiểu 4.5:1 cho văn bản thông thường và 3:1 cho tiêu đề lớn).
2. Kiểm tra khả năng render của biểu đồ `Recharts` trong môi trường nền sáng.
3. Kiểm thử trên Google Chrome thông qua `chrome-devtools-mcp` theo quy tắc bắt buộc của `AGENTS.md`.

---

## 📌 5. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)
- [x] Đã hoàn thành modal Sức Khỏe & Trạng Thái Hệ Thống (Hình 1) dạng Light Mode.
- [ ] Admin có thể chuyển đổi qua lại giữa Light Mode và Dark Mode chỉ bằng 1 cú click.
- [ ] Không có hiện tượng giật màn hình hoặc vỡ màu chữ (trắng trên nền trắng hoặc đen trên nền đen).
- [ ] Các thông số nhạy cảm (API Key, Passwords) vẫn được che giấu mặt nạ bảo mật nghiêm ngặt ở cả 2 chế độ.
- [ ] Giao diện người dùng ngoài (`UserApp`) hoàn toàn độc lập, giữ trọn vẹn bản sắc cổ học Phương Đông.
