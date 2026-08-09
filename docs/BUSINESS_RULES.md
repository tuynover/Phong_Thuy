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
*   **Mẹ vượng hại con (Phản sinh cực đoan):** Nếu hành mẹ chiếm tỷ lệ $>30\%$, sẽ gây áp lực phạt giảm mạnh hành con (như Thủy vượng Mộc trôi).
*   **Con vượng khắc ngược cha (Phản khắc cực đoan):** Nếu hành con vượt trội hơn gấp đôi hành cha, hành cha sẽ bị phạt giảm mạnh (như Thủy vượng Thổ lưu).
*   **Thuận khắc cực đoan (Cường khắc):** Nếu hành khắc (attacker) quá mạnh chiếm tỷ lệ $>40\%$ tổng lượng ngũ hành, hành bị khắc (victim) sẽ bị hủy diệt hoặc làm suy kiệt nặng nề (giảm tới $90\%$ lực lượng, ví dụ: Thủy vượng Hỏa tắt).

### 5.5 Điểm Sàn Phân Cấp & Chuẩn Hóa
*   **Điểm sàn phân cấp:** Khi không tòng cách, điểm sàn tối thiểu phụ thuộc vào mức độ hiện diện: Can lộ ($5\%$), Bản khí ẩn ($4\%$), Trung khí ẩn ($2\%$), Dư khí ẩn ($1\%$) của điểm cơ sở ngũ hành.
*   **Tòng cách bypass:** Nếu có 1 hành vượt trội chiếm $>65\%$ tổng điểm thô $\rightarrow$ Vô hiệu hóa hoàn toàn điểm sàn để các hành bị xung khắc rơi tự do về $0\%$.
*   **Đánh giá Năng lượng Tòng Cách:**
    *   *Tòng Nhược (Tòng Tài/Sát/Nhi):* Đồng Đảng dưới 50% $\rightarrow$ Nhật Chủ ở trạng thái **CỰC NHƯỢC**.
    *   *Tòng Vượng/Tòng Cường (Nhuận Hạ, Viêm Thượng, v.v.):* Đồng Đảng từ 50% trở lên $\rightarrow$ Nhật Chủ ở trạng thái **CỰC VƯỢNG**.

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

### 5.10 Ma Trận Cờ Học Thuật (Academic Flag Matrix) & Phân Cấp Thân Vượng/Nhược (Bazi 5.3 Upgrade - Refined)
*   **Được Tư Lệnh (`ducTuLenh`):** Bỏ bảng Nguyệt Lệnh tĩnh, sử dụng **Nhân Khí Tư Lệnh (`tuLenhCan`)** theo số ngày sau Tiết Khí. Nếu Can nắm quyền (Tư Lệnh) cùng ngũ hành với Nhật Chủ hoặc tương sinh cho Nhật Chủ $\rightarrow$ Tính là Được Tư Lệnh.
*   **Đắc Địa (`dacDia`):** Can ngày có Căn rễ chính khí (bản khí) ở Địa chi của các trụ, đồng thời Địa chi đó không bị ảnh hưởng bởi Lục Xung, Tương Hình hoặc Lục Hại (nếu bị xung/hình/hại thì không tính gốc rễ đó).
*   **Được Trợ Giúp (`isDuocTroGiup`):** Chỉ xét Tỷ Kiếp (đồng hành với Nhật Chủ) ở các Thiên can khác. Gốc rễ ở Địa chi đã được tính ở cờ Đắc Địa để tránh tính trùng lặp "gốc và căn".
*   **Tổ Hợp Bị Xung/Hình/Hại Phá (`hasDisruptionIntoCombination`):** Tất cả các tổ hợp Tam Hợp, Bán Tam Hợp, Củng Hợp, Lục Hợp nếu bị tác động bởi Lục Xung, Tương Hình hoặc Lục Hại thì bị coi là **bị xung/hình/hại phá và KHÔNG HỢP ĐƯỢC**.
*   **Quy Đổi Điểm Số Nhật Chủ (`dmElem` Score):** Ngoại trừ 4 hành khác tính điểm thông căn thông thường, riêng điểm ngũ hành của Nhật Chủ được quy đổi trực tiếp từ các quy tắc học thuật vừa xác định (Đắc Địa, Được Tư Lệnh, Được Sinh, Được Trợ Giúp, Tam Hợp/Tam Hội không bị phá).
*   **Ma Trận Phân Cấp Thân (`thanDegree`):**
    *   *Có Được Tư Lệnh:*
        *   $\ge 3/3$ điều $\rightarrow$ **Cực Vượng (`cuc_vuong`)**
        *   $2/3$ điều $\rightarrow$ **Rất Vượng (`rat_vuong`)**
        *   $1/3$ điều $\rightarrow$ **Vượng (`vuong`)**
        *   $0/3$ điều $\rightarrow$ **Cân Bằng (`can_bang`)** hoặc **Nhược (`nhuoc`)** tùy thuộc vào điểm lượng tính ngũ hành (`dongDang` vs `khacTiet`).
    *   *Không Được Tư Lệnh:*
        *   $3/3$ điều $\rightarrow$ **Rất Vượng (`rat_vuong`)**
        *   $2/3$ điều $\rightarrow$ **Vượng (`vuong`)**
        *   $1/3$ điều + Tam Hợp/Tam Hội hỗ trợ (Ấn/Tỷ) $\rightarrow$ **Vượng (`vuong`)**
        *   $1/3$ điều (không có hợp hội hỗ trợ) $\rightarrow$ **Cân Bằng (`can_bang`)** hoặc **Nhược (`nhuoc`)** tùy thuộc điểm ngũ hành.
        *   $0/3$ điều (Thất lệnh, thất địa, thất thế):
            *   Điểm đồng đảng cực thấp ($< 10\%$ tổng lượng) hoặc Khắc/Tiết/Hao gấp 3 lần đồng đảng $\rightarrow$ **Suy Kiệt (`suy_kiet`)**
            *   Trường hợp còn lại $\rightarrow$ **Rất Nhược (`rat_nhuoc`)**
        *   *(Nếu bị Khắc/Tiết/Hao $> 70\%$ đồng thời hành tòng chiếm $\ge 45\%$ tổng lượng ngũ hành $\rightarrow$ **Tòng Cách (`tong_cach`)**)*

