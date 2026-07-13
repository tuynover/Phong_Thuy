# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.

---

## 📅 Phiên bản: Thuật toán Bát tự Ngũ hành 4.0 (13/07/2026)

### Backend (Tính toán học thuật Bát tự)
- **Cải tiến và nâng cấp Thuật toán Bát tự Ngũ hành 4.0:**
  - **Tổ hợp chi tranh đoạt (Ưu tiên hợp xung):** Phân cấp độ ưu tiên của các quan hệ Địa Chi (Tam Hội/Tam Hợp > Lục Hợp > Lục Xung/Hình/Hại). Nếu chi đã tham gia tổ hợp có ưu tiên cao hơn, sức ảnh hưởng điểm số của nó ở các tổ hợp có ưu tiên thấp hơn sẽ bị giảm trừ **80%** (Hợp giải xung).
  - **Đa thấu phân khí (Nguyệt Lệnh):** Nếu có $N \ge 2$ Thiên can cùng thấu từ Chi tháng sinh, phần điểm thưởng Root Power thấu can cộng thêm cho mỗi can sẽ chia đều cho $N$ để thể hiện sự phân tán khí của Nguyệt Lệnh.
  - **Tiết khí cực đoan (Con vượng Mẹ kiệt) & Mẫu dĩ tử quý:** Khi ngũ hành con chiếm $>35\%$ tổng điểm thô $\rightarrow$ Giảm **30%** điểm số của ngũ hành mẹ (Mẹ bị kiệt quệ do tiết khí cực độ). Nếu ngũ hành con vượng vừa phải ($25\% - 35\%$) $\rightarrow$ Tăng **10%** điểm số của ngũ hành mẹ (Mẫu dĩ tử quý).
  - **Phá điểm sàn phục vụ Tòng Cách:** Nếu một hành cực thịnh chiếm tỷ lệ $>65\%$ điểm thô $\rightarrow$ Vô hiệu hóa điểm sàn tối thiểu $5\%$ đối với các hành bị xung khắc hoàn toàn để phục vụ nhận diện cách cục Tòng cách chuẩn xác.

### Frontend (Giao diện người dùng)
- **Đồng bộ hóa Ô Nhập Liệu Destiny Modal (Xem Vận Mệnh):**
  - Tích hợp component `<CustomSelect />` tự làm sạch và tìm kiếm thông minh thay thế cho các thẻ `<select>` mặc định thô cứng của trình duyệt trong hộp thoại modal "Xem Vận Mệnh" ở Trang chủ.
  - Tích hợp thêm **ô chọn Phút sinh (MM)** song song với Giờ sinh (HH) theo đúng bố cục phân bổ `:` chuẩn hóa của Bát Tự, giúp truyền dữ liệu thời gian sinh tuyệt đối lên hệ thống xử lý.
  - Đồng bộ hóa các góc bo tròn (`rounded-xl`), biểu tượng chọn, hiệu ứng focus và phong cách phối màu (Gender buttons xanh/rose chứa icon `User`) chuẩn hóa giao diện hoàn toàn đồng bộ với trang lập lá số Bát Tự (`BaziInput.jsx`).

## 📅 Phiên bản: Nâng cấp Toàn diện Thuật toán Tính Ngũ Hành Bát tự (13/07/2026)

### Backend (Tính toán Ngũ hành Bát tự)
- **Tái cấu trúc và nâng cấp Thuật toán Bát tự Bazi 2.0:**
  - **Phân bổ trọng số cơ sở tĩnh:** Nâng Thiên can thường lên 15 điểm, Can tháng 7.5 điểm (1/2 can thường), Chi thường 10 điểm, Chi tháng 25 điểm (Nguyệt lệnh giữ quyền lực tuyệt đối). Tổng điểm cơ sở tĩnh ban đầu là 107.5 điểm.
  - **Phân rã Địa chi vào Tàng can:** Phân bổ hoàn toàn điểm số của Địa chi vào các tàng can của nó (Quý = 100% cho Tý; Đinh/Kỷ = 70/30 cho Ngọ; Bản khí/Trung khí/Dư khí = 60/30/10 cho các địa chi khác).
  - **Quyền lực Trụ Tháng (Nguyệt Lệnh):** Tích hợp tính điểm Can tháng qua 4 cấp độ (Thấu Can, Đồng hành 70% bản khí, Đắc sinh +3 điểm, Bị khắc +1 điểm hoặc bị phạt -3 điểm nếu không có gốc) và Thấu Can toàn lá số suy giảm theo khoảng cách trụ ($1.0$, $0.75$, $0.5$, $0.2$).
  - **Thông Căn Địa Chi (Can có gốc):** Tính điểm cộng thông căn cho Thiên can từ các Tàng can cùng ngũ hành trong Địa chi, áp dụng hệ số suy giảm khoảng cách trụ ($1.0$, $0.75$, $0.5$, $0.2$).
  - **Độ vượng Ngũ hành theo mùa (Vượng, Tướng, Hưu, Tù, Tử):** Nhân điểm số ngũ hành tương ứng với hệ số mùa sinh: Vượng ($\times 1.5$), Tướng ($\times 1.2$), Hưu ($\times 1.0$), Tù ($\times 0.8$), Tử ($\times 0.6$).
  - **Xét Chân Thần - Giả Thần:** Cộng thêm $+3$ điểm cho ngũ hành có Thiên can là Chân thần (có gốc trong tàng can của Chi tháng sinh).
  - **Hội Cục Địa Chi:** Tích hợp kiểm tra Tam Hội ($+12$ điểm) và Bán Tam Hội ($+4$ điểm).
  - **Tương tác Thiên Can & Thổ khô - Thổ ướt:** Tích hợp tương tác sinh khắc giữa các Thiên can theo khoảng cách. Điều chỉnh lực khắc Thủy và sinh Kim/Hỏa của Thìn, Sửu (Thổ ướt) và Tuất, Mùi (Thổ khô). Áp dụng phạt Mộc và Thủy nếu Thổ quá vượng ($> 35\%$).
  - **Ngũ hành Phản sinh & Phản khắc:** Áp dụng thuật toán phạt năng lượng do phản sinh/phản khắc (cha yếu con vượng, mẹ quá vượng hại con).
  - **Chuẩn hóa tỷ lệ & Bù sai số float:** Chuẩn hóa toàn bộ ngũ hành về tổng bằng đúng 100 điểm, tự động bù sai số làm tròn vào ngũ hành có điểm số cao nhất.

## 📅 Phiên bản: Sửa lỗi hiển thị Đánh giá sau khi refresh, Xóa mềm lịch sử và Tránh trùng lặp Lá số bản thân (12/07/2026)

### Frontend (Giao diện & Cải tiến Luồng)
- **Làm mới lịch sử khi Submit Đánh giá:**
  - Bổ sung prop `onInvalidateHistory` cho cả 4 phân hệ (`BaziBoard`, `IChingBoard`, `MarriageBoard`, `ZiweiBoard`).
  - Khi người dùng gửi đánh giá thành công, frontend sẽ lập tức xóa cache lịch sử hiện tại (`preloadedHistory = null`), đảm bảo khi người dùng tải lại trang hoặc mở lịch sử, quẻ/lá số đã lưu điểm sẽ hiển thị chính xác trạng thái đã đánh giá và ẩn đi khung đánh giá.
- **Tránh trùng lặp Lá số Bản thân:**
  - Thiết kế logic so khớp thông tin ngày, tháng, năm, giờ sinh và giới tính khi click nút "Xem Lá Số Của Bản Thân" ở Bát Tự (`UserApp.jsx`) và Tử Vi (`ZiweiBoard.jsx`).
  - Nếu trùng khớp hoàn toàn với lá số bản thân đã có (`ownBaziRecordId`/`ownZiweiRecordId`), hệ thống nạp trực tiếp dữ liệu cũ lên giao diện mà không gọi API tạo mới, giúp tiết kiệm Credit AI và không spam tạo nhiều bản ghi rác trong cơ sở dữ liệu.
  - Nếu thông tin ngày sinh thay đổi (hoặc chưa từng tạo), hệ thống sẽ gửi phân tích mới và liên kết lại ID lá số mới vào hồ sơ tài khoản của người dùng.

### Backend (Xóa mềm & Lưu liên kết)
- **Chuyển đổi sang Xóa mềm (Soft Delete) trong Lịch sử:**
  - Sửa đổi phương thức `deleteCalculation` trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) từ xóa cứng (`deleteOne`) thành xóa mềm: cập nhật trường `isDeleted: true` trong MongoDB.
  - Đảm bảo dữ liệu gốc vẫn an toàn trên máy chủ, chỉ ẩn đi ở phía người dùng.
