# 📋 BUSINESS_RULES.md - Quy tắc Nghiệp vụ Học thuật & Hệ thống

Tài liệu này tập hợp toàn bộ các logic, quy tắc nghiệp vụ phong thủy cổ học và quy tắc vận hành hệ thống được lập trình trong mã nguồn.

---

## ☯️ 1. Quy tắc Học thuật Kinh Dịch (IChing)

### 1.1 Tự động định vị Dụng Thần (`RuleEngineService.js`)
Dụng Thần (đối tượng cần xem xét chính trong quẻ) được xác định tự động dựa trên từ khóa câu hỏi của người dùng và giới tính của họ:

| Từ khóa trong câu hỏi | Giới tính người hỏi | Dụng Thần tương ứng | Ý nghĩa học thuật |
| :--- | :--- | :--- | :--- |
| `vợ`, `bạn gái`, `người yêu nữ`, `cưới`, `hôn nhân` | Nam (1) | **Thê Tài** | Đại diện cho vợ, bạn gái, của cải |
| `chồng`, `bạn trai`, `người yêu nam`, `cưới`, `hôn nhân` | Nữ (0) | **Quan Quỷ** | Đại diện cho chồng, công danh |
| `tiền`, `tài`, `kinh doanh`, `mua bán`, `đầu tư` | Bất kỳ | **Thê Tài** | Tài lộc, tiền của, lợi nhuận |
| `công việc`, `sự nghiệp`, `chức vụ`, `thăng tiến`, `quan` | Bất kỳ | **Quan Quỷ** | Công danh, quan chức, áp lực |
| `học hành`, `thi cử`, `giấy tờ`, `hợp đồng`, `cha mẹ` | Bất kỳ | **Phụ Mẫu** | Học vấn, bằng cấp, che chở |
| `con cái`, `bệnh tật`, `sức khỏe`, `bình an`, `thuốc` | Bất kỳ | **Tử Tôn** | Con cái, phúc thần, giải trừ ách |
| `bạn bè`, `đối tác`, `anh em`, `hợp tác` | Bất kỳ | **Huynh Đệ** | Đồng môn, hao tài, chia sẻ |
| Khác / Không khớp từ khóa | Bất kỳ | **Thế** | Bản thân người hỏi |

### 1.2 Phân tích Vượng Suy và Hào Động
- **Độ mạnh yếu của hào:** Dựa vào ngũ hành ngày/tháng gieo quẻ đối chiếu ngũ hành của hào:
  - **Mạnh (strong):** Nếu trạng thái hào là `Vượng` hoặc `Tướng`.
  - **Yếu (weak):** Nếu trạng thái hào là `Hưu`, `Tù`, `Tử`.
- **Hóa Tiến / Hóa Thoái:**
  - Nếu hào động biến ra hào có cùng ngũ hành: So sánh thứ tự Địa Chi. Địa Chi biến tăng tiến lên (ví dụ: Dần hóa Mão) thì gọi là **Hóa Tiến** (tốt lên). Nếu đi lùi thì gọi là **Hóa Thoái** (suy giảm).
  - Nếu khác ngũ hành: Áp dụng quy luật ngũ hành sinh khắc giữa hào chính và hào biến để xác định **Hóa Sinh (Tốt)** hoặc **Hóa Khắc (Xấu)**.

### 1.3 Quy lý Số Động Tâm Mai Hoa
- **Lập quẻ theo Giờ:**
  - Thượng quái = (Năm + Tháng + Ngày âm lịch) % 8. (Số dư 0 tính là 8 - Cung Khôn).
  - Hạ quái = (Năm + Tháng + Ngày + Giờ âm lịch) % 8.
  - Hào động = (Năm + Tháng + Ngày + Giờ âm lịch) % 6. (Số dư 0 tính là hào 6).
- **Lập quẻ theo Seri Tiền 8 Số:**
  - Chia dãy số làm 2 nửa (mỗi bên 4 số).
  - Thượng quái = Tổng 4 số đầu % 8.
  - Hạ quái = Tổng 4 số sau % 8.
  - Hào động = Tổng 8 số % 6.

---

## 🌠 2. Quy tắc Nghiệp vụ Tử Vi (Ziwei)

### 2.1 An sao bản mệnh
Sử dụng phương pháp Tử Vi Bắc Phái định vị Mệnh - Thân:
- Định Cục (Kim Tứ Cục, Thủy Nhị Cục, Mộc Tam Cục, Hỏa Lục Cục, Thổ Ngũ Cục) để an sao Tử Vi và Thiên Phủ làm nòng cốt.
- Độ sáng của sao (Đắc Hãm): Được tính toán và gắn nhãn theo 5 mức độ: **Miếu (廟)**, **Vượng (旺)**, **Đắc (得)**, **Bình (平)**, **Hãm (陷)** để xác định độ ảnh hưởng tốt xấu của tinh tú tại cung vị đó.