### 5.11 Quy Tắc Hợp Hóa Thiên Can & Địa Chi Lục Hợp (Bazi 6.0 Upgrade)
*   **Thiên Can Ngũ Hợp:**
    *   *Hợp mà Hóa (Hóa khí):* Xảy ra khi kề sát, không bị tranh hợp, không bị can kề sát khắc phá, đắc lệnh Nguyệt lệnh dẫn hóa và đắc địa địa chi. Lực lượng hai can sử dụng **Vùng đệm chuyển tiếp mềm $[15.0 \rightarrow 20.0]$ điểm** (điểm $\ge 20.0$ chuyển dịch 100%; điểm $[15.0-20.0]$ chuyển dịch theo tỷ lệ tuyến tính mềm).
    *   *Nhật Chủ Tĩnh Không Hóa:* Nếu một trong hai can hợp là Nhật Chủ (Can ngày), cuộc hợp hóa **không bao giờ hóa thành công** mà chỉ tính là Hợp Bạn (trói buộc/tê liệt).
    *   *Động Hợp Hóa Giáp-Kỷ:* Cặp Giáp-Kỷ tự động đánh giá lực lượng giữa Thổ và Mộc trong lá số để chọn hướng hóa Thổ (tháng sinh Thổ/Hỏa) hoặc Mộc (tháng sinh Mộc/Thủy).
    *   *Hợp mà không Hóa (Trói buộc/Tê liệt):* Do thiếu điều kiện hóa. Điểm số gốc của cả 2 can **giảm 50%** do trói buộc, tê liệt lẫn nhau.