- **Loại trừ bản ghi đã xóa mềm khỏi kiểm tra trùng lặp (Semantic Idempotency):**
  - Bổ sung điều kiện `isDeleted: { $ne: true }` vào tất cả các truy vấn kiểm tra trùng lặp (duplicate check) trong 4 controller: [BaziController.js](file:///t:/Phongthuy/backend/src/controllers/BaziController.js), [ZiweiController.js](file:///t:/Phongthuy/backend/src/controllers/ZiweiController.js), [IChingController.js](file:///t:/Phongthuy/backend/src/controllers/IChingController.js) và [MarriageController.js](file:///t:/Phongthuy/backend/src/controllers/MarriageController.js).
  - Trước đây, nếu người dùng xóa mềm một bản ghi rồi tạo lại quẻ/lá số cùng thông tin, hệ thống sẽ trả về bản ghi cũ đã xóa thay vì tạo mới. Giờ đây bản ghi đã xóa mềm được bỏ qua hoàn toàn.
- **Tự động hủy liên kết lá số bản thân khi xóa mềm:**
  - Khi người dùng xóa mềm một bản ghi Bát Tự hoặc Tử Vi, nếu bản ghi đó đang được gắn làm lá số bản thân (`ownBaziRecordId`/`ownZiweiRecordId`), hệ thống tự động xóa liên kết đó trong hồ sơ người dùng (`User.baziInfo`).
  - Khi click "Xem Lá Số Của Bản Thân" lần tiếp theo, hệ thống sẽ tạo bản ghi mới thay vì cố tải bản ghi đã xóa.
- **Cập nhật API cập nhật Giờ sinh & Hồ sơ:**
  - Bổ sung hỗ trợ lưu trữ `ownBaziRecordId` và `ownZiweiRecordId` trong `user.baziInfo` khi gọi `/auth/bazi` hoặc `/auth/profile`.
  - Tích hợp logic tự động xóa các liên kết lá số này nếu người dùng thực hiện sửa đổi thay đổi thông tin ngày sinh mới trong Hồ sơ cá nhân.
- **Cập nhật User Schema:**
  - Bổ sung trường `ownBaziRecordId` và `ownZiweiRecordId` (kiểu `String`, default `null`) vào subdocument `baziInfo` trong model [User.js](file:///t:/Phongthuy/backend/src/models/User.js) để Mongoose nhận diện và lưu trữ chính xác.

---

## 📅 Phiên bản: Tối ưu cuộn màn hình mượt mà, Sửa lỗi recommendations rỗng và Tự tính Ngũ Hành Hợp Hôn (12/07/2026)

### Frontend (Giao diện & Cải tiến Cuộn trang)
- **Tự động cuộn đến phần nhập liệu khi reset form:**
  - Cập nhật các nút gieo lại/xem lá số khác ở cuối trang của cả 4 phân hệ để tự động cuộn màn hình mượt mà đến đúng mục nhập liệu đầu tiên (block: 'center') thay vì cuộn lên đầu trang thô ráp.
  - Kinh Dịch: Cuộn đến "Sự việc cần hỏi (Ý niệm)" (`iching-input-header`).
  - Bát Tự: Cuộn đến chọn "Giới Tính" (`bazi-input-gender`).
  - Tử Vi: Cuộn đến chọn "Giới Tính" (`ziwei-input-gender`).
  - Hôn Nhân: Cuộn đến mục "Thông Tin Nam Mệnh" (`marriage-input-nam`).
- **Tự động cuộn xuống phần Luận Giải:**
  - Tích hợp cuộn màn hình mượt mà tự động đến khối kết quả "Thầy Luận Giải Chi Tiết" ngay khi nhận được luồng sse chunk đầu tiên cho cả 4 phân hệ.
- **Tích hợp nút Cuộn Nhanh Lên/Xuống (Floating scroll buttons):**
  - Thêm hai nút mũi tên Lên và Xuống siêu mỏng ở góc dưới bên trái màn hình (`fixed bottom-6 left-6 z-50`).
  - Sử dụng thiết kế không nền trong suốt (`bg-transparent`) để tránh che khuất nội dung hoặc biểu mẫu bên dưới khi lướt trên điện thoại (mobile).
  - Tự động hiển thị trên Trang Chủ, Lịch Sử, và các bước Nhập thông tin của 4 phân hệ. Dọn dẹp bộ nút cuộn trùng lặp trong Tử Vi (`ZiweiBoard.jsx`).
- **Sửa lỗi hiển thị trống thẻ Nên làm/Tránh làm:**
  - Bổ sung bộ lọc nội dung `isMeaningful` để ẩn các khối "Khuyên nên làm" và "Tránh làm" nếu AI trả về giá trị trống, `"null"`, `"none"`, hoặc `"không có"`.
  - Sửa đổi mã nhận diện phân hệ Tử Vi (`ziwei`) để hỗ trợ đồng bộ hiển thị các thẻ khuyến nghị trong ô chat AI follow-up.

### Backend (Sửa đổi Prompt Hôn Nhân)
- **Gỡ bỏ phân bổ Ngũ Hành tính sẵn:**
  - Sửa đổi `getInterpretationPrompt` trong [MarriagePrompts.js](file:///t:/Phongthuy/backend/src/services/MarriagePrompts.js) để gỡ bỏ hoàn toàn dữ liệu phần trăm (%) Ngũ Hành tính sẵn (`maleNguHanhText`, `femaleNguHanhText`) và thông tin Dụng Thần/Kỵ Thần của hai đương số gửi lên AI.
  - Bổ sung hướng dẫn bắt buộc AI tự phân tích vượng suy và tương tác ngũ hành thực tế (định tính), cấm AI tự bịa ra các con số phần trăm (%) thập phân giả lập để đảm bảo chất lượng giải đoán học thuật.

---

## 📅 Phiên bản: Trang chủ Hệ sinh thái & Thanh điều hướng Awwwards (12/07/2026)

### Giao diện & Trải nghiệm (Rebranding & Xem Vận Mệnh)
- **Tái cấu trúc Thương hiệu (Rebranding):**
  - Chuyển đổi tên thương hiệu hiển thị từ "PHONG THỦY AI" thành "PHONG THỦY" trên toàn bộ giao diện Header, Footer, và các bản quyền phần mềm.
- **Thêm tính năng "Xem Vận Mệnh" nhanh:**
  - Thiết kế và phát triển hộp thoại modal "Xem Vận Mệnh" trên trang chủ.
  - Cho phép người dùng nhập Ngày, Tháng, Năm, Giờ sinh (dương lịch) và Giới tính thông qua các trường chọn select tùy chỉnh.
  - Cung cấp hai nút lựa chọn hành động: "Xem Lá Số Bát Tự" và "Xem Lá Số Tử Vi".
  - Khi click lựa chọn nào, hệ thống tự động lập lá số, phân tích mệnh cách tương ứng và chuyển tiếp mượt mà sang tab chức năng của phân hệ đó.
- **Bổ sung Khối kiến thức học thuật ở các phân hệ:**
  - Ở giao diện nhập thông tin (trước khi phân tích) của Kinh Dịch, Bát Tự, Tử Vi và Hợp Hôn, bổ sung các thẻ học thuật chi tiết giải thích: Định nghĩa phân hệ là gì, Phương pháp lập/luận giải khoa học học thuật, và Nội dung chi tiết mà báo cáo sẽ cung cấp cho người xem.
- **Bổ sung Phần Kiến Thức Phong Thủy trên Trang chủ:**
  - Thiết kế thêm phân đoạn "Kiến Thức Phong Thủy" gồm 4 học thuyết nền tảng: Kinh Dịch, Bát Tự, Tử Vi và Ngày Hoàng Đạo để giải nghĩa học thuật tĩnh trực quan cho người dùng mà không cần đi qua bước luận giải.
- **Tối ưu hóa & Hiệu chỉnh Trang chủ (`HomeBoard.jsx`):**
  - Chuyển đổi toàn bộ giao diện xuất hiện động (entrance transitions) của Hero section thành tĩnh hoàn toàn (Sử dụng thẻ HTML tĩnh thay vì motion tags) giúp trang chủ tải ngay lập tức không có độ trễ.
  - Gỡ bỏ huy hiệu "AI-Powered Eastern Wisdom" khỏi đầu trang Hero theo yêu cầu thiết kế.
  - Sửa đổi nội dung phần mô tả sự khác biệt sang thuật ngữ "Luận giải logic học thuật khoa học chính thống" và loại bỏ hoàn toàn các đề cập tới "AI".
  - Gỡ bỏ hoàn toàn phần thống kê số liệu (Statistics) khỏi trang chủ để giảm tải trọng giao diện.
  - Tối ưu hóa hiệu năng cực đại: Loại bỏ bộ lọc CSS `blur` trên hoạt ảnh Framer Motion (vốn gây hao tổn tài nguyên GPU để tính toán lại điểm ảnh khi chuyển động), ngưng cơ chế lắng nghe MouseMove và cập nhật State 3D rotation liên tục trên SVG tinh vân.
- **Hiệu chỉnh thanh Sticky Header & Mobile Menu:**
  - Thêm nút tab "Trang Chủ" nằm bên trái Kinh Dịch trên thanh điều hướng trung tâm desktop giúp dễ dàng quay lại.
  - Loại bỏ hoàn toàn nút chuyển đổi giao diện Dark Mode (Biểu tượng Moon) khỏi phần tiện ích bên phải của Header do không cần thiết.
  - Dọn dẹp các import không sử dụng (`Moon`, `Sun` từ thư viện `lucide-react`).
  - Hoàn trả màu nền kích hoạt (Active tab colors) của các môn học thuật về nguyên bản gốc (Dịch Lý: `bg-amber-800`, Bát Tự: `bg-blue-800`, v.v.).
  - Sửa đổi giao diện mobile menu: Chuyển dải nền kính mờ mờ nhạt sang thẻ màu nền trắng đục hoàn toàn (`bg-white`), loại bỏ blur gây khó đọc văn bản trên màn hình nhỏ, nâng cao tính tương phản và khả năng tiếp cận.
- **Tối ưu hóa layout & Sửa lỗi import:**
  - Điều chỉnh lớp phủ bao bọc layout chính trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) để trang chủ hiển thị full-width tràn màn hình, đồng thời ẩn footer mặc định thô ráp và thay bằng footer Awwwards tối giản.
  - Sửa lỗi thiếu import hàm API `getMarriageHistory` gây crash phần tải trước lịch sử trong UserApp.

## 📅 Phiên bản: Bổ sung tính năng Quên mật khẩu qua Email OTP (12/07/2026)

### Backend (API & Định tuyến)
- **Tích hợp API Quên/Khôi phục mật khẩu:**
  - Viết mới hàm `forgotPassword` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js): Xác thực email tồn tại, sinh mã OTP 6 số ngẫu nhiên, lưu vào DB có thời hạn 15 phút, và gửi mã OTP khôi phục qua Gmail.
  - Viết mới hàm `resetPassword` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js): So khớp mã OTP, tiến hành mã hóa (bcrypt hash) mật khẩu mới, cập nhật DB, tăng `tokenVersion` để vô hiệu hóa tất cả các phiên đăng nhập cũ, xóa OTP.
  - Đăng ký 2 endpoint public giới hạn rate limit: `POST /api/auth/forgot-password` và `POST /api/auth/reset-password` trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js).

