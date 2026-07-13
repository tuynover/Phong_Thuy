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

### 4.5 Quy trình Xác thực & Khôi phục mật khẩu qua Email OTP
- **Sinh mã OTP:** Khi yêu cầu khôi phục mật khẩu (`POST /forgot-password`), hệ thống tự động kiểm tra tài khoản, sinh mã OTP ngẫu nhiên gồm 6 chữ số (`000000 - 999999`) và cập nhật thời hạn hết hạn là **15 phút**.
- **Gửi Email OTP:** Máy chủ gửi một email định dạng HTML chứa mã OTP nổi bật đến email của người dùng.
- **Xác thực đặt lại mật khẩu (`POST /reset-password`):** Người dùng nhập đúng mã OTP còn hiệu lực kèm mật khẩu mới (độ dài tối thiểu 6 ký tự). Sau khi cập nhật thành công mật khẩu mới (mã hóa bcrypt), hệ thống sẽ tăng `tokenVersion` lên 1 để tự động đăng xuất tất cả phiên đăng nhập cũ của tài khoản.
- **Rate Limit:** Cả hai endpoint quên mật khẩu và khôi phục mật khẩu đều được bảo vệ bởi middleware `authLimiter` nhằm chống brute-force và spam email.

---

## 🌌 5. Quy tắc Học thuật Bát tự Ngũ hành (Bazi) - Phiên bản 4.0

### 5.1 Trọng số điểm cơ sở
- **Thiên can thường:** 15 điểm. Can tháng: 7.5 điểm (1/2 can thường).
- **Địa chi thường:** 10 điểm. Chi tháng (Nguyệt lệnh): 25 điểm. Điểm của địa chi được phân rã hoàn toàn vào các tàng can theo tỷ lệ (Tý/Mão/Dậu = 100%; Ngọ/Hợi = 70/30; Sửu/Dần/Thìn/Tỵ/Mùi/Thân/Tuất/Hợi = 60/30/10).

### 5.2 Lệnh Mùa của các tháng Tứ Quý (Thìn, Sửu, Mùi, Tuất)
- **Tháng Thìn, Sửu:** Thổ vượng ($\times 1.5$), Kim tướng ($\times 1.2$), Hỏa & Thủy nửa Hưu nửa Tù ($\times 0.9$), Mộc tử ($\times 0.6$).
- **Tháng Mùi, Tuất:** Thổ vượng ($\times 1.5$), Kim tướng ($\times 1.2$), Hỏa nửa Tướng nửa Tù ($\times 1.0$), Thủy nửa Tù nửa Tử ($\times 0.7$), Mộc tử ($\times 0.6$).

### 5.3 Quan hệ Địa chi Ưu tiên (Hợp xung giải trừ)
- Định nghĩa phân cấp độ ưu tiên của các quan hệ địa chi:
  - Cấp 1 (Cao nhất): Tam Hội, Tam Hợp.
  - Cấp 2: Lục Hợp.
  - Cấp 3 (Thấp nhất): Lục Xung, Lục Hại, Lục Phá, Hình.
- Nếu một Địa Chi đã tham gia vào tổ hợp có ưu tiên cao hơn, sức ảnh hưởng điểm số của nó ở các tổ hợp có ưu tiên thấp hơn (như bị xung, hình, hại) sẽ bị giảm trừ **80%** (Hợp giải xung).

### 5.4 Đa thấu phân khí (Nguyệt lệnh)
- Nếu có $N \ge 2$ Thiên can cùng thấu từ các tàng can của Chi tháng sinh (Nguyệt lệnh), điểm số Root Power thấu can được cộng thêm cho mỗi can sẽ được chia đều cho $N$ để thể hiện sự phân tán khí lực của Nguyệt lệnh.

### 5.5 Tiết khí cực đoan (Con vượng Mẹ kiệt)
- Nếu một ngũ hành bất kỳ chiếm tỷ lệ $>35\%$ tổng điểm thô, hành sinh ra nó (mẹ) bị tiết khí cực đoan và suy giảm **30%** điểm số hiện có.
- Nếu ngũ hành con vượng vừa phải ($25\% \le \text{tỷ lệ} \le 35\%$), hành mẹ được cộng hưởng tăng thêm **10%** điểm số (Mẫu dĩ tử quý).

### 5.6 Phá điểm sàn phục vụ Tòng Cách
- Nếu một ngũ hành bất kỳ chiếm tỷ lệ cực thịnh $>65\%$ tổng điểm thô trước khi xét điểm sàn, hệ thống kích hoạt trạng thái **Khắc nhập Tòng Cách** và **vô hiệu hóa điểm sàn tối thiểu 5%** đối với các hành bị khắc/tử tuyệt hoàn toàn, cho phép điểm số của chúng hạ sát về 0% nhằm nhận diện cách cục Tòng cách chính xác.