*   **Địa Chi Lục Hợp:**
    *   *Các cặp Lục hợp:* Tý-Sửu (Thổ/Thủy), Dần-Hợi (Mộc), Mão-Tuất (Hỏa), Thìn-Dậu (Kim), Tỵ-Thân (Thủy), Ngọ-Mùi (Thổ/Hỏa).
    *   *Điều kiện Hóa khí thành công:*
        1.  **Vị trí liền kề:** 2 địa chi phải kề nhau.
        2.  **Thiên can dẫn hóa (Bắt buộc):** Trên Thiên can bắt buộc phải lộ ra hành của hóa thần mới. Nếu không lộ can dẫn hóa thì **không hóa luôn** (rơi vào trạng thái Hợp bạn).
        3.  **Nguyệt lệnh dẫn hóa:** Chi tháng phải mang cùng ngũ hành với hóa thần hoặc tương sinh cho hóa thần.
        4.  **Xung ngoài cản trở (Cho nhóm Hợp Khắc Tý-Sửu, Mão-Tuất, Tỵ-Thân):** Không được có chi khác trong lá số xung trực tiếp với 2 chi đang hợp.
    *   *Quy đổi điểm số:*
        *   *Hợp mà Hóa thành công:* Biến đổi 100% điểm gốc của 2 chi sang ngũ hành mới (100% tàng can đại diện của ngũ hành đó). Ngũ hành cũ của 2 chi bị loại bỏ hoàn toàn.
        *   *Hợp bạn (Trói buộc):* Điểm số gốc của 2 chi **giảm 50%** do kiềm chế lẫn nhau.

### 5.14 Quy Tắc Tứ Tự Hình, Ám Hợp & Trợ Giúp Thiên Can Kề Sát (Bazi 7.0 Upgrade)
*   **Tứ Tự Hình (Thìn-Thìn, Ngọ-Ngọ, Dậu-Dậu, Hợi-Hợi):**
    *   *Tự hình thành công:* Đủ 2 chi kề nhau (hoặc 3 chi trở lên), Nguyệt lệnh tương sinh/đồng hành, lộ can dẫn hóa Hóa thần, không bị xung/hại phá. Tàng can phụ biến mất 100% (chuyển sang 100% Chính khí hóa thần) và cộng $+25\%$ lực lượng.
    *   *Tự hình không thành công:* Tàng can giữ nguyên, không cộng điểm lực lượng.
*   **Ám Hợp Địa Chi:**
    *   *Chi Chi Ám Hợp:* Mão-Thân (Ất-Canh), Dần-Sửu (Giáp-Kỷ, Bính-Tân, Mậu-Quý), Ngọ-Hợi (Đinh-Nhâm, Giáp-Kỷ), Tý-Tỵ (Mậu-Quý), Tỵ-Dậu (Bính-Tân).
    *   *Can Chi Ám Hợp:* Mậu Tý, Tân Tỵ, Nhâm Ngọ, Giáp Ngọ, Quý Tỵ.
*   **Phạm Vi Trợ Giúp Của Thiên Can (`isDuocTroGiup`):**
    *   Chỉ tính 2 Thiên Can kề sát Nhật Chủ (Can Tháng và Can Giờ). Can Năm ở xa bị Can Tháng ngăn cách nên không được tính trợ giúp trực tiếp cho Nhật Chủ.