### Frontend (Giao diện & Gọi API)
- **Tích hợp Form Quên mật khẩu trong Đăng nhập:**
  - Đăng ký 2 api helper `forgotPassword` và `resetPassword` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
  - Cập nhật [AuthModal.jsx](file:///t:/Phongthuy/frontend/src/components/AuthModal.jsx):
    - Thêm link kích hoạt "Quên mật khẩu?" tại khung nhập mật khẩu ở giao diện Đăng nhập.
    - Xây dựng form 2 bước: Bước 1 (Nhập Email gửi OTP), Bước 2 (Nhập mã OTP email, Mật khẩu mới & Xác nhận mật khẩu mới).
    - Ẩn nút Google Sign-in và toggle tài khoản khi đang thực hiện luồng Quên mật khẩu.

## 📅 Phiên bản: Gỡ bỏ tính năng xác thực Số điện thoại & Sửa đổi gốc Prompt Tử Vi (12/07/2026)

### Backend (Sửa đổi prompt & Controller Tử Vi)
- **Loại bỏ timing/risk khỏi trò chuyện Tử Vi:**
  - Sửa đổi hàm `buildFollowUpPrompt` trong [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js) để loại bỏ hoàn toàn các thuộc tính `"timing"` và `"risk"` khỏi JSON schema đầu ra được yêu cầu từ AI.
  - Sửa đổi hàm `chatZiwei` trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) để gỡ bỏ regex parse `timing`/`risk` và gán cứng giá trị rỗng (`""`) khi tạo lưu trữ `Message` vào MongoDB, giải quyết tận gốc từ phía máy chủ.

### Backend (Dọn dẹp code & Cấu hình)
- **Gỡ bỏ Firebase Admin SDK & SMS routes:**
  - Xóa file cấu hình khởi chạy `src/config/firebase.js`.
  - Xóa câu lệnh `require('./config/firebase')` trong [index.js](file:///t:/Phongthuy/backend/src/index.js).
  - Xóa các endpoint `/send-verification-sms` và `/verify-phone` trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js).
  - Xóa bỏ các hàm controller `sendVerificationSms`, `verifyPhone` và gỡ bỏ `firebase-admin` import khỏi [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js).
  - Xóa các trường schema `isPhoneVerified`, `phoneOtp`, `phoneOtpExpires` trong model [User.js](file:///t:/Phongthuy/backend/src/models/User.js).
  - Gỡ bỏ các biến cấu hình môi trường Firebase khỏi [`.env`](file:///t:/Phongthuy/backend/.env).

### Frontend (Dọn dẹp giao diện & Client SDK)
- **Gỡ bỏ UI xác thực số điện thoại & Client Firebase:**
  - Xóa card hiển thị "Trạng thái SĐT", popup nhập OTP và các state/handlers liên quan khỏi [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx). Khôi phục cấu hình 2 cột hiển thị (Credits, Trạng thái Email).
  - Xóa các API wrapper `sendVerificationSms` và `verifyPhone` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
  - Xóa file khởi tạo Firebase Client `src/config/firebase.js`.
  - Gỡ bỏ các biến cấu hình môi trường Firebase Client khỏi [`.env`](file:///t:/Phongthuy/frontend/.env) và [`.env.production`](file:///t:/Phongthuy/frontend/.env.production).

## 📅 Phiên bản: Tối ưu hóa Chat AI, Phân trừ Credits & Xác thực Email OTP (11/07/2026)

### Backend (Bảo mật & Tích hợp Firebase Admin SDK)
- **Tích hợp Firebase Phone Authentication:**
  - Cài đặt dependency `firebase-admin`.
  - Tạo file cấu hình khởi chạy `src/config/firebase.js` nạp key từ `firebase-service-account.json` và import vào `src/index.js` khi server startup.
  - Viết lại hàm `verifyPhone` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js). Nhận `idToken` từ Client gửi lên, sử dụng `admin.auth().verifyIdToken` để giải mã và xác thực. Sau khi chuẩn hóa so khớp số điện thoại thành công, tiến hành cập nhật trạng thái xác thực và cộng thưởng **+2 credits** cho tài khoản.

### Frontend (Giao diện & Tích hợp Firebase Web SDK)
- **Tích hợp Firebase Phone Auth Client:**
  - Cài đặt dependency `firebase`.
  - Tạo file cấu hình và khởi tạo Firebase App & Auth tại `src/config/firebase.js` sử dụng các biến cấu hình từ môi trường Vite.
  - Cập nhật API helper `verifyPhone(idToken)` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js) để đẩy ID Token thay cho mã OTP thô.
  - Nâng cấp [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx): Tích hợp Google reCAPTCHA ẩn (`recaptcha-container` div), gọi hàm `signInWithPhoneNumber` gửi SMS OTP thật qua Google, và tiến hành lấy `idToken` bằng phương thức `.getIdToken()` sau khi người dùng nhập đúng OTP để gửi lên backend.
  - Bổ sung các cấu hình Firebase tương ứng vào các file môi trường `.env` và `.env.production`.

### Backend (Bảo mật & Đồng bộ hóa phản hồi API & Sửa đổi Ziwei prompt cũ)
- **Đồng bộ hóa isEmailVerified & isPhoneVerified khi Cập nhật hồ sơ:** Cập nhật hàm `updateProfile` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) để luôn trả về `isEmailVerified` và `isPhoneVerified` trong payload `user` của phản hồi JSON. Việc này giải quyết lỗi frontend bị mất trạng thái xác thực (hiển thị chưa xác thực) sau khi lưu thay đổi thông tin cá nhân.
- **Sửa đổi giải luận Tử Vi:** Sửa lại `buildFollowUpPrompt` trong [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js) và logic parse của `chatZiwei` trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) để loại bỏ hoàn toàn hai thuộc tính `timing` (Ứng kỳ) và `risk` (Cảnh báo), chỉ tập trung trả về câu trả lời trực tiếp `answer` cho đương số dưới dạng Markdown gạch đầu dòng rõ ràng.

### Frontend (Giao diện & Cải tiến Trải nghiệm người dùng)
- **Tự động cuộn đến cảnh báo lỗi (Smooth Scrolling):** Tích hợp hai hiệu ứng `useEffect` tự động cuộn màn hình (`scrollIntoView` mượt mà) đến vị trí của banner thông báo lỗi/thành công khi người dùng bấm Lưu hồ sơ hoặc Đổi mật khẩu trong [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx).
- **Tối ưu hiển thị lỗi xác thực SĐT/Email:** 
  - Khắc phục lỗi ẩn thông báo khi bấm nút "Xác thực" bị lỗi (do form OTP bị đóng làm ẩn luôn dòng lỗi). Đã đưa phần hiển thị `phoneVerificationError` và `verificationError` ra bên ngoài form OTP để luôn hiển thị trực quan ngay dưới thẻ trạng thái.
  - Bổ sung validate định dạng sđt ngay trước khi gọi API OTP trong `handleSendPhoneOtp`.
- **Đồng bộ hóa hiển thị Chat Tử Vi:** Cập nhật [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx) để loại bỏ hoàn toàn thẻ Ứng kỳ/Thời điểm cát lợi và Cảnh báo/Hạn vận cho phân hệ Tử Vi (chỉ giữ lại cho Kinh Dịch).

### Backend (Mô hình & Bảo mật & Tối ưu hóa Prompt cũ)
- **Cập nhật Database Schemas & API SMS:**
  - Thêm các trường `isPhoneVerified`, `phoneOtp`, và `phoneOtpExpires` vào [User.js](file:///t:/Phongthuy/backend/src/models/User.js) và tài liệu [DATABASE.md](file:///t:/Phongthuy/docs/DATABASE.md).
  - Đăng ký route và lập hàm `sendVerificationSms` và `verifyPhone` trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js) và [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js). Hỗ trợ sinh OTP 6 số ngẫu nhiên, ghi logs mô phỏng dịch vụ SMS ra `app.log` và tặng thưởng **+2 credits** sau khi xác thực thành công.