---

## 👫 3. Quy tắc Hợp Hôn (Marriage)

- **Ngũ Hành tương sinh:** So khớp bản mệnh của Nam và Nữ (ví dụ: Kim sinh Thủy là tương sinh tốt).
- **Cung Phi Bát Trạch:** Tính toán Cung Phi dựa trên năm sinh và giới tính. So sánh Cung Phi Nam và Cung Phi Nữ để tìm ra cung phối hướng tốt/xấu: Sinh Khí, Diên Niên, Thiên Y, Phục Vị (Tốt); Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại (Xấu).

---

## 🔒 4. Quy tắc Kiểm soát Tài nguyên & Vận hành

### 4.1 Cơ chế Cooldown & Rate Limit của AI
- **Thời gian hồi chiêu (Cooldown):** Khoảng cách tối thiểu giữa 2 lần bấm chat/luận giải của một người dùng là **10 giây** (COOLDOWN_TIME_SECONDS).
- **Giới hạn số câu hỏi chat:** Tối đa **10 câu/giờ** (CHAT_LIMIT_PER_HOUR) đối với mỗi tài khoản nhằm hạn chế tình trạng spam chi phí API.
- **Lọc chủ đề chat (`isDivinationRelated`):** Dịch vụ phân tích ý định sẽ từ chối trả lời nếu người dùng hỏi lệch hướng (ví dụ: hỏi viết code, làm toán, lập trình...). Ngoại trừ việc hỏi về thời tiết và chọn ngày cát lành được phép thông qua.

### 4.2 Cấp phát Credits hàng ngày & Xóa tài khoản soft-delete
Tác vụ chạy định kỳ lúc nửa đêm của `NotificationScheduler.js` thực hiện:
- **Cấp credit:** Tự động cộng **+1 credit** cho toàn bộ người dùng active có role là `user` hoặc `vip`.
- **Dọn dẹp database:** Tìm kiếm những tài khoản bị xóa mềm (`isDeleted: true`) quá **30 ngày** và thực hiện xóa vĩnh viễn (Hard Delete) tài khoản đó cùng toàn bộ lịch sử Bát Tự, Tử Vi, Kinh Dịch, Kết Hôn, Chat liên quan để tối ưu tài nguyên lưu trữ.

### 4.3 Quét lịch thông báo Ứng Kỳ
- Mỗi ngày, scheduler quét các bản ghi Kinh Dịch có mảng `ungKy` đang ở trạng thái `pending`.
- Tính toán ngày solar tương lai tương ứng với dự đoán của AI.
- Nếu thời gian hiện tại cách ngày Ứng Kỳ đúng **3 ngày, 2 ngày, hoặc 1 ngày**, hệ thống sẽ:
  - Tạo tài liệu thông báo trong bảng `Notification` hiển thị trên giao diện người dùng.
  - Gửi email nhắc nhở về sự kiện Ứng Kỳ cát hung tới email đăng ký của người dùng.

### 4.4 Quyền riêng tư & Hiệu lực phiên đăng nhập (Session & Data Privacy)
- **Bảo mật quyền sở hữu dữ liệu:**
  - Mỗi bản ghi học thuật (Kinh Dịch, Bát Tự, Tử Vi, Hợp Hôn) và các đoạn hội thoại chat AI đều được gắn nhãn sở hữu bởi ID người dùng lập ra nó.
  - Một người dùng thông thường tuyệt đối không được quyền truy cập chéo để xem chi tiết hoặc gọi AI luận giải trên các bản ghi của người khác (ngay cả khi biết ID bản ghi). Hành vi vi phạm sẽ bị chặn bởi hệ thống kiểm soát quyền riêng tư.
  - Chỉ có quản trị viên (Admin/Co-Admin) hoặc chính chủ sở hữu mới có quyền truy cập. Khách vãng lai (guest) chỉ được xem các bản ghi do khách tự lập.
- **Hiệu lực phiên đăng nhập:**
  - Phiên đăng nhập (token JWT) có thời hạn tối đa là **7 ngày** kể từ khi đăng nhập thành công.
  - Khi người dùng chủ động nhấn **Đăng xuất (Logout)**, hệ thống sẽ thực hiện lệnh tăng phiên bản token (`tokenVersion`) trên máy chủ, lập tức vô hiệu hóa token hiện tại và tất cả các token đã cấp trước đó của tài khoản này để phòng tránh lạm dụng token cũ.
