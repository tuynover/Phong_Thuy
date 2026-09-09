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

### 4.2 Cấp phát Credits & Xóa tài khoản soft-delete
- **Quản trị Credit:** Đã loại bỏ hoàn toàn cơ chế tự động tặng credit miễn phí hàng ngày (`DAILY_CREDIT_INCREMENT`) để đảm bảo giá trị của Credits và duy trì kiểm soát tài nguyên chặt chẽ.
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

### 4.6 Quy tắc Luận giải Cơ bản (1 Credit) & Chuyên sâu VIP (5 Credits / 4 Credits Upgrade)
- **Luận giải Cơ bản (`mode: standard`):** Tiêu thụ **1 Credit**. Phân tích tổng quan ngắn gọn (800 - 1.200 từ), phản hồi nhanh.
- **Luận giải Chuyên sâu VIP (`mode: vip`):** Tiêu thụ **5 Credits**. Chạy qua Multi-Agent VIP Pipeline 3 Tầng với 6 Replicas song song, xuất ra 5.000+ từ trải dài qua 6 Chương chuyên sâu (Sự Nghiệp, Tài Chính, Hôn Nhân, Sức Khỏe, Cải Vận, Mốc Đại Vận 100 Năm).
- **Nâng Cấp từ Cơ Bản lên VIP:** Người dùng chỉ cần thanh toán chênh lệch **4 Credits** (`5 - 1 = 4 credits`). Hệ thống áp dụng 0ms Instant Reset trên giao diện người dùng, làm mới bài viết cũ và phát dòng bản VIP.
- **Bảo toàn Bản quyền VIP:** Một khi lá số đã có luận giải VIP hoàn chỉnh, hệ thống ẩn vĩnh viễn banner và nút nâng cấp, đồng thời chặn việc gọi trừ credit thừa.

### 4.7 Quy tắc Tạo Lá số Độc lập & Khóa Tranh chấp Tức thời (Concurrency Lock 2.5s)
- **Bỏ kiểm tra trùng lặp cũ:** Mọi thao tác lập lá số Bát Tự, Tử Vi, Hợp Hôn hoặc gieo quẻ Kinh Dịch hợp lệ đều được tạo thành bản ghi mới độc lập nhằm phục vụ chiêm nghiệm đa thời điểm của người dùng.
- **Chống spam đồng thời (In-Flight Concurrency Lock):** Để ngăn chặn trường hợp gửi đồng loạt 10 requests cùng lúc với cùng một bộ dữ liệu, hệ thống tích hợp Mutex Lock ngắn hạn trên Redis/RAM (`inflight:<type>:<hash>`) với thời gian khóa là **2.5 giây**. Request gửi sau trong cùng thời điểm sẽ nhận cảnh báo `429 Too Many Requests` an toàn.

### 4.8 Quy tắc Trình Diễn Luận Giải Chuyên Sâu & Bảng GFM (UI Presentation Standard)
- **Phân tách Khung Card Độc Lập:** Phân tích Nhật Chủ và mỗi Chương trong 6 Chương chuyên sâu bắt buộc phải được tách biệt thành từng Card riêng biệt có Icon đại diện, thanh tiêu đề gập/mở (Accordion) và viền bóng đổ thẩm mỹ.
- **Thứ Bậc Tiêu Đề Đề Mục & Chặn In Đậm Linh Tinh:**
  - Tiêu đề đề mục con trong chương sử dụng định dạng H3 (`###`), hiển thị **chữ in đậm** (`font-bold text-slate-900`) và **lớn hơn văn bản thường đúng 1 cấp** (`text-base md:text-lg` so với `text-sm md:text-base`).
  - Toàn bộ đoạn văn phân tích viết bằng chữ thường chuẩn mực, cấm in đậm rải rác các từ ngữ trong câu nhằm giữ độ thanh thoát, trang nhã của trang viết.
- **Chuẩn Hóa Bảng Markdown GFM:** Bảng Markdown (`| Col | ... |`) phải đi qua bộ tiền xử lý `cleanAndNormalizeMarkdown` tự động khắc phục hiện tượng dính hàng `| |`, xóa các dòng trống nội bộ làm vỡ bảng và bọc trong container bảng có bo góc, nền header và cuộn ngang linh hoạt.
- **Giao Diện Nền Trắng Sang Trọng (Luxury Light Theme):** Modal Chọn Gói Luận Giải, Modal Nâng Cấp và Bảng Theo Dõi Tiến Độ VIP (`VipProgressTracker`) bắt buộc sử dụng nền trắng (`bg-white`), viền amber/slate tinh tế, và tuyệt đối không hiển thị các thông tin kỹ thuật hạ tầng hệ thống mà chỉ trình bày giá trị học thuật cổ học.

### 4.9 Phân Lập Triệt Để Prompt Luận Giải AI & Ngăn Chặn Rò Rỉ Thuật Ngữ Đa Phân Hệ
- **Quy tắc Phân lập Luồng AI:** Multi-Agent VIP Pipeline (`MultiAgentPipelineService.runVipPipelineStream`) là kiến trúc độc quyền dành riêng cho Mệnh Số Bát Tự (Tử Bình).
- **Tuyệt đối không dùng chung Pipeline:** Nghiêm cấm định tuyến các phân hệ Kinh Dịch, Tử Vi Đẩu Số và Hợp Hôn qua pipeline Bát Tự. Mỗi phân hệ bắt buộc sử dụng bộ Prompt chuyên môn cổ điển độc lập (`IChingPrompts`, `ZiweiPrompts`, `MarriagePrompts`) chạy qua `AiService.generateInterpretationStream`.
- **Bảo toàn Bản sắc Học thuật Cổ học:**
  - *Kinh Dịch:* Bám sát Chu Dịch, Thoán Từ, Hào Từ, Dụng Thần Lục Hào, Lục Thân, Lục Thú, Sinh Khắc Hóa Thoái/Tiến, Tuyệt đối không chứa thuật ngữ Nhật Chủ, Can Tháng hay Thập Thần Bát Tự.
  - *Tử Vi:* Bám sát 12 Cung Vị, Chính Tinh, Phụ Tinh, Tứ Hóa, Đắc Hãm, Tam Hợp Chiếu, Vòng Trường Sinh, Tuyệt đối không an sao sai lệch hay dùng thuật ngữ ngoại lai.
  - *Hợp Hôn:* Bám sát Bản Mệnh Ngũ Hành, Cung Phi Bát Trạch, Can Chi Tương Phối.

### 4.10 Chuẩn Mực Bố Cục & Phông Chữ Tài Liệu PDF Học Thuật
- **Chuẩn Phông Chữ Tiếng Việt Hoàng Gia:** Toàn bộ văn bản tiêu đề in hoa phong cách cổ điển phải sử dụng phông chữ serif **`Noto Serif`** (`font-family: 'Noto Serif', Georgia, 'Times New Roman', serif;`), đảm bảo 100% hiển thị hoàn hảo các ký tự tiếng Việt đặc thù (đặc biệt là ký tự `Đ` in hoa không bị tách thanh ngang hay vỡ nét glyph).
- **Chuẩn Đồ Hình 3 Quẻ, Bảng Lục Hào Nạp Giáp & Trạng Thái Vượng Suy Các Hào (Hình 1 & Hình 2):**
  - Giữ nguyên 3 quẻ Chủ - Hỗ - Biến ở phần trên với nền trắng trang nhã, phân màu xanh dương (`#1e40af`) cho hào tĩnh và đỏ chu sa (`#dc2626`) cho hào động.
  - Bảng Lục Hào Nạp Giáp đối chiếu song song chuẩn 1:1 theo web: Quẻ Chủ (trái) và Quẻ Biến (phải) ngăn cách bởi đường nét đứt (`border-right: 1.5px dashed #cbd5e1`).
  - Khối Trạng Thái Vượng Suy Các Hào (Hình 2): Đặt ngay dưới Bảng Lục Hào, gồm tiêu đề in hoa gạch chân đỏ mận, 2 bảng song song cho Quẻ Chính và Quẻ Biến, huy hiệu `Quái Thân` góc phải, 4 cột `HÀO / CAN CHI`, `VƯỢNG SUY`, `TS NGÀY`, `TS THÁNG`.
  - Tối ưu độ cao và ngắt trang để toàn bộ: Header + Đồ hình 3 quẻ + Bảng Lục Hào nạp giáp + Trạng thái vượng suy nằm trọn vẹn và vừa khít 100% trong Trang 1 khổ A4.