### 5.15 Hệ Thống Thần Sát Bát Tự (41 Thần Sát)
Hệ thống tự động tính toán và hiển thị 32 Thần Sát đặc thù trên lá số và đại vận/lưu niên:
1.  **Thiên Ất Quý Nhân:** Tra theo Can Ngày & Can Năm đối chiếu Địa Chi.
2.  **Thái Cực Quý Nhân:** Tra theo Can Ngày đối chiếu Địa Chi.
3.  **Thiên Đức Quý Nhân:** Tra theo Chi Tháng đối chiếu Can/Chi các trụ.
4.  **Nguyệt Đức Quý Nhân:** Tra theo Chi Tháng đối chiếu Thiên Can các trụ.
5.  **Lộc Thần (Tuế Lộc / Kiến Lộc / Chuyên Lộc / Quy Lộc):** Vị trí đắc lộc của Can Ngày. Được phân tách dựa theo trụ xuất hiện: trụ Năm là **Tuế Lộc**, trụ Tháng là **Kiến Lộc**, trụ Ngày là **Chuyên Lộc**, trụ Giờ là **Quy Lộc** (các trường hợp khác như đại vận/lưu niên hiển thị tên chung là **Lộc Thần**).
6.  **Kình Dương (Dương Nhận):** Vị trí đế vượng của Can Ngày.
7.  **Dịch Mã:** Sự di chuyển, thay đổi, dựa theo Tam Hợp cục của Chi Năm & Chi Ngày.
8.  **Hoa Cái:** Mộ khố của Tam Hợp cục của Chi Năm & Chi Ngày.
9.  **Đào Hoa:** Vị trí mộc dục của Tam Hợp cục của Chi Năm & Chi Ngày.
10. **Tướng Tinh:** Vị trí chính khí của Tam Hợp cục của Chi Năm & Chi Ngày.
11. **Kiếp Sát:** Vị trí tuyệt của Tam Hợp cục của Chi Năm & Chi Ngày.
12. **Vong Thần:** Vị trí lâm quan của Tam Hợp cục của Chi Năm & Chi Ngày.
13. **Văn Xương Quý Nhân:** Tra theo Can Ngày đối chiếu Địa Chi.
14. **Cô Thần & Quả Tú:** Tra theo Chi Năm đối chiếu Địa Chi cô độc của Tam Hội cục.
15. **Không Vong (Tuần Không):** Địa chi trống rỗng dựa trên Tuần Không của trụ ngày.
16. **Phúc Tinh Quý Nhân:** Tra theo Can Ngày đối chiếu Địa Chi.
17. **Quốc Ấn Quý Nhân:** Tra theo Can Ngày đối chiếu Địa Chi.
18. **Thiên Y:** Chi Tháng lùi 1 cung địa chi.
19. **Hồng Loan & Thiên Hỷ:** Tra theo Chi Năm đối chiếu Địa Chi đào hoa hỷ khánh.
20. **Kim Dư Quý Nhân (Xe Vàng):** Tra theo Can Ngày & Can Năm đối chiếu Địa Chi.
21. **Thiên La:** Cát hung tinh xuất hiện khi Chi Ngày hoặc Chi Năm là **Thìn** gặp địa chi **Tỵ**, hoặc Chi Ngày hoặc Chi Năm là **Tỵ** gặp địa chi **Thìn**.
22. **Địa Võng:** Cát hung tinh xuất hiện khi Chi Ngày hoặc Chi Năm là **Tuất** gặp địa chi **Hợi**, hoặc Chi Ngày hoặc Chi Năm là **Hợi** gặp địa chi **Tuất**.
23. **Khôi Canh Sát:** Trụ gặp một trong các ngày **Canh Thìn, Nhâm Thìn, Mậu Tuất, Canh Tuất**.
24. **Âm Dương Sai Thác:** Chỉ tính riêng tại **Trụ Ngày (Nhật Trụ)** của đương số nếu trụ ngày gặp một trong 12 ngày cưới trắc trở tương ứng.
25. **Cô Loan Sát:** Trụ gặp một trong 8 ngày đơn độc hôn nhân tương ứng.
26. **Thập Ác Đại Bại:** Trụ gặp một trong 10 ngày mưu sự thất bại không có lộc hộ trì.
27. **Lưu Hà Sát:** Tra Can Ngày đối chiếu Địa Chi để xác định rủi ro tai nạn hao tài.
28. **Huyết Nhận Sát:** Tra cứu theo Địa Chi của năm sinh (Niên Chi) đối chiếu Địa Chi của các trụ theo bảng quy chiếu để xác định rủi ro tai nạn, thương tích, đổ máu, phẫu thuật.
29. **Quan Phù:** Gặp địa chi cách Chi Năm 4 cung (tiến lên) chủ về tranh chấp kiện tụng.
30. **Tam Kỳ Quý Nhân:** Tổ hợp của 3 Thiên Can liên tiếp xuất hiện trên các trụ kề nhau (Năm-Tháng-Ngày hoặc Tháng-Ngày-Giờ) theo đúng thứ tự Xuôi hoặc Ngược (tổng cộng có 4 trường hợp được tính cho mỗi tổ hợp):
     *   **Thiên Thượng Tam Kỳ:** `Giáp - Mậu - Canh` hoặc `Canh - Mậu - Giáp`.
     *   **Địa Thượng Tam Kỳ:** `Nhâm - Quý - Tân` hoặc `Tân - Quý - Nhâm`.
     *   **Nhân Gian Tam Kỳ:** `Ất - Bính - Đinh` hoặc `Đinh - Bính - Ảt`.
31. **Kim Thần:** Cát tinh tra theo Can Chi trụ Ngày và trụ Giờ:
     *   **Trụ Ngày:** Trụ Ngày gặp `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` mặc định là Kim Thần.
     *   **Trụ Giờ:** Trụ Giờ gặp `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` chỉ được tính là Kim Thần khi Nhật Chủ (Can Ngày) là **Giáp** hoặc **Kỷ**.
