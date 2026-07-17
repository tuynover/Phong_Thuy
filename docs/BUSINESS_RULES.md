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

## 🌌 5. Quy tắc Học thuật Bát tự Ngũ hành (Bazi) - Phiên bản 5.0 (Toán Học Cân Bằng Động)

### 5.1 Phân Tách Hai Tầng (Base vs Multipliers)
*   **Tầng 1 (Base Score - Điểm Nền):** Chỉ tính điểm Thiên can ($15$ điểm, Can tháng $7.5$ điểm), Địa chi ($10$ điểm, Chi tháng $25$ điểm) phân rã theo tỷ lệ tàng can và điểm cộng thấu can Nguyệt Lệnh (Root Power thấu can). Không cộng điểm thưởng tĩnh.
*   **Tầng 2 (Multipliers - Hệ Số Nhân Tỷ Lệ %):** Tất cả các quan hệ học thuật khác (Season, Thông căn, Chân thần, Hợp/Xung/Hại, Sinh khắc phi tuyến, Bão hòa/Bù đắp) hoạt động dưới dạng hệ số nhân tăng/giảm theo tỷ lệ phần trăm trực tiếp trên điểm nền, triệt tiêu hiện tượng đếm trùng (Double Counting).

### 5.2 Hiệu Ứng Suy Giảm (Diminishing Returns) & Trọng Số Gốc
*   **Thông Căn Diminishing Returns:** Khi thiên can có nhiều gốc thông căn ở các địa chi, hiệu lực các gốc được sắp xếp giảm dần để tránh lạm phát năng lượng: Gốc 1 ($100\%$), Gốc 2 ($70\%$), Gốc 3 ($40\%$), Gốc 4 ($20\%$).
*   **Trọng Số Gốc:** Phân biệt rõ rệt nguồn gốc thông căn dựa trên loại tàng can: Bản khí ($100\%$ sức mạnh gốc), Trung khí ($70\%$), Dư khí ($40\%$).

### 5.3 Bonus Hợp/Xung Dạng Phần Trăm (%)
*   Các tổ hợp địa chi biến đổi hệ số nhân: Tam Hợp ($+20\%$), Bán Tam Hợp ($+5\%$), Tam Hội ($+15\%$), Lục Hợp ($+12\%$ chia đều), Lục Xung ($-12\%$), Hình ($-12\%$), Lục Hại ($-6\%$), Lục Phá ($-5\%$).
*   **Hóa khí mồi cho hành khuyết:** Nếu một hành hoàn toàn khuyết ($0$ điểm) nhưng tham gia vào Hợp cục hóa khí, hệ thống sẽ tự động cấp một lượng điểm nền mồi bằng $3.0$ điểm trước khi nhân hệ số hợp hóa.

### 5.4 Tương Sinh Khắc Phi Tuyến & Ngưỡng Mượt (Smooth Activation)
*   **Sinh khắc tương đối:** Lực sinh khắc tính theo tỷ lệ tương đối giữa hai hành $\frac{\text{Score}(A)}{\text{Score}(A) + \text{Score}(B)}$ thay vì tuyến tính, phản ánh thực tế giằng co năng lượng.
*   **Làm mượt ngưỡng kích hoạt:** Thay thế các ngưỡng cứng (như $35\%$ cho phản sinh, $65\%$ cho tòng cách) bằng hàm mượt **Smoothstep** liên tục để triệt tiêu việc nhảy bậc năng lượng đột ngột tại ranh giới.
*   **Bão hòa & Bù đắp:** 
    *   Hành cực thịnh bị bão hòa năng lượng (tỷ lệ $>40\% \rightarrow$ giảm $30\%$ bonus; $>50\% \rightarrow$ giảm $50\%$; $>60\% \rightarrow$ giảm $80\%$).
    *   Hành cực suy được bù đắp hỗ trợ chuyển hóa (tỷ lệ $<8\% \rightarrow$ nhân $1.3$ lần bonus; $<5\% \rightarrow$ nhân $1.5$ lần).

### 5.5 Điểm Sàn Phân Cấp & Chuẩn Hóa
*   **Điểm sàn phân cấp:** Khi không tòng cách, điểm sàn tối thiểu phụ thuộc vào mức độ hiện diện: Can lộ ($5\%$), Bản khí ẩn ($4\%$), Trung khí ẩn ($2\%$), Dư khí ẩn ($1\%$) của điểm cơ sở ngũ hành.
*   **Tòng cách bypass:** Nếu có 1 hành vượt trội chiếm $>65\%$ tổng điểm thô $\rightarrow$ Vô hiệu hóa hoàn toàn điểm sàn để các hành bị xung khắc rơi tự do về $0\%$.