- **Chuẩn Mệnh Bàn Tử Vi 4x4:**
  - 12 Cung Vị phân bố xung quanh 4 cạnh theo đúng vị trí 12 Địa Chi.
  - Trung Cung Thiên Bàn mang tiêu đề chính thức `THIÊN BÀN TỬ VI ĐẨU SỐ`, tuyệt đối không chứa các chuỗi văn bản thử nghiệm.
- **In Toàn Văn Luận Giải (Standard & VIP):**
  - Hệ thống hỗ trợ xuất và in toàn văn bài luận giải tổng thể thông qua scope `intro` hoặc `all_interpretation` ở cả Tử Vi, Kinh Dịch, Hôn Nhân và Bát Tự.
  - Bố cục các phân đoạn luận giải được hiển thị trang nhã qua `.chapter-block` với khoảng cách tự nhiên (~20px), tránh ngắt trang cưỡng bức gây lãng phí giấy.

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

### 5.15 Hệ Thống Thần Sát Bát Tự (35 Thần Sát)
Hệ thống tự động tính toán và hiển thị 35 Thần Sát đặc thù trên lá số và đại vận/lưu niên:
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
29. **Tam Kỳ Quý Nhân:** Tổ hợp của 3 Thiên Can liên tiếp xuất hiện trên các trụ kề nhau (Năm-Tháng-Ngày hoặc Tháng-Ngày-Giờ) theo đúng thứ tự Xuôi hoặc Ngược (tổng cộng có 4 trường hợp được tính cho mỗi tổ hợp):
     *   **Thiên Thượng Tam Kỳ:** `Giáp - Mậu - Canh` hoặc `Canh - Mậu - Giáp`.
     *   **Địa Thượng Tam Kỳ:** `Nhâm - Quý - Tân` hoặc `Tân - Quý - Nhâm`.
     *   **Nhân Gian Tam Kỳ:** `Ất - Bính - Đinh` hoặc `Đinh - Bính - Ất`.
30. **Kim Thần:** Cát tinh tra theo Can Chi trụ Ngày và trụ Giờ:
     *   **Trụ Ngày:** Trụ Ngày gặp `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` mặc định là Kim Thần.
     *   **Trụ Giờ:** Trụ Giờ gặp `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` chỉ được tính là Kim Thần khi Nhật Chủ (Can Ngày) là **Giáp** hoặc **Kỷ**.
31. **Hồng Diễm Sát:** Tinh tú chủ về duyên dáng, đào hoa. Tra cứu theo cả Can Ngày (Nhật Can) và Can Năm (Niên Can) đối chiếu Địa Chi các trụ: Giáp gặp Ngọ, Ất gặp Thân, Bính gặp Dần, Đinh gặp Mùi, Mậu/Kỷ gặp Thìn, Canh gặp Thân, Tân gặp Dậu, Nhâm gặp Tý, Quý gặp Tuất.
32. **Cách Giác (Cách Góc):** Cát hung tinh tra cứu theo Địa Chi của ngày sinh (Nhật Chi). Nếu Địa Chi của trụ đang xét tiến lên đúng 2 cung Địa Chi so với Nhật Chi thì trụ đó ghi nhận Cách Giác.
33. **Đại Hao (Nguyên Thần):** Thần sát tĩnh tra cứu kết hợp Địa Chi năm sinh, Can năm sinh (Âm/Dương) và Giới tính của đương số (Dương Nam/Âm Nữ tiến 7 cung, Âm Nam/Dương Nữ tiến 5 cung).
34. **Tuế Phá:** Thần sát động vận hạn chỉ hiển thị tại bảng Niên Vận Tinh động bên trái khi Địa Chi của năm Lưu Niên đối xung trực tiếp với Địa Chi năm sinh bản mệnh.

### 5.16 Quy Chuẩn Luận Giải Bát Tự vNext (Hiện Đại Hóa & Y Học Biện Chứng)
- **Ánh xạ Ngành nghề Hiện đại & Đỉnh cao Sự nghiệp:** Quy đổi Thập Thần sang nền kinh tế tri thức (Thực Thương = AI, Công nghệ số, Startup; Quan Sát = CEO, Quản trị cấp cao, Pháp lý; Tài Tinh = Fintech, Đầu tư quỹ). Luôn chỉ ra độ tuổi/giai đoạn phát triển rực rỡ nhất trong sự nghiệp.
- **Bộ Ba Bản Thể & Sứ Mệnh Cuộc Đời (Bước 1):** Đúc kết Điểm mạnh trời sinh, Điểm mù bản năng cần khắc phục, cùng Sứ mệnh cuộc đời & Bài học tâm tính lớn nhất dựa trên Dụng Thần và Khuyết Hành.
- **Chu Kỳ Tài Vận Thịnh - Suy (Bước 3):** Phân định rõ các pha Gieo hạt tích lũy, Pha bùng nổ thu hoạch và Pha phòng thủ tài chính tránh thất thoát.
- **Chân Dung Bạn Đời & Gia Đạo Hậu Vận (Bước 3):** Khắc họa tính cách bạn đời phù hợp, nhóm tuổi/ngũ hành tương sinh và phúc đức con cái hậu vận dựa trên tương quan Cung Tử Tức (Trụ Giờ).
- **Y học Bát Tự & Mốc Tuổi Tật Ách (Bước 3):** Dự báo bệnh lý tạng phủ Đông y (Hỏa vượng ung bướu/đột quỵ, Kim hàn Thủy lãnh thận suy/trầm cảm) và chỉ rõ các mốc tuổi có hạn sức khỏe đáng lưu tâm.
- **3 Bước Ngoặt Lớn Nhất Cuộc Đời (Bước 5):** Bắt buộc chỉ ra 3 mốc tuổi/giai đoạn then chốt làm thay đổi hoàn toàn sự nghiệp, tài vận và vận mệnh đương số.
- **Nhận diện Ngoại Cách (Special Patterns):** Tự động nhận diện Tòng Nhi, Tòng Tài, Tòng Sát, Chuyên Vượng, Sát Ấn Tương Sinh, Thương Quan Hợp/Chế Sát nhằm tránh đảo ngược Dụng Thần trong các thế cực đoan.