32. **Hồng Diễm Sát:** Tinh tú chủ về duyên dáng, đào hoa. Tra cứu theo cả Can Ngày (Nhật Can) và Can Năm (Niên Can) đối chiếu Địa Chi các trụ: Giáp gặp Ngọ, Ất gặp Thân, Bính gặp Dần, Đinh gặp Mùi, Mậu/Kỷ gặp Thìn, Canh gặp Thân, Tân gặp Dậu, Nhâm gặp Tý, Quý gặp Tuất.
33. **Cách Giác (Cách Góc):** Cát hung tinh tra cứu theo Địa Chi của ngày sinh (Nhật Chi). Nếu Địa Chi của trụ đang xét tiến lên đúng 2 cung Địa Chi so với Nhật Chi thì trụ đó ghi nhận Cách Giác.

---

## 📚 6. Quy tắc Nghiệp vụ Quản lý Blog, Deep-Linking & Định dạng Markdown

### 6.1 Deep-Linking & Chia sẻ Bài viết
- **URL Đồng Bộ:** Khi xem bài viết chi tiết, địa chỉ trình duyệt tự động cập nhật tham số `?post={slug}` mà không cần reload trang.
- **Deep Linking Auto-Load:** Khi mở trực tiếp đường dẫn chứa tham số `?post={slug}`, hệ thống tự động nhận diện `slug`, nạp bài viết và hiển thị ngay màn hình chi tiết.
- **Tạo Link Chia sẻ:** Nút sao chép và nút chia sẻ (Facebook, Web Share Sheet) sử dụng hàm `getArticleShareUrl()` ghép chuẩn đường dẫn tuyệt đối `https://tuynover.ddns.net/?post={slug}` đảm bảo người nhận mở đúng bài viết.

### 6.2 Chuẩn Hóa & Biên Dịch Markdown GFM
- **Biên dịch GFM:** Sử dụng `react-markdown` kết hợp plugin `remark-gfm` hỗ trợ đầy đủ cú pháp bảng, gạch ngang, danh sách và trích dẫn.
- **Tự động ngắt dòng bảng đứng (Vertical Pipe Normalizer):**
  - Tự động chuyển đổi chuỗi dính liền `| |` thành `|\n|`.
  - Tự động nhận diện và gộp các bảng ngắt dòng đứng (`|\n Ngũ Hành \n|\n Thiên Can \n|`) và thẻ in đậm bị rách dòng (`**\nDương Kim\n**`) về dạng bảng GFM nằm ngang hoàn hảo.
- **Chèn Ảnh Minh Họa (Custom Image Renderer):**
  - Cú pháp `![Mô tả ảnh](URL)`.
  - Tự động hiển thị khung ảnh bo tròn `rounded-2xl`, giới hạn chiều cao `max-h-[480px]`, căn giữa kèm chú thích ảnh nghiêng `figcaption` bên dưới.

---

## 🛡️ 7. Quy tắc Kiểm Soát Dữ Liệu Đầu Vào & Tự Động Chuẩn Hóa (Input Validation & Auto-Correction)

### 7.1 Mô Hình Bảo Vệ 2 Bước (2-Step Protection Layer)
Hệ thống triển khai cơ chế kiểm soát dữ liệu đầu vào nghiêm ngặt đồng bộ trên cả 4 phân hệ: **Bát Tự, Tử Vi, Kinh Dịch (Mai Hoa Dịch Số), và Hôn Nhân**.

#### 1. Bước 1: Frontend Real-Time Validation & Auto-Correction
- **Tự động ép về số ngày tối đa (Day Auto-Clamp):**
  - Nếu người dùng chọn **Ngày 29/02** và chuyển sang **Năm không nhuận** (vd: năm 2023), hệ thống tự động đẩy ngày về `28`.
  - Nếu chọn **Ngày 31** và chuyển sang **Tháng có 30 ngày** (Tháng 4, 6, 9, 11), hệ thống tự động đẩy ngày về `30`.
- **Tự động ép ngưỡng khi gõ tay (Smart Range Clamping):**
  - Gõ ngày $>31$ (vd gõ 100) $\rightarrow$ Tự động đẩy về `31`.
  - Gõ tháng $>12$ $\rightarrow$ Tự động đẩy về `12`.
  - Gõ năm $>2100$ $\rightarrow$ Tự động đẩy về `2100`.
  - Gõ giờ $>23$ hoặc phút $>59$ $\rightarrow$ Tự động đẩy về `23` và `59`.