- **Ràng buộc validate 10 chữ số cho SĐT:** Bổ sung regex `/^0[0-9]{9}$/` kiểm tra số điện thoại Việt Nam hợp lệ (đúng 10 số bắt đầu bằng số 0) trong phương thức cập nhật hồ sơ `updateProfile`.
- **Đồng bộ hóa Prompt Tử Vi:** Cập nhật `buildFollowUpPrompt` trong [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js) để yêu cầu AI trả về hai mảng `dos` và `donts` đồng bộ với Bát Tự và Hôn Nhân thay vì `timing`/`risk` của Kinh Dịch.

### Frontend (Giao diện & Cải tiến Trải nghiệm người dùng)
- **Tối ưu hóa định dạng Markdown Gạch đầu dòng:**
  - Định nghĩa các quy tắc CSS `.markdown-content` tùy chỉnh cho các thẻ `ul`, `ol`, `li`, `p` và các thẻ headings `h1`-`h4` trong [index.css](file:///t:/Phongthuy/frontend/src/index.css) để giải quyết triệt để vấn đề Reset CSS của Tailwind làm mất gạch đầu dòng.
  - Thay thế toàn bộ class `prose` bằng `markdown-content` trong [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx) giúp phần luận giải chat hiển thị gạch đầu dòng, thụt lề cực kỳ đẹp và khoa học.
- **Loại bỏ nhãn tiếng Anh "(Dos)" và "(Dont's)":** Việt hóa hoàn toàn các tiêu đề thẻ thành "Khuyên nên làm" và "Tránh làm".
- **Xác thực số điện thoại OTP UI:** 
  - Nâng cấp phần Status Cards trong [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx) thành 3 cột hiển thị: Credits, Trạng thái Email và Trạng thái Điện thoại.
  - Tích hợp OTP popup xác thực số điện thoại và validate format 10 số ngay tại client.
- **Ràng buộc ngày tháng trên Lịch chọn (minDate & maxDate):**
  - Cập nhật signature và thuật toán disable ngày của component `CustomDatePicker` cục bộ trong cả [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx) và [DateSelectionBoard.jsx](file:///t:/Phongthuy/frontend/src/components/DateSelectionBoard.jsx).
  - Đồng bộ truyền `maxDate={endDate}` cho picker "Từ ngày" và `minDate={startDate}` cho picker "Đến ngày", giúp khóa (disable) các ngày không hợp lệ trên giao diện một cách trực quan.
- **Cập nhật Database Schemas:**
  - Cập nhật [User.js](file:///t:/Phongthuy/backend/src/models/User.js) thêm các trường `isEmailVerified` (mặc định `false`), `emailOtp` và `emailOtpExpires` để phục vụ chức năng xác thực email nhận quà tặng.
  - Cập nhật [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js) thêm trường `dos` và `donts` vào `structuredContent` để hỗ trợ lưu trữ các khuyến nghị hành vi riêng biệt cho Bát Tự, Tử Vi và Hôn Nhân.
- **Middleware Phân trừ Credits Chat (`chatCreditCheck`):**
  - Viết mới middleware [chatCreditCheck.js](file:///t:/Phongthuy/backend/src/middleware/chatCreditCheck.js) thực hiện trừ nguyên tử `-0.5` credits trong cơ sở dữ liệu cho mỗi tin nhắn chat của người dùng. Chặn truy cập nếu số dư `< 0.5` credits (trừ Admin/Co-Admin).
  - Tích hợp middleware mới này thay thế `optionalAuth` trên tất cả các route chat follow-up trong [history.js](file:///t:/Phongthuy/backend/src/routes/history.js), [ai.js](file:///t:/Phongthuy/backend/src/routes/ai.js), và [ziwei.js](file:///t:/Phongthuy/backend/src/routes/ziwei.js).
- **API Xác thực Email qua OTP:**
  - Đăng ký route mới `/auth/send-verification-email` và `/auth/verify-email` trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js).
  - Viết 2 hàm điều khiển `sendVerificationEmail` và `verifyEmail` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js): sinh OTP 6 số ngẫu nhiên lưu trong 10 phút, gửi email HTML qua Nodemailer và cộng thưởng **+2 credits** sau khi xác thực OTP thành công.
- **Riêng biệt hóa Prompt chat AI:**
  - Sửa đổi 4 tệp prompt [IChingPrompts.js](file:///t:/Phongthuy/backend/src/services/IChingPrompts.js), [BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js), [ZiweiPrompts.js](file:///t:/Phongthuy/backend/src/services/ZiweiPrompts.js) và [MarriagePrompts.js](file:///t:/Phongthuy/backend/src/services/MarriagePrompts.js).
  - Bắt buộc AI trả về JSON có chứa `dos` (Nên làm) và `donts` (Tránh làm) cho Bát Tự, Tử Vi, Hôn Nhân, thay thế cho `timing`/`risk` của Kinh Dịch.
  - Cảnh báo AI đi thẳng vào câu hỏi thắc mắc mới, trình bày gạch đầu dòng rõ ràng bằng Markdown và tuyệt đối không chào hỏi dài dòng hay lặp lại các lý thuyết cũ của quẻ/lá số.
  - Cập nhật hàm chat tương ứng trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) để parse và lưu các trường mới này.

### Frontend (Giao diện & Trải nghiệm Người dùng)
- **Đồng bộ hóa User Profile & Credits khi tải trang:**
  - Cập nhật [AuthContext.jsx](file:///t:/Phongthuy/frontend/src/context/AuthContext.jsx) để khi ứng dụng khởi chạy hoặc tải lại trang, nếu có token hợp lệ, client sẽ tự động gửi request đến `/api/auth/me` để fetch lại thông tin hồ sơ và số dư credit mới nhất từ cơ sở dữ liệu. Việc này giải quyết triệt để vấn đề lệch credits hiển thị (ví dụ: hiển thị 79 nhưng thực tế trong DB là 80, khiến khi cộng 2 credits do xác thực email xong thì nhảy lên 82).
- **Tích hợp API và Hiển thị Credits:**
  - Khai báo 2 hàm gọi API xác thực mới trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
  - Hiển thị số dư credit hiện tại kèm biểu tượng 🪙 nổi bật trên Header chính của [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx).
- **Sửa lỗi ReferenceError `useContext`:** Bổ sung lại dòng import `React` và các React hooks (`useState`, `useEffect`, `useRef`, `useContext`) bị vô tình xóa mất ở đầu tệp [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx).
- **Nút Thu phóng & Hiển thị Credit ở Khung chat:**
  - Cập nhật [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx) thêm nút mở rộng/thu nhỏ (`Maximize2` / `Minimize2`) giúp thay đổi kích thước khung chat linh hoạt từ `380px` thành `680px` phục vụ đương số đọc luận giải học thuật dễ dàng hơn.
  - Hiển thị số dư credit cùng dòng cảnh báo trừ 🪙 ngay dưới tiêu đề của header khung chat.
  - Tự động trừ cục bộ `-0.5` credits trên state sau mỗi câu chat thành công để cập nhật giao diện ngay lập tức.
  - Render các block thẻ "Nên làm (Dos)" và "Tránh làm (Dont's)" đẹp mắt, có bo góc mềm mại, màu sắc HSL hài hòa cho 3 phân hệ Bát Tự, Tử Vi, Hôn Nhân.
- **OTP Verification UI trong Profile:**
  - Thiết kế thêm thẻ hiển thị thông tin credit và trạng thái xác thực email trong [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx).
  - Tích hợp giao diện nhập mã OTP gồm 6 chữ số có hiệu ứng chuyển động mượt mà, hỗ trợ nút "Xác thực" gửi mã OTP qua email và xác nhận mã để nhận thưởng credits tức thời.
  - Tối ưu hóa hiển thị tức thời: Thay đổi trạng thái hiển thị khung nhập OTP sang trạng thái `true` ngay lập tức khi nhấn nút "Xác thực" (cùng thông báo đang gửi email), cải thiện đáng kể tốc độ phản hồi cảm nhận (perceived performance) của giao diện người dùng.

---

## 📅 Phiên bản: Sửa lỗi Phân quyền Trò chuyện AI (AiChatWidget) (11/07/2026)

### Frontend (Giao diện & Bảo mật Kết nối)
- **Truyền token Authorization trong Trò chuyện AI:**
  - Cập nhật [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx) sử dụng hook `useContext` lấy `AuthContext` để truy xuất mã token JWT của người dùng hiện tại (lấy từ `AuthContext` hoặc làm fallback từ `localStorage` nếu cần).
  - Đính kèm token JWT vào headers (`Authorization: Bearer <token>`) của request `fetch` gọi API stream chat (`/chat`). Việc này giúp backend (thông qua middleware `checkRecordOwnership`) xác minh chính xác danh tính của người dùng sở hữu bản ghi giải đoán tương ứng trước khi cho phép bắt đầu phiên trò chuyện follow-up, sửa triệt để lỗi "Bạn không có quyền truy cập bản ghi này." (mã lỗi `403 Forbidden`).
- **Đồng bộ hóa các API Stream giải đoán:**
  - Cập nhật [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx) kiểm tra sự tồn tại của `token` trước khi truyền header `Authorization` vào request giải đoán của phân hệ Hôn Nhân (tương tự Bazi, IChing, Ziwei). Điều này tránh lỗi backend trả về `401 Unauthorized` đối với khách vãng lai (guest) do gửi token dạng `'Bearer null'` / `'Bearer undefined'`.

---

## 📅 Phiên bản: Bảo mật Quyền riêng tư, Hủy Token khi Đăng xuất & Bộ lọc Thời gian Lịch sử (10/07/2026)

### Backend (Bảo mật & Quyền riêng tư)
- **Bảo mật Quyền sở hữu Bản ghi:**
  - Tạo mới middleware [checkRecordOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkRecordOwnership.js) kiểm tra quyền truy cập của người dùng đối với các bản ghi chi tiết, đánh giá sao, liên kết tài khoản và trò chuyện AI theo ID của 4 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân). Bản ghi của `guest` được cho phép xem công khai, còn bản ghi của người dùng đã đăng ký chỉ cho phép chính chủ sở hữu hoặc tài khoản Admin/Co-Admin truy cập (trả về `403 Forbidden` nếu vi phạm).
  - Tạo mới middleware [checkHistoryOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkHistoryOwnership.js) bảo vệ danh sách lịch sử theo `userId` (chỉ cho phép bản thân user đó hoặc Admin/Co-Admin lấy dữ liệu).
  - Tạo mới middleware [optionalAuth.js](file:///t:/Phongthuy/backend/src/middleware/optionalAuth.js) giải mã JWT token một cách tùy chọn để lấy hồ sơ người dùng mà không chặn các request của khách vãng lai (guest).
  - Áp dụng 3 middleware này trên tất cả các route lịch sử, AI giải đoán và chat trong [history.js](file:///t:/Phongthuy/backend/src/routes/history.js), [ai.js](file:///t:/Phongthuy/backend/src/routes/ai.js), và [ziwei.js](file:///t:/Phongthuy/backend/src/routes/ziwei.js).
- **Hủy bỏ mã Token khi Đăng xuất (Server-side Token Invalidation):**
  - Thêm trường `tokenVersion` (kiểu số nguyên, mặc định là `0`) vào lược đồ [User.js](file:///t:/Phongthuy/backend/src/models/User.js).
  - Cập nhật [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) để đưa `tokenVersion` vào payload của JWT token khi Đăng ký, Đăng nhập thường và Đăng nhập bằng Google.
  - Viết mới API `/api/auth/logout` tăng `tokenVersion` của User trong Database thêm 1 đơn vị, vô hiệu hóa ngay lập tức mọi token đã được cấp trước đó của người dùng.
  - Cập nhật middleware xác thực [auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js) để so khớp `tokenVersion` trong token gửi lên với giá trị hiện tại trong Database. Trả về `401 Unauthorized` nếu không trùng khớp (ép đăng xuất trên client).
- **Lọc Lịch sử theo Thời gian ở Backend:**
  - Cập nhật 4 phương thức lấy lịch sử trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) hỗ trợ tham số query `startDate` và `endDate`.
  - Thực hiện lọc trực tiếp trên MongoDB Atlas thông qua điều kiện `$gte` và `$lte` trên trường `createdAt` (hoặc `dateCast` đối với Kinh Dịch).
  - Đồng bộ cập nhật cache key để chứa các khoảng ngày lọc, ngăn chặn việc lấy sai dữ liệu từ in-memory cache.

### Frontend (Giao diện & Đồng bộ)
- **Tích hợp Logout Server-side:**
  - Cập nhật hàm `logout` trong [AuthContext.jsx](file:///t:/Phongthuy/frontend/src/context/AuthContext.jsx) gửi yêu cầu `POST /api/auth/logout` trước khi xóa thông tin cục bộ nhằm vô hiệu hóa token trên máy chủ hoàn toàn.
- **Bộ lọc Lịch sử theo Ngày tháng & Custom Datepicker (React):**
  - Cập nhật [api.js](file:///t:/Phongthuy/frontend/src/services/api.js) để hỗ trợ truyền tham số params (startDate, endDate) cho 4 hàm gọi lịch sử.
  - Tự xây dựng component **`CustomDatePicker`** thay thế hoàn toàn cho input date mặc định của trình duyệt để hiển thị popup lịch chọn ngày (date picker calendar popup) cực kỳ mềm mại, bo tròn, đồng bộ màu sắc động theo Tab theme, có nút chuyển tháng bằng ChevronLeft/ChevronRight mượt mà.
  - Thiết kế thanh điều khiển Lọc theo ngày lập ở phía dưới Tab selector trong [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx) sử dụng component lịch mới này.
  - Bổ sung cụm phím tắt chọn nhanh (Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua) tiện lợi với thuật toán tính toán ngày theo múi giờ địa phương (local time) tránh bị lệch ngày do múi giờ UTC.
  - Tối ưu bố cục phân bổ các khối điều khiển (Lọc nhanh bên trái, Chọn ngày & Đặt lại bên phải) trên cùng một hàng ngang để triệt tiêu các khoảng trống dư thừa, tự động co giãn và xuống hàng linh hoạt trên Mobile.
  - Tích hợp trạng thái Active sáng lên đồng bộ theo Tab theme (Amber, Blue, Purple, Rose) cho các nút lọc nhanh khi được kích hoạt, tự động tắt khi người dùng tùy chọn ngày thủ công hoặc bấm Đặt lại.
  - Khi thay đổi ngày lọc, ứng dụng tự động fetch lại danh sách từ server theo ngày lập thực tế và reset số trang phân loại về trang `1`.

---

## 📅 Phiên bản: Tích hợp Thử nghiệm API với Swagger UI & Postman Collection (09/07/2026)

### Backend (Định cấu hình & Route mới)
- **Tích hợp Swagger UI:**
  - Cài đặt thư viện `swagger-ui-express` để dựng giao diện tài liệu API trực quan.
  - Tạo tệp tin đặc tả OpenAPI 3.0 [swagger.json](file:///t:/Phongthuy/backend/src/config/swagger.json) mô tả chi tiết toàn bộ các endpoints của hệ thống bao gồm: Các tham số, cấu trúc Body, Headers và dữ liệu mẫu đầy đủ để hỗ trợ test nhanh (như lập quẻ, lập lá số Bát Tự, Tử Vi, Trạch Cát).
  - Tích hợp route `/api-docs` vào [index.js](file:///t:/Phongthuy/backend/src/index.js) để phục vụ giao diện Swagger UI khi ứng dụng khởi chạy.
- **Kiểm tra cú pháp:** Đã chạy lệnh `node --check src/index.js` và xác minh mã nguồn hoạt động chính xác.

### Tài liệu & Công cụ Kiểm thử
- **Tạo Postman Collection:**
  - Viết tệp cấu hình Postman [PhongThuy_API.postman_collection.json](file:///t:/Phongthuy/docs/PhongThuy_API.postman_collection.json) bao gồm đầy đủ 7 thư mục tương ứng với các phân hệ chính của hệ thống.
  - Cấu hình sẵn dữ liệu mẫu thực tế trong phần request body cho mọi API.
  - Tích hợp **Test Scripts** tự động lưu token JWT và `userId` vào Collection Variables sau khi gọi Đăng nhập/Đăng ký để tự động điền cho các API tiếp theo, đồng thời tự động lưu `recordId` sau khi gieo quẻ/lập lá số để chat AI liền mạch.
- **Cập nhật [API.md](file:///t:/Phongthuy/docs/API.md):** Bổ sung mục `🚀 Hướng dẫn Kiểm thử & Thử nghiệm API (Testing Guides)` hướng dẫn chi tiết cách truy cập Swagger UI cục bộ tại `/api-docs` và cách import, vận hành file Postman Collection.

---

## 📅 Phiên bản: Bổ sung Footer & Phân trang Lịch sử (06/07/2026)

### Frontend (Giao diện & Tính năng)
- **Bổ sung Footer toàn trang:** Thiết kế và thêm chân trang **Footer** ở cuối [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) chứa Logo chữ 'PT' cách điệu, thông tin Email (`trinhtuyen270804@gmail.com`), SĐT Zalo (`0868960506`) cùng liên kết chuyển đổi phân hệ trang trí. Footer hiển thị ở tất cả các tab người dùng, bao gồm cả Lịch sử.
- **Phân trang Lịch sử 15 bản ghi:** Tích hợp logic phân trang client-side tại [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx), giới hạn hiển thị tối đa 15 bản ghi/trang cho cả 4 phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân). Thêm bộ điều hướng Pagination Controls trực quan, tự động chuyển màu theo từng chủ đề của Tab, đồng thời tự động cuộn lên đầu trang mượt mà (`window.scrollTo`) khi thay đổi trang.

---

## 📅 Phiên bản: Tự động hóa Backup & Đồng bộ Google Drive qua Cronjob (06/07/2026)

### 1. Phân tích & Kiến trúc Vận hành
- Nghiên cứu hiện trạng dự án, so sánh 3 giải pháp tự động hóa tác vụ backup MongoDB Atlas và đồng bộ Google Drive:
  1. Host-level Cronjob (Độc lập, tối ưu tài nguyên, an toàn cao).
  2. Application-level Scheduler (Tích hợp trong backend Node.js, rủi ro bảo mật leo thang đặc quyền khi phải mount Docker Socket).
  3. Docker Sidecar Container (Ofelia scheduler, đóng gói hạ tầng tốt).
- Thống nhất chọn **Giải pháp 1 (Host-level Cronjob)** để tối ưu bảo mật, tận dụng các shell script sẵn có và đảm bảo tính cô lập tuyệt đối của web server.

### 2. Cập nhật Tài liệu & Hướng dẫn Vận hành
- **Tạo tài liệu hướng dẫn mới:** Viết tệp hướng dẫn setup chi tiết [setup_cronjob_guide.md](file:///C:/Users/cobat/.gemini/antigravity/brain/59c2d2c2-da08-45fc-bd4d-da5722a00d82/setup_cronjob_guide.md) chỉ dẫn cài đặt crontab, kiểm tra múi giờ, phân quyền chạy docker cho user non-root, debug log và tích hợp cảnh báo qua Telegram Webhook.
- **Cập nhật [README.md](file:///t:/Phongthuy/README.md):** Thêm phần `## 💾 4. Hệ thống Sao lưu & Đồng bộ Google Drive Tự động` mô tả chức năng của các script backup và các bước cấu hình cronjob chạy lúc 00:00 hàng ngày.
- **Cập nhật [docs/ARCHITECTURE.md](file:///t:/Phongthuy/docs/ARCHITECTURE.md):** Thêm phần `## 5. Cơ chế Sao lưu & Đồng bộ Google Drive (Backup System)` tích hợp biểu đồ luồng hoạt động bằng Mermaid và phân tích lợi ích thiết kế kiến trúc cô lập tiến trình.

---

## 📅 Phiên bản: Việt hóa Lỗi Đăng Nhập & Cập nhật Default Credits (06/07/2026)

### 1. Hệ thống Đăng nhập (Trải nghiệm Người dùng)
- **Backend:** Cập nhật [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) để trả về `'Tài khoản hoặc mật khẩu không đúng'` thay vì `'Invalid Credentials'` khi sai thông tin đăng nhập.
- **Frontend:** Cập nhật [AuthModal.jsx](file:///t:/Phongthuy/frontend/src/components/AuthModal.jsx) dịch lỗi từ `'Invalid Credentials'` sang tiếng Việt giúp giao diện đồng bộ hơn.

### 2. Quản lý Credit
- **Cập nhật Default Credits khi đăng ký:** Thay đổi số lượng credit khởi tạo mặc định cho người dùng mới từ `1` thành `2` ở cả API đăng ký thường, Google đăng ký và kích hoạt lại tài khoản trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) cũng như Schema mặc định trong [User.js](file:///t:/Phongthuy/backend/src/models/User.js).

---

## 📅 Phiên bản: Ẩn Tính Năng Hỏi Thêm Thầy Khi Người Dùng Đăng Xuất (05/07/2026)

### Frontend (Bảo mật & Tối ưu hóa Token)
- **Ẩn nút chat follow-up và chat widget khi logout:**
  - Cập nhật [BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx): Nút "Hỏi Thêm Thầy" và `AiChatWidget` chỉ hiển thị khi `user` tồn tại trong `AuthContext`.
  - Cập nhật [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx): Đồng bộ `user` từ `AuthContext` thông qua `activeUser` và chỉ render nút "Hỏi Thêm Thầy" cũng như `AiChatWidget` khi đã đăng nhập.
  - Cập nhật [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx): Nút "Hỏi Đáp AI" và `AiChatWidget` chỉ hiển thị khi `user` tồn tại.
  - Cập nhật [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx): Điều chỉnh nút "Hỏi Thêm Thầy" và `AiChatWidget` chỉ hiển thị khi `activeUser` đã đăng nhập (thay vì cho phép bấm rồi mở form đăng nhập), ngăn chặn triệt để hành vi spam API chat sau khi đăng xuất.

---

## 📅 Phiên bản: Docker hóa Frontend & Tái cấu trúc Đa Container (05/07/2026)

### 1. Frontend (Cấu hình Container hóa)
- **Tạo Dockerfile cho Frontend:**
  - Thiết kế quy trình Multi-stage build: Giai đoạn 1 biên dịch React/Vite bằng Node 20; Giai đoạn 2 phục vụ các tệp giao diện tĩnh bằng image nhẹ `nginx:alpine`.
  - Hỗ trợ truyền biến môi trường thông qua ARG (`VITE_API_URL` mặc định là `/api` và `VITE_GOOGLE_CLIENT_ID`).
- **Tạo .dockerignore cho Frontend:** Bỏ qua `node_modules`, `dist` và các tệp cấu hình docker cục bộ để tăng tốc độ build image.
- **Tạo cấu hình `nginx.conf` cho Frontend:** Thiết lập khối server lắng nghe trên cổng `80` và cấu hình `try_files $uri $uri/ /index.html` nhằm giải quyết triệt để lỗi 404 khi người dùng tải lại trang (SPA Router fallback).

### 2. Định tuyến Nginx Gateway
- **Cập nhật `nginx/default.conf` ở gốc:**
  - Phân chia định tuyến: Chuyển tiếp `/api` và `/health` sang container backend (`http://backend:3001`).
  - Chuyển tiếp tất cả các đường dẫn giao diện còn lại `/` sang container frontend (`http://frontend:80`).
  - Giữ nguyên tối ưu hóa SSE cho các luồng xử lý AI.

### 3. Docker Compose (Hợp nhất Đa Container)
- **Cập nhật `docker-compose.yml` ở gốc:**
  - Bổ sung service `frontend` build trực tiếp từ `./frontend`.
  - Cập nhật dependency của service `nginx` thành `depends_on` cả `backend` và `frontend`.

### 4. Cập nhật Tài liệu
- **Cập nhật README.md & DEVELOPMENT_GUIDE.md:** Cập nhật hướng dẫn chạy trọn gói cả 2 phân hệ Frontend và Backend bằng Docker Compose và truy cập qua cổng 80 của Nginx.

---

## 📅 Phiên bản: Docker hóa Backend & Thiết lập Nginx cho AWS VM (04/07/2026)

### 1. Backend (Cấu hình Container hóa)
- **Tạo Dockerfile cho Backend:**
  - Sử dụng base image `node:20-slim` để giảm dung lượng image và tương thích sẵn với binary của thư viện native `bcrypt`.
  - Thực hiện cài đặt dependency bằng `npm ci --omit=dev` để loại bỏ các thư viện phát triển (devDependencies).
  - Khai báo mở cổng `3001` và chạy ứng dụng thông qua `node src/index.js`.
- **Tạo .dockerignore cho Backend:** Loại trừ các file cục bộ không cần thiết như `node_modules`, `logs`, `.env` giúp tối ưu hóa dung lượng build context truyền lên Docker daemon.

### 2. Nginx (Cấu hình Reverse Proxy & SSE Stream)
- **Tạo thư mục `nginx` và cấu hình `default.conf`:**
  - Thiết lập Nginx lắng nghe ở cổng `80` của máy host.
  - Chuyển tiếp các yêu cầu client đến `http://backend:3001` thông qua mạng ảo Docker.
  - Tích hợp cấu hình đặc biệt cho **Server-Sent Events (SSE)**: Tắt bộ đệm (`proxy_buffering off;`), tắt cache (`proxy_cache off;`) và mở rộng thời gian chờ (`proxy_read_timeout 86400s;`) nhằm đảm bảo luồng giải đoán từ Gemini AI không bị chặn đệm hay ngắt kết nối giữa chừng.

### 3. Docker Compose (Điều phối dịch vụ AWS)
- **Tạo `docker-compose.yml` tại thư mục gốc:**
  - Định nghĩa dịch vụ `backend` tự động build từ thư mục `./backend` và nạp các biến môi trường trực tiếp từ tệp `.env` hiện tại để kết nối với cơ sở dữ liệu MongoDB Atlas của dự án.
  - Định nghĩa dịch vụ `nginx` chạy image `nginx:alpine`, ánh xạ cổng `80:80` ra ngoài máy ảo AWS, mount tệp cấu hình `nginx/default.conf` và liên kết phụ thuộc `depends_on` với `backend`.

### 4. Cập nhật Tài liệu
- **Cập nhật README.md:** Bổ sung hướng dẫn ngắn gọn cách khởi động toàn bộ cụm backend và Nginx chỉ bằng một lệnh docker compose.
- **Cập nhật DEVELOPMENT_GUIDE.md:** Bổ sung hướng dẫn chi tiết cách cấu hình cổng Security Group AWS, kiểm tra Logs và chạy thử health-check qua Nginx proxy.

---

## 📅 Phiên bản: Bổ sung Phân Hệ Xem Ngày & Tư Vấn Ngày Hoàng Đạo (03/07/2026)

### 1. Backend (Thuật toán Trạch cát & Router)
- **Xây dựng DateService.js:**
  - Tích hợp công cụ chuyển đổi Dương lịch sang Âm lịch dựa trên `lunar-javascript`.
  - Phân tích tương sinh/khắc can chi tuổi người dùng (**Lục Xung, Lục Hại, Thiên Can khắc, Nạp Âm khắc**).
  - Tích hợp đánh giá hệ thống **Thập Nhị Thần Hoàng Đạo/Hắc Đạo** (12 vị thần) và **Thập Nhị Kiến Trừ** (12 Trực) cho từng nhóm việc (Đại sự, Khởi nghiệp, Xây dựng).
  - Thiết kế thang điểm đánh giá chi tiết chia thành **4 cấp độ**: **Rất tốt**, **Nên**, **Không nên**, **Không được**.
  - Tính toán và đề xuất dải giờ hoàng đạo cát lợi cùng ngày không xung khắc với tuổi.
- **Xây dựng DateController.js:** Expose hai API endpoints: `/api/date/check` (xem một ngày) và `/api/date/consult` (tư vấn ngày tốt trong khoảng thời gian). Các API này chạy hoàn toàn trên bộ nhớ (in-memory) và không ghi dữ liệu vào database.
- **Đăng ký Route:** Liên kết các endpoints mới trong [routes/index.js](file:///t:/Phongthuy/backend/src/routes/index.js).

### 2. Frontend (Giao diện người dùng)
- **Tích hợp API endpoints:** Khai báo hàm `checkAuspiciousDate` và `consultAuspiciousDates` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
- **Xây dựng component DateSelectionBoard.jsx:**
  - Tạo giao diện 2 sub-tabs chuyển đổi: "Xem ngày cụ thể" và "Tư vấn ngày hoàng đạo".
  - Hiển thị kết quả trực quan bằng màu sắc và huy hiệu (Badge) tương ứng với 4 cấp độ đánh giá.
  - Hỗ trợ lưu trữ tự động các lựa chọn năm sinh và công việc vào `localStorage` để đồng bộ giữa hai tab.
  - Cung cấp nút chuyển đổi nhanh (CTA) tự động pre-fill năm sinh và công việc khi chuyển từ Xem ngày sang Tư vấn ngày.
- **Bổ sung tab Xem Ngày:** Tích hợp liên kết điều hướng mượt mà, hỗ trợ Lazy Loading trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx).

### 3. Cập nhật Tài liệu
- Cập nhật đặc tả chi tiết API trong [API.md](file:///t:/Phongthuy/docs/API.md).

---

## 📅 Phiên bản: Tích hợp Nén HTTP Compression toàn cục (02/07/2026)

### Backend (Mã hóa & Truyền tải)
- **Tích hợp nén HTTP Compression:** 
  - Đã thêm dependency `"compression": "^1.7.5"` trong [package.json](file:///t:/Phongthuy/backend/package.json).
  - Cấu hình sử dụng middleware `compression` toàn cục trong [index.js](file:///t:/Phongthuy/backend/src/index.js) để nén tự động dữ liệu các API của Admin Dashboard, Lịch sử người dùng, và Chi tiết lá số/quẻ dịch.
  - Tích hợp **Bộ lọc thông minh (SSE Bypass Filter)** kiểm tra các yêu cầu hoặc phản hồi định dạng `text/event-stream` để loại trừ không nén, tránh lỗi đệm (buffering) dòng stream in chữ thời gian thực của AI Chatbot.

---

## 📅 Phiên bản: Khắc phục Rò rỉ Lịch sử & Tối ưu hóa Tốc độ Đăng nhập (02/07/2026)

### 1. Frontend (Giao diện & Bảo mật)
- **Khắc phục lỗi rò rỉ lịch sử khi đổi tài khoản:** 
  - Bổ sung `useEffect` giám sát thay đổi của ID tài khoản (`user?.id` / `user?._id`) trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) để tự động reset state cache danh sách lịch sử `preloadedHistory` về `null`.
  - Bổ sung `useEffect` dọn dẹp sạch cache chi tiết hào quẻ `prefetchedDetails.current` trong [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx) khi thay đổi `user`.
- **Tối ưu hóa đăng nhập không chặn UI:** Loại bỏ `async/await` chặn tuần tự trong hàm `handleLoginSuccess` tại [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) và chuyển sang thực thi song song/chạy nền bằng `Promise.all`. Giúp đóng Modal đăng nhập và cập nhật trạng thái UI ngay lập tức.

### 2. Backend (Mã hóa & Hiệu năng)
- **Nâng cấp mã hóa mật khẩu bằng Native Bcrypt:** Thay thế gói `"bcryptjs"` (Pure JS chậm chạp) bằng gói `"bcrypt"` native biên dịch sang mã máy C++ trong [package.json](file:///t:/Phongthuy/backend/package.json) và cập nhật mã nguồn ở [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js) cùng [test_all_cases.js](file:///t:/Phongthuy/backend/src/scripts/test_all_cases.js). Giúp tăng tốc so khớp mật khẩu và ngăn nghẽn luồng Node.js Event Loop.

---

## 📅 Phiên bản: Tối ưu hóa Trải nghiệm Tải trang Lịch sử (02/07/2026)

### 1. Frontend (Giao diện & Trải nghiệm Người dùng)
- **Loại bỏ màn hình load kép:** Thay thế cơ chế tải động (Lazy Loading) của component `HistoryBoard` thành Import tĩnh (Static Import) trực tiếp trong [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) và loại bỏ component bọc `<React.Suspense>`. Giúp triệt tiêu màn hình loading thô đầu tiên khi bấm vào tab Lịch sử.
- **Hỗ trợ Keep-Alive chống reload thừa:** Thay đổi cơ chế render của `HistoryBoard` từ dựng lại hoàn toàn (conditional rendering `{appMode === 'history' && ...}`) sang ẩn/hiện bằng CSS classes (`block` / `hidden`). Component sẽ được giữ lại trong bộ nhớ DOM, không bị hủy/tái khởi tạo khi chuyển đổi giữa các tab.
- **Tải dữ liệu tức thì (Zero-flicker loading):** Khởi tạo trạng thái `loading` dựa vào dữ liệu đã preload trước đó. Khi chuyển tab qua lại mà dữ liệu không đổi, trang Lịch sử sẽ hiện ngay lập tức mà không có bất kỳ hiện tượng nhấp nháy hay phải nạp lại dữ liệu từ đầu.
- **Nâng cấp giao diện Loading tinh giản (Chỉ xoay tròn):** Lược bỏ toàn bộ các phần text thô như `"Đang nạp nhật ký lịch sử..."`, `"Vui lòng chờ..."` và `"Đang nạp chi tiết..."`, chỉ hiển thị một biểu tượng spinner xoay (`Loader2` từ `lucide-react`) tinh tế trên nền hiệu ứng xung ánh sáng vàng nhạt (`bg-amber-50 animate-pulse`) đồng bộ với tông màu Kinh Dịch.

### 2. Backend (Tối ưu hóa Truy vấn & Hiệu năng)
- **Tối ưu hóa API danh sách Lịch sử Kinh Dịch:** Cập nhật hàm `getHexagramHistory` trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js):
  - Loại bỏ hoàn toàn vòng lặp CPU-heavy gọi hàm `IChingDataService.parseLines` để tái thiết các hào quẻ, can chi chi tiết cho từng bản ghi trong danh sách (do thông tin này không dùng ở chế độ hiển thị danh sách, mà chỉ tải riêng khi bấm "Xem chi tiết").
  - Thêm loại trừ trường `-ungKy` (danh sách thông báo Ứng Kỳ) và `-movingLines` (danh sách hào động) khỏi kết quả truy vấn MongoDB để giảm kích thước payload truyền qua mạng.

---

## 📅 Phiên bản: Tối ưu hóa Đăng ký, Lịch sử và Modal Đăng ký (02/07/2026)

### 1. Backend (Logic & Hiệu năng)
- **Cho phép đăng ký lại tài khoản bị xóa mềm:** Cập nhật hàm `register` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js). Nếu phát hiện email đăng ký thuộc về một tài khoản đã bị xóa mềm (`isDeleted === true`), hệ thống sẽ thực hiện kích hoạt lại (reactivate) tài khoản đó bằng mật khẩu băm mới, thông tin mới, đặt lại credits = 1, lockReason = '' và reset lại `stats` của tài khoản này.
- **Tối ưu hóa hiệu năng list Lịch sử Tử Vi:** Cập nhật hàm `getZiweiHistory` trong [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js). Thay đổi `.select('-chartData.palaces -analysisSnapshot')` thành `.select('-chartData -analysisSnapshot -aiInterpretation')` để loại bỏ các trường dữ liệu đồ hình mệnh bàn thô nặng và văn bản giải luận AI dài khỏi danh sách lịch sử (chỉ tải khi vào trang chi tiết).

### 2. Frontend (Giao diện)
- **Tối ưu hóa Modal Đăng ký chống tràn layout:** Cập nhật [AuthModal.jsx](file:///t:/Phongthuy/frontend/src/components/AuthModal.jsx). Thêm CSS giới hạn chiều cao `max-h-[90vh]` và cho phép cuộn dọc nội bộ `overflow-y-auto` cho khung modal chính. Giúp người dùng cuộn mượt mà để nhập Mật khẩu / bấm Submit khi form Bát Tự được mở rộng trên các thiết bị di động hoặc màn hình nhỏ.

---

## 📅 Phiên bản: Bổ sung tính năng Đổi Mật Khẩu (02/07/2026)

### 1. Backend (Xây dựng API đổi mật khẩu bảo mật)
- Bổ sung phương thức `changePassword` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js):
  - Nhận `currentPassword` và `newPassword` từ request body.
  - Sử dụng `bcrypt.compare` đối chiếu mật khẩu hiện tại với mật khẩu băm trong database.
  - Kiểm tra độ dài mật khẩu mới (tối thiểu 8 ký tự theo yêu cầu).
  - Băm mật khẩu mới và lưu vào cơ sở dữ liệu.
- Đăng ký Endpoint `PUT /api/auth/change-password` đi kèm với middleware `auth` xác thực trong [auth.js](file:///t:/Phongthuy/backend/src/routes/auth.js).

### 2. Frontend (Giao diện đổi mật khẩu)
- Khai báo API service `changePassword` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
- Thiết kế form độc lập **Thay Đổi Mật Khẩu** tích hợp trực tiếp vào [ProfileBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ProfileBoard.jsx).
- Ràng buộc kiểm tra (Validation) mật khẩu mới tối thiểu 8 ký tự, so khớp hai lần nhập và ngăn không cho trùng mật khẩu hiện tại.
- Xử lý trạng thái loading và hiển thị thông báo phản hồi (thành công/lỗi) trực quan.

### 3. Cập nhật Tài liệu
- Cập nhật đặc tả chi tiết API trong [API.md](file:///t:/Phongthuy/docs/API.md) và [README.md](file:///t:/Phongthuy/README.md).

---

## 📅 Phiên bản: Đồng bộ hóa & Hoàn thiện Tài liệu Hệ thống (02/07/2026)

### 1. Cập nhật thiết kế Cơ sở Dữ liệu (`DATABASE.md`)
- Bổ sung cấu trúc Schema và chỉ mục (Indexes) chi tiết cho các bảng hỗ trợ Quản trị & Hệ thống bao gồm: `systemlogs` (`SystemLog.js`), `adminnotifications` (`AdminNotification.js`), `notifications` (`Notification.js`), và `banappeals` (`BanAppeal.js`) để đảm bảo tài liệu phản ánh chính xác 100% thuộc tính trường trong code.

### 2. Bổ sung đặc tả các Endpoint còn thiếu (`API.md`)
- Đặc tả API Tra cứu khái niệm học thuật: `GET /api/concept/:term` (sử dụng trong hiển thị Tooltip).
- Đặc tả API Thông báo cho người dùng cuối:
  - `GET /api/notifications`: Lấy danh sách thông báo nhắc nhở Ứng Kỳ.
  - `PUT /api/notifications/read-all`: Đánh dấu đọc tất cả thông báo.
  - `PUT /api/notifications/:id/read`: Đánh dấu đọc một thông báo cụ thể.

### 3. Đồng bộ sơ đồ và mô tả Kiến trúc (`ARCHITECTURE.md`)
- Cập nhật sơ đồ Mermaid của phân hệ Frontend: Bổ sung các component con (`CoinToss`, `MaiHoaInput`, `ManualInput`, `BaziInput`, `MarriageInput`, `ZiweiChart`, `Tooltip`, `SectionRenderer`) và các Modal/Bell (`NotificationBell`, `AuthModal`, `UpdateBaziModal`, `ProfileBoard`).
- Cập nhật sơ đồ Mermaid của phân hệ Backend: Bổ sung `ConceptController`, `NotificationController` và các Service/Cache/Validator hỗ trợ (`ConversationContextService`, `EmailService`, `IChingDataService`, `LoggerService`, `MemoryCacheService`, `UserStatsService`, `ZiweiCache`, `ZiweiValidators`).

### 4. Thiết lập Quy sách Cập nhật Tài liệu & Sửa đổi Tổng quan (`AGENTS.md` & `README.md`)
- Cập nhật [AGENTS.md](file:///t:/Phongthuy/AGENTS.md): Bổ sung quy định bắt buộc phải cập nhật [README.md](file:///t:/Phongthuy/README.md) khi có thay đổi liên quan đến cấu trúc cài đặt, khởi chạy hoặc tính năng tổng quan, đồng thời thiết lập tiêu chuẩn hoàn thành tác vụ (Definition of Done).
- Cập nhật [README.md](file:///t:/Phongthuy/README.md) khớp với code thực tế:
  - Gỡ bỏ hoàn toàn các mô tả về dịch vụ legacy `JobQueueService.js` và endpoint `GET /api/ziwei/jobs/:jobId` đã bị xóa.
  - Sửa đổi mô tả giải luận AI Tử Vi chuyển từ Polling sang luồng SSE Stream trực tiếp.
  - Khắc phục biến môi trường sai từ `MONGO_URI` thành `MONGODB_URI` trong tệp cấu hình mẫu.
  - Bổ sung đặc tả các API mới cho Concept và Notifications.

---

## 📅 Phiên bản: Tái Cấu Trúc Toàn Diện & Chuẩn Hóa Tiếng Anh

### 1. Chuẩn hóa thuật ngữ & Rename mã nguồn
Đồng nhất 100% tên tệp, tên biến, router và cơ sở dữ liệu sang tiếng Anh chuẩn để dễ tích hợp quốc tế.
- **Kinh Dịch:** Chuyển đổi tên gọi trong toàn bộ mã nguồn từ `Divination`, `Hexagram`, `Kinhdich` sang **`IChing`**.
  - Rename model và collection MongoDB: `HexagramRecord` -> [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js) (`ichingrecords`).
  - Rename component Frontend: `DivinationBoard.jsx` -> [IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx).
- **Tử Vi:** Chuyển đổi toàn bộ tên gọi từ `TuVi` sang **`Ziwei`**.
  - Rename model và collection MongoDB: `TuViRecord` -> [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js) (`ziweirecords`).
  - Rename component Frontend: `TuViBoard.jsx` -> [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx), `TuViChart.jsx` -> [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiChart.jsx).
- **Lưu ý:** Bảo toàn nguyên văn thuật ngữ `ungKy` (Ứng Kỳ) và `MaiHoa` (Mai Hoa Dịch Số) theo phản hồi người dùng.

### 2. Hợp nhất Lược đồ Chat (Generic Chat System)
- Xóa bỏ hoàn toàn 6 collection chat riêng biệt cũ (`HexagramConversation`, `HexagramMessage`, `BaziConversation`, `BaziMessage`, `TuViConversation`, `TuViMessage`).
- Thiết kế mới 2 bảng dùng chung cho cả 4 phân hệ:
  - [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js): Phân tách ngữ cảnh qua trường `system` (`'iching' | 'bazi' | 'ziwei' | 'marriage'`).
  - [Message.js](file:///t:/Phongthuy/backend/src/models/Message.js): Chứa nội dung text và trường `structuredContent` lưu kết quả phân tích cấu trúc từ AI.

### 3. Tái thiết kế Controllers & Services Core
- **Gộp Controller giải đoán AI:** Viết mới [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) tích hợp cơ chế stream SSE và trò chuyện hỏi đáp sâu cho cả 3 môn học thuật (Kinh Dịch, Bát Tự, Tử Vi) và xem tuổi Kết Hôn.
- **Gộp Controller Lịch sử:** Viết mới [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js) hợp nhất logic lấy danh sách lịch sử, xếp hạng đánh giá và liên kết tài khoản cho tất cả các phân hệ.
- **Tách biệt Prompts chuyên môn:** Tách tệp `PromptTemplateManager.js` cũ thành các tệp prompt tiếng Anh tối ưu hóa riêng biệt cho AI: `IChingPrompts.js`, `BaziPrompts.js`, `ZiweiPrompts.js` và `MarriagePrompts.js`.

---

## 📅 Phiên bản: Bổ sung Phân Hệ Hợp Hôn & Trang Quản Trị Admin

### 1. Phân hệ Xem tuổi Hợp Hôn (Marriage Compatibility)
- **Backend:** Xây dựng [MarriageController.js](file:///t:/Phongthuy/backend/src/controllers/MarriageController.js) và [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js) thực hiện tính toán độ tương sinh của ngũ hành bản mệnh, so khớp cung phi bát trạch và tích hợp prompt giải đoán AI.
- **Frontend:** Thiết kế giao diện nhập ngày giờ sinh kép [MarriageInput.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageInput.jsx) và bảng hiển thị phân tích độ hợp hợp [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx).

### 2. Giao diện Quản trị & Hệ thống Giám sát (Admin Dashboard)
- **Backend:**
  - Viết mới [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js) phục vụ các endpoints quản trị: lấy danh sách user, khóa tài khoản, cộng trừ credit, quản lý khiếu nại.
  - Tích hợp route `/events` trong [admin.js](file:///t:/Phongthuy/backend/src/routes/admin.js) để phát các sự kiện hệ thống thời gian thực tới Admin Dashboard qua SSE.
- **Frontend:**
  - Viết mới [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx) chứa đầy đủ biểu đồ Recharts, bộ lọc tìm kiếm bản ghi, giao diện nạp credit và xử lý khiếu nại của người dùng.