### 5.17 Quy Chuẩn Luận Giải Tử Vi Đẩu Số v4 (15 Phân Đoạn Luận Giải Chuyên Sâu & Cải Vận Thực Tế)
Bộ Prompt Tử Vi (`ZiweiPrompts.js`) được nâng cấp lên phiên bản `v4_15_sections_deep_analysis` phân bổ thành **15 phân đoạn Markdown** có cấu trúc rõ ràng:
1. **Mệnh & Khí Chất Cốt Lõi (Mục 1):** Luận giải ngoại hình, chỉ số IQ, học vấn, tư chất và ma trận **3 Điểm mạnh vượt trội**, **3 Điểm yếu tâm lý** và **Tiềm năng cốt lõi chưa khai phá**.
2. **Hôn Nhân & Tình Duyên (Mục 2):** Tính cách người phối ngẫu, chỉ rõ **Mẫu người phù hợp nhất**, **Tuổi hợp / Ngũ hành tương sinh** và **Các biến cố tình cảm lớn**.
3. **Tài Lộc & Quản Lý Tiền Bạc (Mục 3):** Đánh giá rủi ro hao tài, khả năng giữ tiền, các chu kỳ tài vận thịnh - suy.
4. **Phụ Mẫu & Gia Thế (Mục 4):** Học vấn kinh tế cha mẹ, sự nâng đỡ từ gia đình.
5. **Thiên Di & Xuất Hành (Mục 5):** Khả năng ứng biến ngoại giao, cơ hội đi xa/xuất ngoại, thử thách.
6. **Sức Khỏe & Hạn Cần Chú Ý (Mục 6):** Nguy cơ bệnh tật theo ngũ hành sao tọa thủ và các mốc độ tuổi có hạn ách.
7. **Nô Bộc & Mối Quan Hệ (Mục 7):** Quan hệ bạn bè, đồng nghiệp, hợp tác làm ăn, kiểu sếp tương hợp.
8. **Công Danh & Sự Nghiệp (Mục 8):** Ngành nghề hợp nhất, xu hướng làm chủ/làm thuê, thời điểm phát triển rực rỡ nhất.
9. **Điền Trạch & Bất Động Sản (Mục 9):** Khả năng sở hữu nhà đất, tư vấn đầu tư bất động sản, xu hướng định cư.
10. **Tử Tức & Hậu Duệ (Mục 10):** Số lượng, xu hướng gái/trai, sự hiếu thảo và mối quan hệ với con cái.
11. **Huynh Đệ & Mối Tương Quan (Mục 11):** Sự hòa thuận giữa anh chị em, hỗ trợ hoặc nhờ vả.
12. **Phúc Đức & Sứ Mệnh Cuộc Đời (Mục 12):** Phúc phần dòng họ, gia tiên và **Bài học nghiệp duyên (Karmic Lesson)** đương số phải vượt qua.
13. **Đại Vận & Vận Hạn Năm Hiện Tại (Mục 13):** Đánh giá đại vận hiện tại và dự báo chi tiết năm hiện tại (Công việc, Tài chính, Tình duyên, Sức khỏe).
14. **3 Bước Ngoặt Cuộc Đời & Tổng Luận (Mục 14):** Dự đoán **3 thời điểm chuyển biến vận mệnh lớn nhất** (Sự nghiệp, Tài chính, Tình cảm) và các giai đoạn hoàng kim/thách thức.
15. **Chiến Lược Cải Vận & Thu Hút May Mắn (Mục 15):** Đưa ra chiến lược 4 trụ cột thực tế: **Tâm** (nhận thức), **Hành** (hành động), **Cảnh** (phong thủy/phương vị/màu sắc), **Tín** (tích đức hành thiện).

### 5.18 Quy Chuẩn Luận Giải Hợp Hôn v2.0 (Marriage v2.0 Advanced)
Bộ Prompt Hợp Hôn (`MarriagePrompts.js`) được nâng cấp lên phiên bản `v2_0_marriage_advanced` với 5 trụ cột học thuật nghiêm ngặt:
1. **Quy Tắc Khóa Trần Điểm Số (Anti-Whitewashing):** Tuyệt đối cấm lạm dụng việc "Dụng Thần bù trừ" để phán các cuộc hôn nhân có Tam Hình (Sửu-Mùi-Tuất, Dần-Thân-Tỵ), Lục Xung Cung Phu Thê hoặc Thất Sát áp đỉnh là "hậu vận bình an". Điểm số tương thích bắt buộc bị **khóa trần dưới 5.5/10** (dao động 3.0 - 5.0/10 tùy mức độ phá hoại). Phải cảnh báo trực diện nguy cơ bạo lực lạnh, áp chế tinh thần, phản bội, tranh chấp pháp lý hoặc ly tán.
2. **Phân Bổ Quản Trị Tài Chính Theo Thập Thần (Xóa Bỏ Định Kiến Giới):** Chỉ định người giữ tiền phải căn cứ 100% vào cấu trúc Thập Thần (Chính Tài/Chính Ấn cẩn trọng giữ tiền; Kiếp Tài/Thương Quan phiêu lưu không được cầm tiền lớn), triệt tiêu văn mẫu "người vợ auto là tay hòm chìa khóa".
3. **Thống Nhất Trọng Số Bát Tự (Gốc 80%) & Bát Trạch (Ngọn 20%):** Bát Tự Tử Bình quyết định Nhân duyên và Cát Hung cốt lõi (80%). Cung Phi Bát Trạch chỉ phản ánh Môi trường sống (20%), phạm Tuyệt Mệnh/Lục Sát không phá vỡ được nhân duyên Bát Tự mà chỉ cần hóa giải bằng hướng phòng ngủ, hướng bếp.
4. **Định Danh 4 Mô Hình Hôn Nhân Hiện Đại (Marriage Archetypes):** *Song Mã Cùng Tiến (Power Couple)*, *Thử Thách & Tôi Luyện (Karmic Crucible)*, *Hậu Phương & Tiền Tuyến*, và *Tri Kỷ Tâm Giao*.
5. **Chiến Lược Hóa Giải Thực Chiến & Tâm Lý Học Hành Vi:** Đưa ra quy tắc ứng xử khi xung đột (hạ hỏa, quyền im lặng), quản trị tài chính minh bạch và phong thủy bổ trợ.

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

---

## 📄 8. Quy Tắc Nghiệp Vụ Xuất Bản Tệp PDF (Lá Số & Luận Giải)

### 8.1 Cấu Trúc Lựa Chọn Phân Đoạn Linh Hoạt (Granular Selection per Domain)
Người dùng có toàn quyền chọn tải độc lập hoặc kết hợp giữa **Lá số / Đồ hình** và **Luận giải AI**:
- **Bát Tự (Bazi):**
  - *Nhóm Lá Số:* Thông tin bản mệnh & Tứ Trụ, Điểm Ngũ Hành & Thập Thần, Đại Vận 100 Năm (Bố cục ma trận 2 hàng x 5 cột).
  - *Nhóm Luận Giải:* Chọn tải toàn bộ hoặc chọn lọc từng chương trong bản VIP (Tổng Quan SWOT, Chương 1: Sự Nghiệp, Chương 2: Tài Chính & Kho Tài, Chương 3: Hôn Nhân, Chương 4: Sức Khỏe, Chương 5: Cải Vận, Chương 6: Đại Vận 100 Năm, Điều Hòa Chiến Lược & Đúc Kết).
- **Tử Vi (Ziwei):**
  - *Nhóm Lá Số:* Thông tin Mệnh bàn & Cung Mệnh/Thân, Đồ hình 12 Cung Vị truyền thống (Chính tinh Miếu Hãm, Phụ tinh Cát/Sát, Tam Phương Tứ Chính, Vòng Trường Sinh, Đại Hạn).
  - *Nhóm Luận Giải:* Toàn bộ bài luận giải Tử Vi AI.