- **Triệt tiêu chữ cái & Ký tự đặc biệt (Strict Digit Stripping):**
  - Lọc sạch toàn bộ ký tự chữ cái (A-Z) và ký tự đặc biệt ngay khi gõ vào ô chọn `CustomSelect` hoặc ô `Seri Tiền 8 số` (`val.replace(/\D/g, '')`), đảm bảo chữ không thể lọt qua.
- **Floating Toast Notification Pinned at Viewport Top:**
  - Thông báo lỗi hiển thị bằng component [`FloatingErrorToast.jsx`](file:///t:/Phongthuy/frontend/src/components/FloatingErrorToast.jsx) cố định ở đỉnh màn hình (`fixed top-4 left-1/2 -translate-x-1/2 z-[9999]`), nền trắng, chữ đen, icon dấu chấm cảm màu đỏ nổi bật (`AlertCircle text-red-600`), tự động biến mất sau 3 giây.
- **Khóa Nút Submit (Disabled Button State):**
  - Nút bấm tạo lá số/quẻ bị vô hiệu hóa (`disabled`) kèm hiệu ứng mờ `disabled:opacity-50 disabled:cursor-not-allowed` khi chưa điền đủ dữ liệu hoặc dữ liệu đang bị lỗi.

#### 2. Bước 2: Backend Strict Validation Service (`InputValidator.js`)
- Áp dụng tại dòng code đầu tiên của cả 4 Controller: [`BaziController.js`](file:///t:/Phongthuy/backend/src/controllers/BaziController.js#L73), [`ZiweiController.js`](file:///t:/Phongthuy/backend/src/controllers/ZiweiController.js#L11), [`MarriageController.js`](file:///t:/Phongthuy/backend/src/controllers/MarriageController.js#L73), và [`IChingController.js`](file:///t:/Phongthuy/backend/src/controllers/IChingController.js#L7).
- Thực thi các hàm `validateBaziInput`, `validateZiweiInput`, `validateMarriageInput`, và `validateIChingInput`.
- Phản hồi ngay lập tức HTTP status `400 Bad Request` trong $<0.005$ms nếu dữ liệu không hợp lệ, bảo vệ máy chủ khỏi các request rác hoặc tấn công quá tải.

### 7.2 Quy Tắc Thiết Kế Form Nhập Liệu Chuẩn Hóa
- **Tử Vi Form (`ZiweiInput.jsx`):**
  - Tách riêng thành component độc lập tương tự `BaziInput.jsx`.
  - Không điền sẵn giá trị mặc định cho Ngày, Tháng, Năm, Giờ, Phút (khởi tạo rỗng `''`), yêu cầu người dùng chủ động chọn hoặc gõ.
  - Áp dụng Combobox vừa gõ vừa chọn (`editable={true}`) kèm hỗ trợ bộ chọn ngày `CustomDatePicker`.
- **Kinh Dịch Form (`IChingInput.jsx`):**
  - Tập trung 3 phương thức lập quẻ (Gieo quẻ ảo 3 đồng xu, Mai Hoa Giờ Động Tâm / Seri Tiền, Nhập thủ công) vào duy nhất tệp `IChingInput.jsx` mà vẫn bảo toàn 100% giao diện và trải nghiệm gốc.

### 7.3 Quy Tắc Tải Chi Tiết Lá Số Từ Thư Mục / Lịch Sử
- **Cơ chế tải xem trước (Lightweight Preview):** Danh sách lịch sử và danh sách lá số trong thư mục chỉ tải thông tin tóm tắt (`inputInfo`, `tags`, `isPublic`, `createdAt`) để cuộn nhanh.
- **Tự động tải chi tiết (Lazy Full Fetching):** Khi bấm "Xem chi tiết", hệ thống tự động kiểm tra sự tồn tại của dữ liệu chi tiết (`canChi`, `baziData`, `maleBaziData`, `femaleBaziData`). Nếu thiếu (do dữ liệu trả về từ xem trước), hệ thống bắt buộc kích hoạt gọi API `getBaziRecord(id)` hoặc `getMarriageRecord(id)` để nạp 100% dữ liệu trước khi chuyển tab, triệt tiêu hoàn toàn hiện tượng vỡ giao diện hay trống trơn thông tin.