### 5.6 Các Chỉ Số Học Thuật Cao Cấp (Output)
*   **Entropy ($H$):** Đo lường mức độ lưu thông/cân bằng của lá số:
    $$H = -\sum_{i=1}^{5} P_i \ln(P_i)$$
*   **Dominance Index:** Đo mức độ chuyên chế, chuyên khí của lá số:
    $$\text{Dominance} = \text{Max}(P_i) - 0.20$$
*   **Confidence Score:** Chỉ số độ tin cậy của lá số tính bằng nguồn lực thấu can và thông căn thực tế của Nhật Chủ.
*   **Raw Scores:** Lưu trữ điểm thô thực tế chưa chuẩn hóa của ngũ hành để so sánh tổng lượng khí lực của đương số.

### 5.7 Tương Tác Khoảng Cách & Cản Trở Dòng Khí (Bazi 5.1 Upgrade)
*   **Cự ly Can Chi:** Khoảng cách địa lý giữa các cột (Trụ) ảnh hưởng trực tiếp đến cường độ giao thoa khí lực.
*   **Quá Tải Tương Tác Can (Saturation):** Thiên can ưu tiên tương sinh/khắc ở cự ly gần nhất ($100\%$ lực). Cự ly xa hơn bị suy hao: Cách 1 trụ ($50\%$ lực), Cách 2 trụ ($20\%$ lực).
*   **Can Trung Gian Cản Trở (Blockage):** Hai Can ở xa nhau (Năm-Ngày, Tháng-Giờ, Năm-Giờ) bị cản trở triệt để (giảm $90\%$ lực tương tác, hệ số $0.1$) nếu có Can ở giữa mạnh (tổng điểm gốc $\ge 5.0$ hoặc có bản khí thông căn) và khắc một trong hai Can đầu cuối.
*   **Cự Ly Địa Chi (Branch Distance Multiplier):** Các tổ hợp địa chi bị giảm lực hợp/xung theo khoảng cách:
    *   *Cặp chi (Xung, Hợp, Bán tam hợp):* Kề nhau ($\times 1.0$), Cách 1 trụ ($\times 0.6$), Cách 2 trụ ($\times 0.3$).
    *   *Bộ 3 chi (Tam Hợp, Tam Hội):* Liền kề ($\times 1.0$), Có 1 chi rời rạc ($\times 0.7$), Rời rạc hoàn toàn ($\times 0.5$).

### 5.8 Lực Lượng Can Chi Nội Tại Trụ (Bazi 5.2 Upgrade)
*   **Nguyên lý:** Can và Chi của từng Trụ có mối tương tác dọc nội tại, ảnh hưởng trực tiếp đến sức mạnh nền của chúng trước khi tham gia tương sinh/khắc ngoại vi.
*   **Các nhóm tổ hợp:**
    *   *Tải (Chi sinh Can - 12 Can Chi):* Đỡ Can lên $\rightarrow$ Can tăng $+20\%$ đến $+30\%$, Chi giảm $-20\%$ đến $-30\%$. Ngoại lệ Canh Thìn (魁罡) Can $+20\%$, Chi $+30\%$.
    *   *Phúc (Can sinh Chi - 12 Can Chi):* Xả khí Can $\rightarrow$ Can giảm $-30\%$, Chi tăng $+30\%$.
    *   *Song Thể (Đồng hành - 12 Can Chi):* Can Chi cộng hưởng hỗ trợ nhau $\rightarrow$ Can tăng $+50\%$, Chi tăng $+50\%$.
    *   *Che Đầu (Chi khắc Can - 12 Can Chi):* Đè đầu Can xuống $\rightarrow$ Can giảm $-30\%$ (Giáp Thìn $-0\%$), Chi giảm từ $-50\%$ đến $-70\%$.
    *   *Tiết Cước (Can khắc Chi - 12 Can Chi):* Can đè Chi xuống $\rightarrow$ Can giảm $-40\%$ hoặc $-50\%$, Chi giảm $-25\%$ hoặc $-30\%$.

### 5.9 Công thức Cung Mệnh & Thai Nguyên chuẩn hóa
*   **Địa chi Cung Mệnh:** $26 - (\text{Chi Tháng} + \text{Chi Giờ}) \pmod{12}$ (với Dần = 1).
*   **Thiên can Cung Mệnh:** $\text{Can Cung Mệnh} = \text{Can Tháng} + (\text{Chi Cung Mệnh} - \text{Chi Tháng}) \pmod{10}$.
*   **Thai Nguyên (Conception Palace):** $\text{Can Thai Nguyên} = \text{Can Tháng} + 1 \pmod{10}$ và $\text{Chi Thai Nguyên} = \text{Chi Tháng} + 3 \pmod{12}$.