- **Kinh Dịch (IChing):**
  - *Nhóm Quẻ Dịch:* Quẻ Chính & Quẻ Biến, Bảng 6 Hào chi tiết (Thế/Ứng, Lục Thân, Lục Thú, Vượng Suy, Hào Động, Biến Quái).
  - *Nhóm Luận Giải:* Lời giải đoán quẻ Kinh Dịch từ AI.
- **Hợp Hôn (Marriage):**
  - *Nhóm Đồ Hình:* Thông tin bản mệnh Nam - Nữ, Bảng so sánh ngũ hành & Cung Phi Bát Trạch, Bảng điểm tương hợp 5 tiêu chí.
  - *Nhóm Luận Giải:* Chi tiết phân tích hôn nhân, ưu nhược điểm gia đạo và phương án hóa giải xung khắc từ AI.

### 8.2 Chốt An Toàn Vô Hiệu Hóa Nút Xuất Khi Chưa Chọn Mục (0-Item Guard)
- **Vô hiệu hóa nút bấm (`disabled`):** Khi người dùng bỏ chọn toàn bộ các ô (`selectedCount === 0`), nút bấm "Tải tệp PDF ngay" **bắt buộc phải bị vô hiệu hóa hoàn toàn** (`disabled`), chuyển sang màu xám mờ (`bg-stone-300 text-stone-500 cursor-not-allowed`) và chặn triệt để mọi sự kiện click chuột.
- **Banner cảnh báo trực quan (Floating Warning Banner):** Xuất hiện ngay phía trên nút bấm một banner cảnh báo viền vàng cam nổi bật: `⚠️ Vui lòng chọn ít nhất 1 mục nội dung phía trên để hệ thống tạo tệp PDF.`.

### 8.3 Kiểm Tra Tồn Tại Luận Giải (Interpretation Presence Guard)
- Khi bản ghi chưa được luận giải bởi AI (chưa có dữ liệu `interpretation` hoặc `aiInterpretation`), hệ thống:
  - Tự động khóa (disabled) toàn bộ checkbox của nhóm Luận giải.
  - Hiển thị thông báo hướng dẫn: *"Bản ghi này chưa có bài luận giải từ AI. Bạn chỉ có thể xuất phần Lá số / Đồ hình hoặc hãy quay lại yêu cầu Thầy luận giải trước khi xuất PDF."*.

### 8.4 Thiết Kế Bố Cục In Ấn Khoa Học (Scientific Print Layout & Typography)
- **Palette Màu Hoàng Gia Á Đông:** Kết hợp hài hòa giữa màu Đỏ Chu Sa trầm (`#8B1D1D`), Vàng Hoàng Gia (`#D4AF37`), Vàng Kim Cổ Điển (`#B8860B`) và Nền Giấy Cổ Á Đông (`#FDFBF7`) với phông chữ serif học thuật sang trọng, tạo cảm giác như một bản thư tịch phong thủy cổ truyền giá trị cao.
- **Ma Trận Đại Vận Bát Tự 2x5 (100 Năm):** Được dàn dựng dưới dạng lưới 2 hàng x 5 cột (10 thập kỷ) khoa học, hiển thị rõ ràng Can Chi đại vận, độ tuổi, Thập Thần chủ quản và huy hiệu Cát / Bình / Hung được đối chiếu tự động với Dụng Thần của bản mệnh.
- **Bảng Biểu Markdown Chuẩn GFM:** Tự động chuẩn hóa và biên dịch toàn bộ các bảng SWOT, Niên biểu Tài chính/Sự nghiệp, Lộ trình Master Roadmap thành bảng in có đường viền thanh mảnh, chống tràn trang in (`page-break-inside: avoid`).

### 8.5 Phân Quyền & Ranh Giới Bảo Mật Dữ Liệu (Strict Access Control Boundary)
- **Lá số công khai (`isPublic: true`):** Cho phép bất kỳ ai (bao gồm cả khách vãng lai chưa đăng nhập) tải tệp PDF về để lưu trữ hoặc chia sẻ học thuật.
- **Lá số riêng tư (`isPublic: false`):**
  - **TUYỆT ĐỐI CHỈ CHỦ SỞ HỮU MỚI ĐƯỢP PHÉP TẢI VỀ** (`record.userId === req.user.id`).
  - Nếu khách vãng lai (chưa đăng nhập) cố tình gọi API tải PDF của bản ghi riêng tư $\rightarrow$ Hệ thống phản hồi ngay lập tức mã lỗi `401 Unauthorized` (`Vui lòng đăng nhập để xuất tệp PDF bản ghi riêng tư này`).
  - Nếu người dùng đã đăng nhập nhưng không phải là chủ sở hữu bản ghi riêng tư $\rightarrow$ Hệ thống lập tức chặn đứng với mã lỗi `403 Forbidden` (`Bạn không có quyền xuất tệp PDF của bản ghi riêng tư này`).

### 8.6 Kiểm Soát Tải & Tối Ưu Tài Nguyên Máy Chủ (Resource Guard & Rate Limiting)
- **Rate Limit Khắt Khe (`pdfExportLimiter`):** Giới hạn tối đa **5 lượt xuất PDF / phút** trên mỗi địa chỉ IP hoặc tài khoản người dùng. Nếu vượt ngưỡng, trả về mã lỗi `429 Too Many Requests`.
- **Chromium Singleton Pool & Idle Cleanup:**
  - Tái sử dụng một instance Chromium duy nhất qua Puppeteer singleton, cắm các cờ tối ưu hóa bộ nhớ VPS (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`).
  - Giới hạn tối đa 2 tác vụ render PDF đồng thời (`maxConcurrent = 2`), hàng đợi tự động xếp lịch xử lý.
  - Tự động đóng trình duyệt giải phóng 100% RAM sau **5 phút không có yêu cầu** (`idleTimeoutMs = 300000`).
- **Redis Binary Cache (24 Giờ):** Tệp PDF sinh ra được mã hóa Base64 và lưu trữ đệm trên Redis với khóa `pdf_cache:{type}:{id}:{scopeHash}` trong thời hạn 24 giờ. Các lượt tải cùng phạm vi dữ liệu sẽ được phản hồi ngay lập tức từ bộ nhớ đệm trong $<50$ms mà không tốn CPU render lại.

### 8.7 Ghi Nhật Ký Kiểm Toán (Audit Logging with UUIDv7 Request ID)
Mọi lượt gửi yêu cầu tải PDF đều được hệ thống gắn một định danh `requestId` duy nhất theo chuẩn UUIDv7, ghi nhận đầy đủ vào cả `LoggerService` và bảng `SystemLog` với các trường:
- `requestId`: Mã định danh duy nhất của request.
- `userId` / `ip`: Người thực hiện (hoặc địa chỉ IP nếu là khách).
- `type` / `id`: Loại bản ghi và ID bản ghi được xuất.
- `scope`: Danh sách các phân đoạn nội dung được chọn.
- `fileSize`: Kích thước tệp PDF sinh ra (bytes).
- `duration`: Thời gian máy chủ xử lý tác vụ (ms).
- `cacheHit`: Trạng thái lấy từ Redis Cache hay render mới qua Chromium.

### 8.8 Chuẩn Hóa Bố Cục Chuyên Biệt Cho Bát Tự Tứ Trụ (Bazi Layout v3 Standards)
Nhằm mang lại trải nghiệm xem tài liệu học thuật tối ưu, bản in PDF của phân hệ Bát Tự được chuẩn hóa theo các nguyên tắc đặc thù:
- **Thứ Tự Tứ Trụ Cổ Pháp:** Trụ được sắp xếp theo đúng dòng thời gian mệnh lý: **TRỤ NĂM $\rightarrow$ NGUYỆT LỆNH $\rightarrow$ NHẬT CHỦ $\rightarrow$ TRỤ GIỜ**, tạo sự liền mạch từ Tiền Vận (Tổ Tiên/Căn Cơ) đến Hậu Vận (Tử Tức).
- **Hàng Lối Ngay Ngắn Chuẩn Mực:** Cấu trúc bảng tứ trụ được chia thành các hàng độc lập (Thập Thần, Can, Chi & Nạp Âm, Tàng Can, Thần Sát) với chiều cao đồng nhất, đảm bảo tính thẩm mỹ cao nhất trên khổ giấy in A4.
- **Trạng Thái 12 Trường Sinh So Với Nguyệt Chi:** Loại bỏ hoàn toàn các dòng nhãn thô như `(Hành Mộc)`, `(Hành Thổ)` ở cả Thiên Can và Địa Chi. Dưới mỗi Thiên Can hiển thị huy hiệu Trạng thái 12 Trường Sinh so với Nguyệt Chi (`[Trường Sinh]`, `[Lâm Quan]`, `[Đế Vượng]`, `[Tử]`, `[Tuyệt]`...) được tính toán chính xác theo chuẩn Cổ học Bát Tự. Dưới mỗi Địa Chi chỉ giữ lại tên Chi và huy hiệu Nạp Âm bản mệnh.
- **Tàng Can Chia Đều & Viết Tắt Thập Thần:** Loại bỏ nhãn "Tàng Can:", chia đều 3 dòng cố định cho mỗi trụ, can tàng đi kèm tên Thập Thần viết tắt chuẩn (`Tỷ`, `Kiếp`, `Thực`, `Thương`, `T.Tài`, `Tài`, `Sát`, `Quan`, `Kiêu`, `Ấn`).
- **Phân Định Thần Sát Trực Quan:** Thần Sát trong trụ và Ma Trận Thần Sát bản mệnh được phân màu học thuật rõ ràng: Cát Thần / Quý Nhân viền xanh lục (`#047857`), Hung Sát / Hình Hại viền đỏ trầm (`#b91c1c`).
- **Hiển Thị Chính Xác Tỷ Lệ Ngũ Hành:** Đọc trực tiếp từ bộ điểm phần trăm phân bổ ngũ hành thực tế (`Kim`, `Mộc`, `Thủy`, `Hỏa`, `Thổ`) do Rule Engine Bát Tự 4.0 tính toán.
- **Khối Dụng Thần & Phương Án Bổ Mệnh Toàn Diện:** Cung cấp giải pháp bổ cứu phong thủy thực tiễn gồm 4 phương diện: Nghề nghiệp bổ trợ, Màu sắc cát tường, Phương vị tương hỗ và Vật phẩm phong thủy trợ mệnh.
- **10 Đại Vận & 100 Năm Lưu Niên:** Ngoài lưới 10 thẻ Đại Vận (2x5), tài liệu tích hợp Bảng Tra Cứu Chi Tiết 100 Năm Lưu Niên (mỗi đại vận liệt kê đủ 10 năm kèm Can Chi tương ứng) giúp đương số và người luận dễ dàng đối chiếu vận hạn từng năm.
- **Khoảng Cách Vừa Đủ Giữa Các Chương Luận Giải:** Giữa các chương luận giải AI áp dụng khoảng giãn cách vừa vặn (~20-22px: margin-top 12px, padding-top 8px) kèm đường nét đứt thanh nhã 1px (`.chapter-block`), loại bỏ hoàn toàn `page-break-inside: avoid` để tránh việc trình duyệt đẩy nguyên chương dài sang trang mới gây khoảng trắng thừa ở chân trang, kết hợp `page-break-after: avoid` trên tiêu đề chương để chống rớt tiêu đề mồ côi.
- **Biên Dịch Bảng GFM Toàn Vẹn & Định Dạng Mệnh Quái:** Parser Markdown xử lý theo từng dòng độc lập, bảo toàn 100% các hàng của bảng ma trận SWOT và lộ trình tài chính; bộ chuyển đổi `formatMenhQuai` và `formatThanDegree` xử lý an toàn dữ liệu dạng đối tượng hoặc chuỗi mã hóa (`Tòng Cách`, `Thân Cân Bằng`, `Cung Chấn (Mộc) - Đông tứ mệnh`), tuyệt đối không để lọt lỗi `[object Object]` ra bản in.

### 8.9 Chuẩn Hóa Bố Cục Chuyên Biệt Cho Kinh Dịch & Lục Hào Nạp Giáp (I Ching Layout Standards v2)
Nhằm mang lại bản in tài liệu chiêm bốc cổ học trực quan, trang nhã và đồng bộ tuyệt đối với giao diện web, phân hệ Kinh Dịch được chuẩn hóa thiết kế theo các nguyên tắc:
- **Khối Tiêu Điểm Chiêm Đoán & Tối Ưu Thông Tin Đầu Hồ Sơ:** Nổi bật tâm điểm câu hỏi chiêm bốc trong khung viền vàng hoàng gia (`#fffbeb`), đi kèm bảng thông số: thời gian lập quẻ, phương pháp gieo quẻ, Nhật Thần & Nguyệt Lệnh kèm ngũ hành, Tuần Không (Không Vong) và Quái Thân bản quẻ. Lược bỏ dòng chữ "Tứ Trụ Thời Gian" để phần đầu hồ sơ cô đọng, sắc nét.
- **Đồ Hình 3 Quẻ Nền Trắng Tinh Tế (Chủ - Hỗ - Biến):** Hiển thị song song trên 3 thẻ độc lập với nền trắng tinh khôi (`#ffffff`), viền mỏng `#cbd5e1`:
  - *Quẻ Chủ:* Tên quẻ, cung quái, ngũ hành bản cung, 6 vạch hào mini (hào tĩnh màu xanh dương `#1e40af`, hào động đổi sang màu đỏ chu sa `#dc2626`).
  - *Quẻ Hỗ (Nuclear Hexagram):* Tự động tính toán chuẩn xác từ 4 hào giữa (Hào 2, 3, 4, 5) của quẻ chủ theo nguyên tắc Hỗ Thượng (hào 5-4-3) và Hỗ Hạ (hào 4-3-2), 100% vạch hào giữ màu xanh dương thuần tĩnh `#1e40af`.
  - *Quẻ Biến:* Tên quẻ biến, cung quái, ngũ hành bản cung; vạch hào biến đổi màu đỏ chu sa `#dc2626`, hào tĩnh màu xanh `#1e40af`. Trường hợp quẻ tĩnh hiển thị trạng thái "Quẻ Tĩnh Thuần Nhất".
- **Bảng Lục Hào Nạp Giáp Chuẩn 1:1 Theo Giao Diện Web (Hình 1):**
  - Thiết kế bố cục song song 2 bên Quẻ Chủ & Quẻ Biến với vách ngăn nét đứt tinh tế (`border-right: 1.5px dashed #cbd5e1`):
    - *Bên trái (Quẻ Chủ):* Cột `Hào` (vạch âm/dương đỏ/xanh) | `T/Ứ` (Thế/Ứng màu xanh đậm) | `Lục Thân` | `Địa Chi` (chi kèm hành tô màu ngũ hành: Mộc `#059669`, Hỏa `#dc2626`, Thổ `#b45309`, Kim `#64748b`, Thủy `#2563eb`) | `PT` (Phục Thần) | `TK` (Tuần Không).
    - *Bên phải (Quẻ Biến):* Cột `Lục Thân` | `Địa Chi` | `TK` | `Lục Thú` (Thanh Long, Chu Tước, Câu Trần, Đằng Xà, Bạch Hổ, Huyền Vũ) | `Hào` (vạch biến âm/dương đỏ/xanh).
  - Sắp xếp thứ tự chuẩn từ **Hào 6 (Thượng)** ở trên cùng xuống **Hào 1 (Sơ)** ở dưới cùng.
  - Tự động chuyển đổi sang bảng 7 cột thanh lịch (`Hào`, `T/Ứ`, `Lục Thân`, `Địa Chi`, `Phục Thần`, `TK`, `Lục Thú`) đối với các quẻ tĩnh không có hào động.
- **Khối Trạng Thái Vượng Suy Các Hào Chuẩn Hình 2:**
  - Tiêu đề in hoa gạch chân đỏ mận đậm nét: `TRẠNG THÁI VƯỢNG SUY CÁC HÀO` (`border-bottom: 2px solid #881337`).
  - Phù hiệu Quái Thân góc phải: `Quái Thân: [Chi]` viền tím trang nhã (`#f3e8ff`, `#6b21a8`).
  - Hai bảng song song Quẻ Chính & Quẻ Biến với 4 cột chuẩn: `HÀO / CAN CHI`, `VƯỢNG SUY`, `TS NGÀY`, `TS THÁNG`.
  - Can Chi phân màu ngũ hành (kèm tag `QT` nếu là Quái Thân), Vượng Suy nổi bật với pill đỏ viền hồng cho Vượng/Tướng, TS Ngày màu xanh dương, TS Tháng màu cam/nâu.
  - Tối ưu độ nén để trọn vẹn 3 khối (Đồ hình 3 quẻ, Bảng Lục Hào nạp giáp, Trạng thái vượng suy) vừa vặn hoàn hảo trong Trang 1 của tài liệu PDF A4.
- **Khối Phân Tích Dịch Lý Cốt Lõi (Lưới 2x2 Highlight):**
  - *Thẻ 1 - Dụng Thần:* Xác định đúng tâm điểm câu hỏi theo Rule Engine, đánh giá khí lực ngũ hành (Vượng Tướng / Hưu Tù Tử), kiểm tra Tuần Không.
  - *Thẻ 2 - Tương Quan Thế - Ứng:* Phân tích tương quan giữa đương số (Thế) và đối phương/hoàn cảnh (Ứng), chỉ rõ tương phối âm dương sinh khắc.
  - *Thẻ 3 - Hào Động & Biến Hóa:* Liệt kê từng hào động kèm tác động dịch lý (Hóa Tiến, Hóa Thoái, Hóa Sinh, Hóa Khắc).
  - *Thẻ 4 - Cách Cục & Độ Ứng Nghiệm:* Tổng kết các trạng thái đặc biệt, Quái Thân bảo trợ, độ tin cậy toán học (%) và lời khuyên dịch học cô đọng.
- **Bảng Niên Lịch Ứng Kỳ Dự Báo Cát Hung:** Hiển thị thời điểm dự báo sự việc biến chuyển theo lịch âm, dương quy chiếu và dự đoán cát hung.
- **Toàn Văn Luận Giải Chu Dịch:** Sử dụng khoảng cách tự nhiên giữa các chương (`.chapter-block`), không ngắt trang cưỡng bức, hỗ trợ lựa chọn xuất theo từng chương (`ch1` - Ý nghĩa quái tượng, `ch2` - Hào động, `ch3` - Lời khuyên, `ch4` - Ứng kỳ).

---

## 8. Chuẩn Hóa Bản In PDF Tử Vi Đẩu Số (Thiên Bàn & Mệnh Bàn 12 Cung 4x4)

Nhằm mang lại bản in PDF Tử Vi Đẩu Số chuẩn mực cổ học phương Đông, đồng bộ trải nghiệm với giao diện web và tối ưu tính thẩm mỹ học thuật, phân hệ Tử Vi được chuẩn hóa các quy tắc:
- **Đồ Hình Mệnh Bàn 12 Cung Số (Lưới 4x4 - 16 Ô):**
  - Phân bổ 12 Cung xung quanh 4 cạnh theo đúng chuẩn vị trí 12 Địa Chi cổ truyền:
    - *Hàng 1 (Đỉnh):* Tỵ (1,1) $\rightarrow$ Ngọ (1,2) $\rightarrow$ Mùi (1,3) $\rightarrow$ Thân (1,4).
    - *Cột phải:* Dậu (2,4) $\rightarrow$ Tuất (3,4).
    - *Hàng 4 (Đáy):* Hợi (4,4) $\leftarrow$ Tý (4,3) $\leftarrow$ Sửu (4,2) $\leftarrow$ Dần (4,1).
    - *Cột trái:* Mão (3,1) $\leftarrow$ Thìn (2,1).
  - Chiều cao lưới thẻ 640px cố định, chống xô lệch trang in, tự động phân bố không gian cân đối cho 1 trang A4 trọn vẹn.
- **Trung Cung (Thiên Bàn Tử Vi Đẩu Số - 2x2 Ô Trung Tâm):**
  - Chiếm trọn 4 ô trung tâm (`grid-column: 2 / span 2; grid-row: 2 / span 2;`).
  - Viền tím hoàng gia nét đôi (`border: 2px solid #a855f7`), nền chuyển sắc nhẹ (`#faf5ff`).
  - Hiển thị đầy đủ thông tin định danh đương số: Tên đương số in hoa đậm, giới tính (Nam/Nữ Mệnh), Bản Mệnh Cục (ví dụ: Mộc Tam Cục, Kim Tứ Cục...), Mệnh Chủ / Thân Chủ, Tứ Trụ Can Chi (Năm - Tháng - Ngày - Giờ), Ngày sinh Dương Lịch / Âm Lịch, Giờ sinh chính xác.
  - Thanh tiêu điểm nổi bật chân Thiên Bàn: Cung Mệnh an tại đâu, Thân cư cung nào.
- **Chi Tiết Bố Cục Từng Cung Vị (Palace Cell):**
  - *Đỉnh Cung:* Can Chi viết tắt (`Ấ.Tỵ`, `B.Ngọ`, `G.Thìn`...), Tên Cung viết hoa đậm tô màu theo ngũ hành của bản cung, Tuổi Đại Hạn khởi đầu (ví dụ: `43t`, `53t`...). Cung Mệnh có viền hổ phách `#d97706`, Cung Thân có viền tím đậm `#6366f1`.
  - *Chính Tinh:* Tên sao to đậm căn giữa, tô màu theo ngũ hành của sao (Kim: `#475569`, Mộc: `#059669`, Thủy: `#0f172a`, Hỏa: `#dc2626`, Thổ: `#b45309`), Đắc Hãm `(M)`, `(V)`, `(Đ)`, `(B)`, `(H)`, huy hiệu Tứ Hóa (`[LỘC]`, `[QUYỀN]`, `[KHOA]`, `[KỴ]`), hoặc nhãn `VÔ CHÍNH DIỆU`.
  - *Phụ Tinh 2 Cột Đối Xứng:*
    - Cột Trái: Cát tinh (Văn Xương, Văn Khúc, Tả Phù, Hữu Bật, Thiên Khôi, Thiên Việt, Hóa Lộc, Hóa Quyền, Hóa Khoa, Lộc Tồn, Long Trì, Phượng Các...) với màu ngũ hành riêng từng sao.
    - Cột Phải: Sát tinh (Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Địa Không, Địa Kiếp, Hóa Kỵ, Thiên Hình, Đại Hao, Tang Môn...) hiển thị màu sắc học thuật.
    - Giới hạn 5 sao mỗi bên để đảm bảo không bị cắt xén hay tràn khung.
  - *Đáy Cung:* Địa Chi Tiểu Hạn (tô màu ngũ hành tương ứng), Vòng 12 Trường Sinh (Trường Sinh, Mộc Dục, Quan Đới, Lâm Quan, Đế Vượng, Suy, Bệnh, Tử, Mộ, Tuyệt, Thai, Dưỡng), Chỉ số Nguyệt Hạn (`Th.1` $\rightarrow$ `Th.12`).
- **Thanh Chú Giải Đắc Hãm & Ngũ Hành (Legend Bar):** Đặt ngay chân Mệnh Bàn, giải nghĩa ký hiệu `(M)`, `(V)`, `(Đ)`, `(B)`, `(H)` cùng bảng mẫu màu sắc 5 hành Kim, Mộc, Thủy, Hỏa, Thổ.
- **Khoảng Cách Tự Nhiên Giữa Các Chương Luận Giải:** Thay thế ngắt trang cưỡng bức bằng `.chapter-block` có khoảng cách vừa đủ (~20px), tránh trang trắng thừa khi xuất toàn bộ các chương luận giải AI.

## 8.11 Chuẩn Hóa Bản In PDF Hợp Hôn (Bát Tự & Bát Trạch Phối Cung Cổ Pháp)

Nhằm hoàn thiện bộ tứ ấn phẩm học thuật hoàng gia (Bát Tự, Tử Vi, Kinh Dịch, Hợp Hôn), phân hệ Hợp Hôn (Hôn Nhân) được chuẩn hóa theo các quy tắc thiết kế và học thuật kinh điển:
- **Bố Cục Trang 1 Vừa Vặn Trọn Vẹn Khổ A4:** Tối ưu hóa kích thước và khoảng đệm (padding/margin) để 3 khối dữ liệu cốt lõi cùng thẻ Header hồ sơ hiển thị hoàn chỉnh trong 1 trang duy nhất, không tràn sang trang thứ 2:
  - *Header Hồ Sơ Đôi Bên:* Thiết kế 2 thẻ thông tin song song Nam Mệnh (Dương Cương viền xanh dương `#1e40af`) và Nữ Mệnh (Âm Nhu viền đỏ mận `#be123c`), bao gồm Ngày sinh Dương Lịch, Âm Lịch, Nạp Âm Bản Mệnh và Cung Phi Mệnh Quái (Cung, Ngũ Hành, Nhóm Đông/Tây tứ mệnh).
  - *Khối I - Bảng Đối Chiếu 5 Tiêu Chí Cổ Học:*
    1. **Bản Mệnh Nạp Âm:** Đánh giá tương quan Tương Sinh (Nam sinh Nữ / Nữ sinh Nam - Thượng Cát), Tỷ Hòa (Đồng khí - Cát lợi), Tương Khắc (Nam khắc Nữ / Nữ khắc Nam).
    2. **Thiên Can Bản Thể (Nhật Can):** Tư tưởng, cốt cách, thế giới quan. Đánh giá Thiên Can Hợp Hóa (Giáp-Kỷ, Ất-Canh, Bính-Tân, Đinh-Nhâm, Mậu-Quý - Đại Cát), Đồng Khí, Tương Sinh, Tương Khắc.
    3. **Địa Chi Phu Thê (Nhật Chi):** Cung Phu Thê gia đạo, tình cảm gắn kết. Đánh giá Lục Hợp (Đại Cát), Tam Hợp (Thượng Cát), Lục Xung (Đại Kỵ), Lục Hại (Thứ Hung), Tự Hình / Đồng Chi.
    4. **Cung Phi Bát Trạch Phối Cung:** Kết hợp Mệnh Quái Nam và Nữ theo ma trận 8x8 ra 4 Cung Cát (Sinh Khí, Diên Niên, Thiên Y, Phục Vị) hoặc 4 Cung Hung (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại) kèm mức độ cát hung và phương pháp hóa giải thực tế.
    5. **Dụng Thần & Thần Sát Bổ Khuyết:** Đánh giá mức độ bù trừ Dụng Thần / Hỷ Thần giữa hai bên để điều hòa khí vận gia đình.
  - *Khối II - Đánh Giá Cân Bằng Tỷ Lệ Ngũ Hành (Nam & Nữ):* Bảng so sánh 5 hành (Kim, Mộc, Thủy, Hỏa, Thổ) với giá trị % cụ thể, cho thấy rõ đương số nào khuyết hành nào và được đối phương trợ lực ra sao.
  - *Khối III - Cấu Trúc Tứ Trụ Can Chi Đối Chiếu Song Song:* Bảng 4 trụ (Năm, Nguyệt Lệnh, Nhật Chủ, Giờ) đặt song song 2 bên Chồng & Vợ với đầy đủ: Thập Thần, Can to (màu ngũ hành), Chi to (màu ngũ hành), Nạp Âm trụ, Tàng Can 3 tầng có Thập Thần phụ, Thần Sát top 2 mỗi trụ.
- **Trang 2+: Toàn Văn Bản Luận Giải Hôn Nhân & Chiến Lược Hòa Hợp:**
  - Bắt đầu sạch đẹp từ trang 2 với Header hồ sơ và tiêu đề đỏ mận uy nghi.
  - Áp dụng cấu trúc `.chapter-block` tự nhiên, phân tách bằng đường nét đứt thanh lịch, triệt tiêu hoàn toàn hiện tượng ngắt trang cưỡng bức gây lãng phí trang in.
- **Tùy Chọn Xuất Granular Phân Hệ Hợp Hôn:**
  - `marriage_compare`: Bảng Đối Chiếu 5 Tiêu Chí Cổ Học & Tỷ Lệ Ngũ Hành.
  - `marriage_pillars`: Cấu Trúc Tứ Trụ Can Chi Đối Chiếu Song Song.
  - `intro` / `all_interpretation`: Toàn Văn Luận Giải Hợp Hôn & Hòa Hợp Gia Đạo.
- **Chuẩn Mực Phông Chữ & Thẩm Mỹ Hoàng Gia:**
  - 100% sử dụng phông chữ serif `Noto Serif` kết hợp `Inter`, hiển thị sắc nét chữ `Đ` hoa và tiếng Việt có dấu.

## 8.12 Chuẩn Hóa Bản In PDF Bát Tự (Tứ Trụ Mệnh Lý Tinh Hoa & Tối Ưu Thần Sát, Luận Giải)

Nhằm tối ưu hóa trải nghiệm in ấn tài liệu Tứ Trụ Bát Tự đạt chuẩn mực thư phòng cổ học thanh nhã, phân hệ Bát Tự được chuẩn hóa các quy tắc trình bày:
- **Chuẩn Hóa Hiển Thị Thần Sát Tứ Trụ (Chỉ Màu Chữ, Không Viền, Không Nền):**
  - Thần Sát phân chia chính xác 3 trạng thái tính chất học thuật:
    - *Cát Thần (Thiên Ất, Thái Cực, Thiên Đức, Nguyệt Đức, Lộc Thần, Văn Xương, Tướng Tinh, Phúc Tinh, Quốc Ấn, Thiên Y, Kim Dư, Tam Kỳ...):* Màu chữ xanh lục `#047857`, nền trong suốt, không viền.
    - *Hung Sát (Kình Dương, Kiếp Sát, Vong Thần, Cô Thần, Quả Tú, Cô Loan, Thập Ác Đại Bại, Lưu Hà, Huyết Nhận, Đà La, Tai Sát, Phi Nhẫn...):* Màu chữ đỏ chu sa `#dc2626`, nền trong suốt, không viền.
    - *Lưỡng Tính / Trung Tính (Hoa Cái, Dịch Mã, Không Vong, Tuần Không, Triệt Không, Đào Hoa, Hàm Trì, Hồng Loan, Hồng Diễm, Thiên La, Địa Võng, Khôi Cương, Kim Thần...):* Màu chữ đen `#0f172a`, nền trong suốt, không viền.
- **Trường Sinh & Nạp Âm Tối Giản (Text-Only):**
  - Trạng thái Vòng 12 Trường Sinh: Chỉ hiển thị chữ màu cam đất/đồng cổ `#9a3412`, loại bỏ hoàn toàn viền đóng khung và màu nền.
  - Nạp Âm Can Chi các trụ: Chỉ hiển thị chữ màu xám than `#334155`, loại bỏ hoàn toàn viền đóng khung và màu nền.
- **Loại Bỏ Hoàn Toàn Bảng Ma Trận Thần Sát Bản Mệnh:**
  - Lược bỏ Section II Ma Trận Thần Sát cũ để loại trừ thông tin dư thừa, tạo không gian thoáng đãng cho Bảng Hành Trình Đại Vận 100 Năm & Lưu Niên hiển thị trọn vẹn ở chân Trang 1.
- **Tối Ưu & Xuất Bản Hoàn Hảo Cho Cả Luận Giải Cơ Bản & Chuyên Sâu:**
  - *Bản Luận Giải Tiêu Chuẩn (Standard):* Hỗ trợ xuất trọn vẹn 6 Bước cốt lõi (`BƯỚC 1: Phân Tích Nhật Chủ` $\rightarrow$ `BƯỚC 6: Tổng Kết & Chiến Lược`). Header trang trọng `Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Tiêu Chuẩn)`.
  - *Bản Luận Giải Chuyên Sâu (VIP):* Hỗ trợ xuất đầy đủ 6 Chương chuyên sâu, Phân Tích Nhật Chủ Ma Trận SWOT và Chuyên Đề Điều Hòa Chiến Lược Đa Mục Tiêu. Header hoàng gia `Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Chuyên Sâu)`.
  - *Lọc Granular Trong Modal Xuất PDF:* Modal PDF tự động nhận diện chế độ luận giải của bản ghi, cung cấp tùy chọn chọn toàn bài hoặc chọn chi tiết từng bước/từng chương.
  - *Làm Sạch Tiêu Đề:* Khử triệt để lỗi dấu hai chấm lặp (`: :`), chuẩn hóa phân cấp tiêu đề rõ ràng, ngắt đoạn tự nhiên giữa các chương mục mà không bị ngắt trang cưỡng bức gây lãng phí giấy in.
- **Đồng Bộ Màu Sắc Ngũ Hành Cho Dụng Thần, Hỷ Thần & Kỵ Thần:**
  - Tên ngũ hành của Dụng Thần, Hỷ Thần và Kỵ Thần hiển thị chính xác theo màu ngũ hành cổ pháp tương ứng (Kim: xám chì `#475569`, Mộc: xanh lục `#047857`, Thủy: xanh dương `#1e3a8a`, Hỏa: đỏ chu sa `#b91c1c`, Thổ: vàng đất/hổ phách `#b45309`), triệt tiêu việc gán màu cứng nhắc (như gán đỏ cho Hỷ Thần gây nhầm lẫn khi Hỷ Thần là Thủy, Mộc hay Kim).

## 8.13 Tối Ưu Bố Cục Bản In PDF Hợp Hôn (Bố Cục Nam Trên - Nữ Dưới & Hiển Thị Hỷ Kỵ Dụng Thần)

Nhằm nâng cao tính thẩm mỹ và độ chính xác học thuật trong bản in PDF Hồ Sơ Hợp Hôn Cổ Pháp, hệ thống chuẩn hóa các quy tắc trình bày:
- **Hiển Thị Đầy Đủ Hỷ Kỵ Dụng Thần Kèm Màu Ngũ Hành (Mục 5 - Bảng 5 Tiêu Chí Cốt Lõi):**
  - Trích xuất linh hoạt cả 3 yếu tố: Dụng Thần, Hỷ Thần, Kỵ Thần từ cấu trúc dữ liệu Bát Tự (`dungThan`, `hyThan`, `kyThan`, `analysis`, `dungThanInfo`).
  - Hiển thị trực quan theo định dạng: `Dụng: [Màu] | Hỷ: [Màu] | Kỵ: [Màu]` cho cả Nam Mệnh và Nữ Mệnh.
  - Tên ngũ hành được áp màu chuẩn xác theo ngũ hành cổ pháp (Kim: `#475569`, Mộc: `#047857`, Thủy: `#1e3a8a`, Hỏa: `#b91c1c`, Thổ: `#b45309`).
- **Tái Cấu Trúc Section III Tứ Trụ Can Chi (Bố Cục Nam Trên - Nữ Dưới & Tối Giản Nền Header, Lược Bỏ Thần Sát):**
  - Chuyển đổi từ dạng cột song song ngang (8 cột chật hẹp, dễ tràn viền và che khuất thông tin) sang dạng 2 bảng xếp chồng trên - dưới:
    - *Bảng trên (Nam Mệnh - Chồng):* Tiêu đề `♂ TỨ TRỤ NAM MỆNH (CHỒNG)`, viền `#bfdbfe`.
    - *Bảng dưới (Nữ Mệnh - Vợ):* Tiêu đề `♀ TỨ TRỤ NỮ MỆNH (VỢ)`, viền `#fecdd3`.
  - **Bỏ hoàn toàn màu nền ở hàng Header:** Hàng tiêu đề 4 trụ (`TRỤ NĂM`, `NGUYỆT LỆNH`, `NHẬT CHỦ`, `TRỤ GIỜ`) chuyển sang dạng chữ thanh lịch có màu nhận diện học thuật (`#1e3a8a` cho Nam và `#be123c` cho Nữ) trên nền trắng thuần khiết, loại bỏ hoàn toàn dải màu nền đặc (solid background), phân tách với thân bảng bằng đường viền đáy tinh tế.
  - **Lược bỏ hoàn toàn hàng Thần Sát:** Nhằm tinh giản thông tin, tránh phân tán và quá tải chi tiết tại bảng Tứ Trụ Hợp Hôn, hàng Thần Sát được lược bỏ triệt để khỏi bảng mini, tập trung toàn bộ sự chú ý vào Thập Thần, Can Chi lớn (13pt bold màu ngũ hành), Nạp Âm và Tàng Can.
  - Bảng áp dụng thuộc tính `table-layout: fixed; width: 100%;`, mỗi trụ (Năm, Nguyệt Lệnh, Nhật Chủ, Giờ) chiếm trọn 25% chiều ngang khổ giấy A4 (~45mm/cột).
  - Chiều cao Trang 1 được tính toán vi mô (~540px) đảm bảo luôn nằm trọn vẹn trong 1 trang in A4 duy nhất, luận giải AI chuyển tiếp êm ả sang Trang 2.
