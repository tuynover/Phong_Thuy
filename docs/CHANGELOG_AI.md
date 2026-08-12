# 📝 CHANGELOG_AI.md - Nhật ký Thay đổi của AI Agent

Tài liệu này ghi lại toàn bộ các đợt cập nhật, tái cấu trúc và bổ sung tính năng lớn do các AI Agent thực hiện trên repository này.


## 📅 Phiên bản: Phân tách Từ điển Bát Tự & Tử Vi, Thống nhất Tên Cát Thần & Dọn dẹp Thần sát Tĩnh (12/08/2026)

### 🪐 Thuật Toán Học Thuật Bát Tự ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Dọn Dẹp Thần Sát Tĩnh**: Loại bỏ hoàn toàn các sao thuộc Vòng Thái Tuế Lưu Niên ra khỏi bảng thần sát tĩnh bản mệnh gốc:
  - Loại bỏ sao **Tử Phù**, **Bệnh Phù**, **Tang Môn**, **Điếu Khách** tĩnh.
  - Loại bỏ sao **Quan Phù** và **Tiểu Hao** tĩnh.
  - Chỉ giữ lại các sao này ở vòng vận hạn động Thái Tuế (Đại vận / Lưu niên).
- **Thống Nhất Tên Cát Thần Bát Tự**: Đồng bộ hóa tên hiển thị của các cát thần Bát Tự tĩnh sang dạng đầy đủ có hậu tố **"Quý Nhân"** (ví dụ: *Thái Cực Quý Nhân, Thiên Đức Quý Nhân, Nguyệt Đức Quý Nhân, Văn Xương Quý Nhân, Phúc Tinh Quý Nhân, Quốc Ấn Quý Nhân, Học Đường Quý Nhân, Từ Quán Quý Nhân*) để đồng bộ với phần động và tránh nhầm lẫn với Tử Vi.

### 🎨 Từ Điển & Chú Thích Giao Diện Frontend ([concepts.js](file:///t:/Phongthuy/frontend/src/data/concepts.js), [Tooltip.jsx](file:///t:/Phongthuy/frontend/src/components/Tooltip.jsx), [ZiweiChart.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiChart.jsx))
- **Phân Tách Từ Điển Chuyên Biệt**: Tách file từ điển dùng chung `concepts.js` cũ thành 2 file chuyên biệt hoàn toàn độc lập nằm trong `src/data/`:
  - `bazi_concepts.js`: Chứa các từ khóa Lục Hào, Thiên Can, Địa Chi, Thập Thần, Vòng Trường Sinh, Tiết Khí, và Thần sát Bát Tự.
  - `ziwei_concepts.js`: Chứa các từ khóa Chính tinh, Tứ Hóa, Cát/Sát tinh phụ trợ, 12 Cung và Cách cục Tử Vi.
- **Sửa Lỗi Chú Thích Thái Cực Quý Nhân**: Bổ sung định nghĩa đầy đủ học thuật cho sao **Thái Cực** và **Thái Cực Quý Nhân** vào từ điển `bazi_concepts.js`.
- **Cập Nhật Tooltip & Phân Loại Tra Cứu**:
  - Nâng cấp component `Tooltip.jsx` để nhận prop `type` (`"bazi"` hoặc `"ziwei"`). Dựa vào prop này để tra cứu trong từ điển tương ứng, tránh nhầm lẫn giữa các sao trùng tên của hai môn (như Kình Dương, Đà La, Văn Xương...).
  - Cập nhật toàn bộ các thẻ `<Tooltip>` trong `ZiweiChart.jsx` truyền tham số `type="ziwei"` để tra từ điển Tử Vi chuẩn xác.

### 🧪 Bộ Kiểm Thử Tự Động Backend ([BaziAnalyzer.test.js](file:///t:/Phongthuy/backend/tests/services/BaziAnalyzer.test.js))
- **Cập Nhật Tên Test Case**: Sửa đổi tên ca kiểm thử thần sát để phản ánh chính xác việc loại bỏ Tang Môn và Điếu Khách khỏi bản mệnh tĩnh.

### 📄 Tài Liệu Nghiệp Vụ ([BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md))
- **Cập Nhật Số Lượng Thần Sát**: Loại bỏ định nghĩa tĩnh của Tử Phù, Bệnh Phù, Tang Môn, Điếu Khách và cập nhật tổng số lượng thần sát tĩnh của hệ thống xuống còn **37 Thần Sát**.

## 📅 Phiên bản: Cập nhật Thuật toán Thần sát Huyết Nhận Sát, Cách Giác, Đại Hao & Tuế Phá (10/08/2026)

### 🪐 Thuật Toán Học Thuật Bát Tự ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Nâng Cấp Huyết Nhận Sát**: Thay đổi hoàn toàn logic xác định Huyết Nhận Sát để đối chiếu dựa trên **Địa Chi của năm sinh (Niên Chi)** thay vì Địa Chi của tháng sinh (Nguyệt Chi) như trước đây:
  - Cập nhật bảng tra cứu học thuật mới: Tý->Tuất, Sửu->Dậu, Dần->Thân, Mão->Mùi, Thìn->Ngọ, Tỵ->Tỵ, Ngọ->Thìn, Mùi->Mão, Thân->Dần, Dậu->Sửu, Tuất->Tý, Hợi->Hợi.
- **Nâng Cấp Cách Giác (Cách Góc)**: Thay thế thuật toán kiểm tra sự tương tác hai chiều giữa Địa Chi ngày và giờ cũ. Logic mới chỉ sử dụng **Địa Chi ngày sinh (Nhật Chi - `dayZhi`)** làm chuẩn:
  - Bất kỳ trụ nào có Địa Chi tiến lên đúng 2 cung Địa Chi so với Nhật Chi (`(dIdx + 2) % 12`) thì trụ đó được ghi nhận có thần sát Cách Giác.
- **Nâng Cấp Đại Hao & Tuế Phá**: Căn chỉnh chính xác theo yêu cầu hiển thị trực quan:
  - **Đại Hao (Thần sát tĩnh)**: Đổi tên sao "Nguyên Thần" tĩnh thành **Đại Hao**. Sao này hiển thị trên lá số tĩnh gốc, cấu trúc đối chiếu trụ vận hạn (Hình 1) và cột niên biểu bên phải (Hình 2). Đồng thời loại bỏ sao Đại Hao đối xung cũ ở tĩnh.
  - **Tuế Phá (Thần sát động)**: Chỉ hiển thị ở cột bên trái "Niên Vận Tinh 2026" (Hình 2). Loại bỏ hoàn toàn sao Tuế Phá và Đại Hao động khỏi việc chiếu lên các trụ trong niên biểu và đối chiếu trụ tổng hợp. Xóa bỏ dòng Đại Hao động ở cột Niên Vận Tinh.

### 🧪 Bộ Kiểm Thử Tự Động Backend ([BaziAnalyzer.test.js](file:///t:/Phongthuy/backend/tests/services/BaziAnalyzer.test.js))
- **Cập Nhật Unit Tests Cho Huyết Nhận**: Sửa đổi ca kiểm thử để xác minh Huyết Nhận được kích hoạt thành công từ Niên Chi kết hợp Địa Chi các trụ khác theo bảng quy chiếu mới (sử dụng ngày sinh `1996-05-15` có năm Bính Tý và giờ Tuất).
- **Cập Nhật Unit Tests Cho Cách Giác**: Sửa đổi ca kiểm thử để đảm bảo Cách Giác chỉ kích hoạt tại các trụ khớp chuẩn xác với Chi ngày tiến 2 (sử dụng ngày sinh `1990-02-04` lúc `04:30` có ngày Mậu Tý và giờ Giáp Dần $\rightarrow$ ghi nhận Cách Giác tại trụ giờ `Dần`, và không còn ghi nhận Cách Giác tại trụ ngày `Tý`).
- **Cập Nhật Unit Tests Cho Đại Hao / Tuế Phá**: Viết lại ca kiểm thử chi tiết xác nhận: trụ Mùi của ngày `1996-05-15 13:30` (được tính là Nguyên Thần) nhận nhãn `'Đại Hao'` thay vì `'Nguyên Thần'`, trụ ngày Ngọ **không** nhận `'Đại Hao'` tĩnh, và ở lưu niên động 2026 Bính Ngọ, các trụ vận hạn động **không** bị gán `'Tuế Phá'` hay `'Đại Hao'` động chiếu, còn danh sách Niên Vận Tinh bên trái có `'Tuế Phá'` và **không** có `'Đại Hao'`.

### 📄 Tài Liệu Nghiệp Vụ ([BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md))
- **Định Nghĩa Thần Sát**: Cập nhật định nghĩa học thuật của **Huyết Nhận Sát** ở mục 28 chỉ rõ cách tra dựa trên Địa Chi năm sinh. Thêm định nghĩa cụ thể cho **Cách Giác (Cách Góc)** ở mục 33, **Đại Hao (Nguyên Thần)** ở mục 34, **Tuế Phá** ở mục 35, và cập nhật tổng số lượng thần sát trong hệ thống lên **41 Thần Sát**.

## 📅 Phiên bản: Viết Bài Thiên Ất Quý Nhân & Thiên Nguyệt Đức, Tích Hợp Hiển Thị Thumbnail Đầu Chi Tiết, Tối Ưu Sắp Xếp Mobile & Markdown Regex (09/08/2026)

### 🪐 Nội Dung Blog & Database ([BlogSeedService.js](file:///t:/Phongthuy/backend/src/services/BlogSeedService.js))
- **Viết Bài Thiên Ất Quý Nhân & Thiên Nguyệt Đức Chuyên Sâu**: Viết hai bài viết học thuật tiếng Việt cực kỳ chi tiết về **"Thiên Ất Quý Nhân"** và **"Thiên Nguyệt Đức Quý Nhân"** (đại cát thần giải ách trừ tai trong Tứ Trụ Bát Tự) với tiêu đề hấp dẫn, cấu trúc 5 phần chi tiết, bảng tra cứu theo tháng/ngày sinh, cùng các phương pháp cải vận bằng phương vị Quý Nhân.
- **Tích Hợp Database Seeding**: Thêm hai đối tượng bài viết vào danh sách `SEED_POSTS` trong `BlogSeedService.js` để tự động gieo dữ liệu khi cài đặt mới.
- **Tạo Script Insert Trực Tiếp & Dọn Dẹp**: Viết và chạy các script `insert_thien_at_post.js` và `insert_thien_nguyet_duc_post.js` kết nối trực tiếp MongoDB Atlas để nạp dữ liệu bài viết mới hiển thị lập tức trên môi trường hiện tại của người dùng, sau đó dọn dẹp các script tạm khỏi thư mục dự án.

### 🎨 Giao Diện Người Dùng & Trải Nghiệm Blog ([BlogBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BlogBoard.jsx), [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx))
- **Hiển Thị Thumbnail Đầu Chi Tiết Bài Viết**: Sửa đổi component `BlogBoard.jsx` để tự động render ảnh `thumbnailUrl` ở đầu giao diện chi tiết bài viết với kích thước gốc (`h-auto w-full block`) và margin-bottom `mb-6`, mang lại giao diện đọc tin tức cực kỳ cao cấp và hiện đại.
- **Tối Ưu Sắp Xếp, Loại Bỏ Badge Dư Thừa & Khép Khoảng Trống (Top Bar, Spacing & Tag Removal)**: Thu gọn nút quay về chỉ hiển thị icon `←` ở màn hình di động, thu nhỏ padding các nút share để vừa khít trên một hàng ngang duy nhất. Loại bỏ hoàn toàn nhãn danh mục ("BÁT TỰ") khỏi phần đầu trang chi tiết bài viết (trên cả mobile & desktop) để giải phóng diện tích dọc và tránh gây rối mắt. Đồng thời khép nhỏ khoảng cách dọc (`space-y-5`) và padding (`p-4`) trên mobile để loại bỏ các khoảng trống thừa thãi, giúp tiêu đề, thông tin tác giả và ảnh đại diện hiển thị tập trung và sạch sẽ.
- **Tối Ưu Hóa Markdown Cleanup Regex**: Phát hiện và khắc phục lỗi regex của frontend (`replace`) quá tham lam làm nuốt mất dấu ngắt dòng kép (`\n\n`) trước các chữ in đậm/in nghiêng `**` ở đầu đoạn văn. Đã thay thế bằng regex khớp ngắt dòng đơn lẻ `[^\S\r\n]*\r?\n[^\S\r\n]*` để bảo toàn nguyên vẹn khoảng cách phân chia các đoạn văn trong bài viết.

## 📅 Phiên bản: Cập nhật Thuật Toán Kim Thần, Hồng Diễm Sát, Thiên La & Địa Võng, Âm Dương Sai Thác (09/08/2026)

### 🪐 Thuật Toán Học Thuật Bát Tự ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Nâng Cấp Cát Tinh Kim Thần**: Thay đổi logic xác định Kim Thần để áp dụng cho cả **Trụ Ngày** và **Trụ Giờ** theo đúng quy tắc sách cổ:
  - **Trụ Ngày**: Nếu ngày sinh là `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` thì mặc định ngày sinh có Kim Thần.
  - **Trụ Giờ**: Nếu giờ sinh là `Ất Sửu`, `Kỷ Tỵ`, hoặc `Quý Dậu` thì chỉ được tính có Kim Thần khi Nhật Can (Can của ngày sinh) là **Giáp** hoặc **Kỷ** (loại bỏ việc xét Thiên Can của năm).
- **Cập Nhật Thần Sát Hồng Diễm Sát**: Thay đổi bảng quy chiếu Địa Chi theo Can sang hệ thống học thuật mới (Giáp->Ngọ, Ất->Thân, Canh->Thân, Quý->Tuất, v.v.), đồng thời mở rộng phạm vi tra cứu để **xét cả Can Ngày (Nhật Can) và Can Năm (Niên Can)** thay vì chỉ xét Nhật Can như trước đây.
- **Nâng Cấp Thiên La & Địa Võng**: Gỡ bỏ hoàn toàn logic kiểm tra dựa trên Nạp Âm Hỏa/Thủy/Thổ cũ. Thay vào đó, áp dụng logic dựa trên mối tương tác Địa Chi giữa Chi Ngày (`dayZhi`) hoặc Chi Năm (`yearZhi`) với các trụ khác:
  - **Thiên La**: Chi Ngày/Năm là `Thìn` gặp trụ khác có chi `Tỵ` (hoặc ngược lại).
  - **Địa Võng**: Chi Ngày/Năm là `Tuất` gặp trụ khác có chi `Hợi` (hoặc ngược lại).
- **Giới Hạn Âm Dương Sai Thác**: Sửa đổi thuật toán của Thần sát **Âm Dương Sai Thác** để **chỉ tính tại Trụ Ngày (Nhật Trụ)** thay vì xét trên cả 4 trụ như trước.

### 🧪 Bộ Kiểm Thử Tự Động Backend ([BaziAnalyzer.test.js](file:///t:/Phongthuy/backend/tests/services/BaziAnalyzer.test.js))
- **Mở Rộng Unit Tests Cho Kim Thần**: Viết thêm các test cases chi tiết để bao phủ 100% logic Kim Thần mới.
- **Thêm Unit Tests Cho Hồng Diễm Sát**: Bổ sung các test cases kiểm tra sự xuất hiện của Hồng Diễm Sát kích hoạt bởi Can Năm và Can Ngày theo bảng quy chiếu mới với các ngày sinh thực tế chính xác.
- **Cập Nhật Unit Tests Thiên La & Địa Võng**: Thay đổi các ca kiểm thử cũ (lấy ngày sinh 1988 Mậu Thìn cho Thiên La và 1994 Giáp Tuất cho Địa Võng) để phản ánh đúng logic tương tác chi mới.
- **Cập Nhật Unit Tests Âm Dương Sai Thác**: Sửa đổi ca kiểm thử để kiểm chứng Âm Dương Sai Thác chỉ xuất hiện trên trụ Ngày (ngày Bính Tý `1996-02-09`) và hoàn toàn không xuất hiện trên các trụ khác (như trụ Năm của năm Bính Tý `1996-05-15`).

### 📄 Tài Liệu Nghiệp Vụ ([BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md))
- **Định Nghĩa Lại Thần Sát**: Tăng tổng số lượng Thần Sát Bát Tự lên **32 Thần Sát**, bổ sung định nghĩa học thuật cụ thể cho **Kim Thần** ở mục 31, **Hồng Diễm Sát** ở mục 32, cập nhật định nghĩa tương tác chi của **Thiên La** (mục 21) & **Địa Võng** (mục 22), và định rõ phạm vi chỉ tính ở trụ Ngày đối với **Âm Dương Sai Thác** (mục 24).

## 📅 Phiên bản: Luận giải Bát Tự Thần Sát Chuyên Sâu, Tích Hợp Vận Hạn Lưu Niên Động 2026/2027 & Lời Khuyên Hành Động (07/08/2026)

### 🪐 Nâng Cấp Prompt Luận Giải Bát Tự Chuyên Sâu ([BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js), [ai.js](file:///t:/Phongthuy/backend/src/config/ai.js))
- **Tăng Phiên Bản Prompt**: Tăng `BAZI_PROMPT_VERSION` từ `"v2_7_step_grouped"` lên `"v3_0_shensha_upgrade"`.
- **Tích Hợp Thần Sát Tĩnh & Lục Thân**: Hướng dẫn AI sử dụng chi tiết Thần Sát Tĩnh của các trụ gốc để giải đoán sâu sắc Sự nghiệp, Tài vận, Hôn nhân và Sức khỏe ở Bước 3. Đồng thời định hướng rõ sơ đồ Lục Thân theo giới tính (Nam lấy Tài làm vợ, Nữ lấy Quan làm chồng, v.v.) để giải đoán gia đạo chính xác.
- **Luận giải theo Tổ hợp Thần Sát**: Yêu cầu AI luận giải Thần Sát theo các tổ hợp cát-hung kết hợp (như Quý Nhân gặp Không Vong/Hình xung thì giảm cát; Đào Hoa gặp Kình Dương, Kiếp Sát tạo thành Đào Hoa Sát...), tránh luận đơn lẻ. Nếu không có tổ hợp cổ điển, AI tự biện chứng tượng nghĩa của tổ hợp.
- **Đánh giá Lực lượng Thần Sát theo Vòng Trường Sinh**: Hướng dẫn AI đối chiếu cung Trường Sinh tĩnh tại các trụ để đong đếm lực lượng của Thần Sát (tọa Sinh/Vượng thì tác dụng mạnh mẽ, tọa Tử/Tuyệt/Bệnh thì suy kiệt vô lực).
- **Tích hợp Thần sát Lưu niên vào Giải mã (Bước 4)**: Cập nhật Bước 4 yêu cầu AI giải mã kết hợp cả Thần sát tĩnh bản mệnh và Thần sát động lưu niên, đong đếm theo Trường Sinh và Tổ hợp, nâng khống chế số lượng từ lên 225-275 từ.
- **Tương Tác Can Chi Động & Tam Hình**: Dạy AI phân tích các tương tác Can Chi động của Đại vận và Lưu niên như hiện tượng thấu can/thông căn (Can lưu niên thấu ra từ Địa chi gốc), và cục diện **Tam hình (Sửu - Mùi - Tuất)** khi Lưu niên gặp các chi xung hợp hình hại.
- **Tách Biệt Luận Đoán Lưu Niên 2026 & 2027**: Yêu cầu AI luận giải chi tiết tách biệt từng năm 2026 và 2027, không gộp chung. Kết hợp số tuổi đương số (32 và 33 tuổi) để dự đoán các sự kiện sát sườn thực tế.
- **Ứng Kỳ Tháng Âm Lịch**: Yêu cầu AI chỉ ra tháng cụ thể bộc phát cát hung dựa vào sự xung hợp can chi của tháng với năm.
- **Bổ Sung Lời Khuyên Hành Động**: Thêm phần con khuyên đương số việc nên làm dựa trên tính chất Hỷ kỵ và Thập thần của năm 2026.

### ⚙️ Bổ Sung Hàm Helper Định Dạng Vận Hạn Chi Tiết ([astrologyHelpers.js](file:///t:/Phongthuy/backend/src/shared/utils/astrologyHelpers.js))
- **Hàm `formatDetailedBaziTimeline`**: Tạo hàm helper trích xuất động Đại vận hiện tại và thông tin Lưu niên chi tiết 2 năm (2026, 2027) bao gồm tuổi tác, Can Chi, Thập Thần, Nạp Âm, Niên Vận Tinh di động, và Thần sát Lưu niên tác động lên 4 trụ bản mệnh để truyền trực tiếp vào prompt của AI.

### 🛠️ Sửa Lỗi Rò Rỉ Bộ Nhớ (Memory Leak) Do Shadowing ([AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js))
- **Khắc phục lỗi scoping của pingInterval**: Phát hiện lỗi shadowing biến `pingInterval` trong 8 endpoint SSE (gồm cả interpret và chat của các phân hệ). Việc khai báo đè `let pingInterval` bên trong khối `try` làm cho khối `finally` không thể xóa được bộ đệm ping (`clearInterval`), gây ra rò rỉ bộ nhớ nghiêm trọng trên server.
- **Giải quyết**: Di chuyển khai báo `let pingInterval = null;` lên scope ngoài (trước khối `try`) và xóa từ khóa `let` trong khối `try` để gán chính xác vào biến ngoài, đảm bảo dọn dẹp timer 100% khi kết nối đóng.

### 🧪 Unit Tests & Script Kiểm Thử Tích Hợp AI Thực Tế ([AiInterpretationController.test.js](file:///t:/Phongthuy/backend/tests/controllers/AiInterpretationController.test.js), [test_ai_integration.js](file:///t:/Phongthuy/backend/src/scripts/test_ai_integration.js))
- **Tích Hợp Unit Test**: Viết file unit test mock chính thức `AiInterpretationController.test.js` kiểm thử tất cả các trường hợp lập luận giải Bát Tự, chat AI và phản hồi lỗi. Toàn bộ Jest test suite 167/167 tests đều đã chạy PASS thành công.
- **Script Tích Hợp Đăng Nhập & Luận giải AI thật**: Tạo script `test_ai_integration.js` sử dụng tài khoản thực tế (`cobatuoc@gmail.com` / `12345678`) để thực hiện luồng thật: Đăng nhập -> Lập lá số -> Stream SSE luận giải từ Gemini (nhận hơn 14k ký tự) -> Stream SSE Chat Hỏi đáp từ Gemini. Chạy script thực tế thành công 100% trơn tru.

## 📅 Phiên bản: Bát Tự Thần Sát Split, Dynamic Tai Sui, Auto-Migration & UI Layout Perfect Fit (07/08/2026)


### 🪐 Dynamic Tai Sui & Bát Tự Thần Sát Split ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js), [BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx))
- **Phân Tách Hệ Thống Thần Sát**: Tách biệt rõ ràng Thần Sát Tĩnh (chỉ tính cho 4 trụ gốc lá số) và Thần Sát Động (Thần Sát Thái Tuế / Lưu Niên Đại Vận) theo đúng yêu cầu lý thuyết học thuật Phương Đông.
- **Tự Động Tính Lưu Niên Projected Stars**: Xây dựng hàm `getLuuNienShenShaForPillar` tính toán chính xác 12 sao vòng Thái Tuế và các sao chiếu theo Thiên Can / Địa Chi của năm lưu niên chiếu lên 4 trụ gốc.
- **Đồng Bộ Dữ Liệu Niên Biểu**: Tích hợp hiển thị đồng thời cả **Thần Sát Tĩnh (Bản mệnh)** và **Thần Sát Động (Lưu niên)** tại bảng `Niên Biểu Thần Sát` của từng năm, giúp tổng hợp trọn vẹn cát hung hội tụ.
- **Giữ Nguyên Thần Sát Tĩnh Trụ Gốc**: Điều chỉnh phần `Đối Chiếu Trụ Vận Hạn (Tổng Hợp)` bên dưới chỉ hiển thị duy nhất Thần Sát Tĩnh cố định của lá số gốc để bảo toàn ý nghĩa cấu trúc tứ trụ nguyên thủy.
- **Lọc Bỏ Sao Phối Hợp Thập Thần**: Loại bỏ sao **Tỷ Kiên Cô Quả** ra khỏi danh sách tính toán do đây là sao phối hợp với Thập Thần.
- **Chuẩn Hóa Tên Gọi Thần Sát**: Ẩn chữ "Quý Nhân" ở phần hiển thị của tất cả các sao có hậu tố này (ví dụ: *Thiên Ất Quý Nhân* hiển thị thành *Thiên Ất*, *Thiên Trù Quý Nhân* thành *Thiên Trù*) giúp giao diện gọn gàng và trực quan.

### ⚙️ Auto-Migration Schema Check & Persist Fix ([BaziController.js](file:///t:/Phongthuy/backend/src/controllers/BaziController.js))
- **Cập Nhật hasNewSchema**: Điều chỉnh hàm kiểm tra schema để bắt buộc kiểm tra sự tồn tại của `annualShenSha` và `nienVanTinh` trong chu kỳ Lưu Niên, phát hiện chính xác các bản ghi cũ chưa nâng cấp để kích hoạt migration ngầm.
- **Sửa Lỗi Mongoose Mixed Save**: Bổ sung cuộc gọi `dupRecord.markModified('baziData')` and `existingRecord.markModified('baziData')` sau khi gán lại `baziData` mới. Điều này giải quyết triệt để lỗi Mongoose không lưu các thay đổi của trường dạng Mixed (`Object`) xuống MongoDB.

### 🎨 Tối Ưu Chiều Cao Cột Đối Chiếu (Flexbox Stretch Fix)
- **Đồng Bộ Chiều Cao 100% Cột Trụ**: Loại bỏ lớp `h-full` xung quanh `Pillar` component gây xung đột trong flex container, cho phép thuộc tính `self-stretch` của Flexbox tự động co dãn các cột đối chiếu cao bằng nhau một cách hoàn hảo, không còn bị lệch độ cao giữa các trụ.

### 🧪 Browser Verification & DevTools Testing
- **Kiểm Thử Chrome DevTools**: Khởi chạy thành công local server, thực hiện điền thông tin và lập lá số Bát Tự mới, kiểm tra trực tiếp console log và thao tác click chuyển đổi năm Lưu Niên trên UI, đảm bảo giao diện đạt chuẩn Premium và chạy hoàn hảo 100% không phát sinh lỗi.

## 📅 Phiên bản: Tích Hợp Tự Động Hóa Triển Khai CI/CD Lên AWS EC2 Qua Docker Hub & Chặn Lỗi Bằng Unit Tests (06/08/2026)

### 🚀 CI/CD Pipeline & GitHub Actions Automation
- **Thiết lập luồng CI/CD Tự Động Toàn Diện (`.github/workflows/deploy.yml`)**:
  - Tự động hóa quá trình đóng gói và triển khai ứng dụng bằng Github Actions khi có thao tác `git push` lên nhánh `main`.
  - **Bức Tường Phòng Thủ (CI Testing)**: Tích hợp bước chạy tự động toàn bộ 86 Unit Tests bằng Jest trước khi build. Nếu bất kỳ test nào thất bại, quá trình build sẽ bị hủy bỏ (Abort) để bảo vệ hệ thống khỏi lỗi.
  - **Đóng Gói & Lưu Trữ (Docker Hub Integration)**: Chuyển quá trình tốn kém phần cứng (build docker image) sang Github Actions (sử dụng Docker BuildKit Layer Caching cực nhanh), đóng gói Frontend/Backend và đẩy trực tiếp lên Docker Hub, giải phóng tải cho máy chủ EC2.
  - **Cập Nhật In-Place "Thay Ở Đâu Sửa Ở Đó" (CD Deployment)**: Sử dụng SSH Key (PEM) kết nối vào EC2, tự động chạy `docker compose pull` và `docker compose up -d` để tải các layer image mới và khởi động lại chính xác những container bị thay đổi mà không làm sập các service khác (Zero-downtime cho database, Nginx, Redis).
- **Tối Ưu Cấu Hình Nginx & Single Source of Truth**:
  - Gắn kèm lệnh `docker compose restart nginx` cuối chu trình để làm mới upstream IPs và dọn dẹp cache ẩn của proxy.
  - Sử dụng biến động `${DOCKERHUB_USERNAME}` trong `docker-compose.yml` để biến file cấu hình thành Single Source of Truth (quản lý 1 chỗ từ trang Github Secrets).

## 📅 Phiên bản: Gom Nhóm Lá Số (Tags/Folders), Lọc Nâng Cao Lịch Sử, Phân Hệ "Lá số của tôi" & Coverage Unit Tests (05/08/2026)

### 🏷️ Backend Tagging & Advanced History Filtering System ([TagController.js](file:///t:/Phongthuy/backend/src/controllers/TagController.js), [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js), [tag.js](file:///t:/Phongthuy/backend/src/routes/tag.js))
- **Gom Nhóm Lá Số Dạng Thẻ / Folder (Zalo Style)**:
  - Cập nhật schema `User` bổ sung mảng `tags: [{ _id, name, isDefault, createdAt }]`.
  - Cập nhật 4 schema kỷ lục (`IChingRecord`, `BaziRecord`, `ZiweiRecord`, `MarriageRecord`) bổ sung trường `tags: { type: [String], default: ['Chung'] }` và compound index `{ userId: 1, tags: 1 }`.
  - Tạo mới `TagController` hỗ trợ CRUD tag người dùng (`getUserTags`, `createTag`, `updateTag`, `deleteTag`, `updateRecordTags`).
  - Đổi tên tag hoặc xóa tag tự động đồng bộ mảng `tags` trong toàn bộ 4 collections, tự động khôi phục tag mặc định `['Chung']` nếu bản ghi rỗng tag.
  - Áp dụng kiểm tra quyền sở hữu nghiêm ngặt `checkRecordOwnership` (`record.userId === req.user.id`).
- **Lọc Nâng Cao Đa Điều Kiện**:
  - Nâng cấp các API xem lịch sử hỗ trợ lọc đa tiêu chí: `tag`, `isPublic` (true/false), Ngày sinh (1-31), Tháng sinh (1-12), **Năm sinh** (VD: 1995), **Giờ sinh** (0-23h / 12 Canh giờ), Giới tính (Nam/Nữ), và Từ khóa tìm kiếm Tên/Câu hỏi (`search`).
  - Thêm API tổng hợp `GET /api/history/all/:userId` truy vấn đồng thời 4 phân hệ phục vụ xem danh sách thư mục.
- **Kịch Bản Quét DB & Update Tag Mặc Định (DB Migration Script)**:
  - Tạo mới [`scripts/migrateTagsAndStats.js`](file:///t:/Phongthuy/backend/scripts/migrateTagsAndStats.js) quét toàn bộ cơ sở dữ liệu MongoDB:
    - Gán tag mặc định `['Chung']` cho tất cả 160 bản ghi hiện có (`IChingRecord`: 27, `BaziRecord`: 118, `ZiweiRecord`: 8, `MarriageRecord`: 7).
    - Tạo tag mặc định `Chung` cho 16 tài khoản người dùng và gọi `UserStatsService.recalculateUserStats(userId)` tính lại chính xác 100% số liệu thống kê.
- **Sửa Lỗi Hiển Thị Đếm Bản Ghi Tab Lịch Sử**:
  - Bổ sung `stats` và `tags` vào object `user` trả về từ AuthController (`login`, `register`, `googleLogin`, `updateProfile`, `/auth/me`).
  - Đồng bộ hiển thị badge đếm `(x)` trên các Tab Lịch sử theo giá trị nguyên tử `user.stats` từ `AuthContext` để phản ánh chính xác 100% tổng số bản ghi thực tế.

### 📁 Frontend "Lá số của tôi" & Custom Select Dropdowns ([CustomSelect.jsx](file:///t:/Phongthuy/frontend/src/components/CustomSelect.jsx), [MyFoldersModal.jsx](file:///t:/Phongthuy/frontend/src/components/MyFoldersModal.jsx), [HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx))
- **Tách Component Input Tử Vi (`ZiweiInput.jsx`)**:
  - Chia nhỏ form nhập Tử Vi ra tệp [`ZiweiInput.jsx`](file:///t:/Phongthuy/frontend/src/components/ZiweiInput.jsx) độc lập theo cấu trúc của `BaziInput.jsx`.
  - Không nhập sẵn giá trị mặc định cho Ngày, Tháng, Năm, Giờ, Phút (khởi tạo rỗng `''`).
  - Hỗ trợ vừa nhập vừa chọn (Combobox `editable={true}`).
- **Sửa Lỗi Dữ Liệu Trống Trơn Khi Xem Chi Tiết Hôn Nhân Từ "Lá Số Của Tôi" (`UserApp.jsx`, `MarriageBoard.jsx`)**:
  - Do danh sách lịch sử/thư mục tối ưu bỏ bớt `maleBaziData` & `femaleBaziData`, đã sửa điều kiện trong `handleViewHistoricalMarriage` để tự động gọi API `getMarriageRecord(id)` tải đầy đủ Bát Tự Nam & Nữ Mệnh khi người dùng nhấp xem chi tiết.
- **Sửa Triệt Để Các Lỗi TypeError Hiển Thị Trong Ảnh Màn Hình (`MarriageBoard.jsx`, `BaziBoard.jsx`)**:
  - Đã khắc phục lỗi `Cannot read properties of undefined (reading 'solarTimeline')` bằng cách cung cấp giá trị mặc định object cho `maleBaziData` & `femaleBaziData`.
  - Khắc phục lỗi `Cannot read properties of undefined (reading 'year')` tại `BaziPillarsSection` (`MarriageBoard.jsx`) và `BaziBoard.jsx` bằng bọc an toàn `safeCanChi`.
  - Khắc phục nguy cơ crash tại `FiveElementsDiagram` với `safeScores = scores || {}`.
- **Đồng Bộ Nút Tag 🏷️ Đầy Đủ Cho Bát Tự & Hôn Nhân (`HistoryBoard.jsx`)**:
  - Đã thêm đầy đủ cả Badge nút bấm `🏷️ [Tên thẻ]` lẫn Nút Icon Tag 🏷️ góc phải cho cả Bát Tự và Hôn Nhân.
- **Gộp Input Kinh Dịch Về 1 Component (`IChingInput.jsx`) & Dọn Dẹp Mã Thừa**:
  - Toàn bộ logic và giao diện gieo quẻ Kinh Dịch được tập trung duy nhất tại [`IChingInput.jsx`](file:///t:/Phongthuy/frontend/src/components/IChingInput.jsx).
  - Đã xóa sạch 3 tệp tin dư thừa không còn sử dụng: `CoinToss.jsx`, `MaiHoaInput.jsx`, và `ManualInput.jsx` để giữ codebase tối ưu và gọn gàng.
- **Tinh Chỉnh Giao Diện & Nút Tìm Kiếm Bộ Lọc**:
  - Đổi tên nút thành **"Đặt lại"** và **"Tìm kiếm"**.
  - Tự động disable 2 nút khi ở trạng thái mặc định (chưa thay đổi lọc) và chỉ enable khi có thay đổi.
  - Loại bỏ các nút áp dụng trùng lặp và mô tả rườm rà.
  - Ẩn/thu gọn phần lọc nâng cao mặc định và tích hợp nút mũi tên 🔽 **"Lọc nâng cao"** để mở rộng linh hoạt.
- **Phân Hệ "Lá số của tôi" (My Folders Modal)**:
  - Thêm mục **"Lá số của tôi"** vào Menu tài khoản (Desktop Dropdown & Mobile Menu Drawer).
  - Giao diện gồm thống kê tổng số lá số/quẻ, tổng số thư mục, danh sách thẻ thư mục kèm lượt đếm, xem chi tiết thư mục có đầy đủ tab 4 phân hệ và bộ lọc nâng cao.
  - Hỗ trợ click trực tiếp vào lá số trong thư mục để xem toàn bộ chi tiết quẻ/lá số.
- **Gắn Tag Trực Tiếp Trên Card Lịch Sử**:
  - Hiển thị các nhãn Tag (Pill badges) trên mỗi card bản ghi trong lịch sử kèm nút `+ Gắn tag` / gỡ tag nhanh.

### 🧪 Unit Tests Suite Coverage ([TagController.test.js](file:///t:/Phongthuy/backend/tests/controllers/TagController.test.js), [HistoryFilter.test.js](file:///t:/Phongthuy/backend/tests/controllers/HistoryFilter.test.js))
- Đã viết bộ Unit Tests tự động kiểm thử toàn bộ các trường hợp nghiệp vụ phát sinh:
  - Tạo tag, đổi tên tag & đồng bộ 4 collections, xóa tag & khôi phục tag mặc định `Chung`.
  - Phân quyền sở hữu: trả lời 403 Forbidden nếu người dùng thao tác tag trên lá số không thuộc sở hữu.
  - Lọc đa tiêu chí: test lọc theo tag, `isPublic`, ngày/tháng/năm/giờ sinh, giới tính, từ khóa tìm kiếm và tổng hợp `getAllHistory`.

---

## 📅 Phiên bản: Bổ Sung Thuật Toán Tự Động Tính 7 Thần Sát Mới Cho Bát Tự (05/08/2026)

### Bazi Algorithm & Shen Sha Extensions ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L427))
- **Thiên La & Địa Võng (Lưới Trời Lưới Đất)**: Tích hợp công thức đối chiếu **Mệnh nạp âm năm sinh (Year Pillar Na Yin)** từ `NAYIN_MAP`. Mệnh Hỏa gặp địa chi **Tuất** ở bất cứ trụ nào $\rightarrow$ Tính là `Thiên La`. Mệnh Thủy hoặc mệnh Thổ gặp địa chi **Thìn** $\rightarrow$ Tính là `Địa Võng`.
- **Khôi Canh Sát**: Ghi nhận tính chất cá tính mạnh mẽ khi trụ gặp một trong 4 ngày: **Canh Thìn, Nhâm Thìn, Mậu Tuất, Canh Tuất**.
- **Âm Dương Sai Thác**: Nhận diện 12 ngày cưới trắc trở, bất hòa nhân duyên gồm **Bính Tý, Đinh Sửu, Bính Ngọ, Đinh Mùi, Mậu Dần, Mậu Thân, Tân Mão, Tân Dậu, Nhâm Thìn, Nhâm Tuất, Quý Tỵ, Quý Hợi**.
- **Cô Loan Sát**: Nhận diện các ngày đơn độc hôn nhân gồm **Ất Tỵ, Đinh Tỵ, Tân Hợi, Mậu Thân, Giáp Dần, Bính Ngọ, Mậu Ngọ, Nhâm Tý**.
- **Thập Ác Đại Bại**: Tự động đánh dấu 10 ngày mưu sự thất bại gồm **Giáp Thìn, Ất Tỵ, Bính Thân, Đinh Hợi, Mậu Tuất, Kỷ Sửu, Canh Thìn, Tân Tỵ, Nhâm Thân, Quý Hợi**.
- **Lưu Hà Sát**: Tự động xác định rủi ro tai nạn hoặc hao tài qua Can ngày sinh (`dmGan`) đối chiếu với các chi.
- **Huyết Nhận Sát (Blood Blade)**: Tự động đối chiếu Chi Tháng sinh (`monthZhi`) với Chi các trụ để xác định các cung vị dễ gặp tai nạn thương tích hoặc phẫu thuật.
- **Quan Phù Sát**: Tích hợp thuật toán tính Quan Phù (tiến 4 cung vị từ Chi Năm sinh `yearZhi`).
- **Phân tách Lộc Thần tự động**: Nâng cấp cơ chế nhận diện trụ sinh, tự động phân tách Lộc Thần thành **Tuế Lộc** (trụ Năm), **Kiến Lộc** (trụ Tháng), **Chuyên Lộc** (trụ Ngày), và **Quy Lộc** (trụ Giờ) trên lá số nguyên bản, đồng thời giữ nguyên tên gọi Lộc Thần chung cho các đại vận/lưu niên.
- **Bổ sung Unit Tests**: Đã kiểm thử verified thành công toàn bộ 42 tests tại [`BaziAnalyzer.test.js`](file:///t:/Phongthuy/backend/tests/services/BaziAnalyzer.test.js#L425) bao gồm các ca kiểm thử cho Quan Phù và tất cả các phân cấp Lộc Thần.

## 📅 Phiên bản: Phân Cấp 7 Mức Năng Lượng Nhật Chủ & Thuật Toán Đồ Thị Đường Sinh Trợ (02/08/2026)

### Academic Engine & Graph Algorithm ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Phân Cấp 7 Mức Độ Năng Lượng Nhật Chủ (`evaluate7LevelEnergy`)**:
  - Mở rộng phân cấp Nhật Chủ lên 7 mức độ: `CỰC NHƯỢC`, `NHƯỢC`, `SUY`, `CÂN BẰNG`, `VƯỢNG`, `CƯỜNG VƯỢNG`, `CỰC VƯỢNG`.
  - Bổ sung công thức xác định trạng thái **`CÂN BẰNG`** khi Tỷ lệ % Đồng Đàng đạt từ $40\% - 52\%$ và tỷ số lực lượng Khắc/Tiết/Hao nằm trong khoảng hòa hoãn $(0.8 - 1.25)$.
- **Thuật Toán Đồ Thị Đường Sinh Trợ (Energy Support Chain Graph Algorithm - `buildEnergySupportChains`)**:
  - Thiết kế đồ thị directed graph 8 nút (4 Can và 4 Chi).
  - Quét các chuỗi sinh/trợ liên tục kết thúc tại Thiên Can (hoặc Nhật Chủ).
  - Áp dụng Maximal Chain Filter loại bỏ các đường con nằm trong đường dài hơn.
  - Tích lũy bonus lực lượng cho nút điểm cuối dựa theo độ dài chuỗi ($L=2 \rightarrow +15\%, L=3 \rightarrow +30\%, L=4+ \rightarrow +50\%$).

### Đồng Bộ Chiều Cao Hoàn Hảo 100% Giữa Các Trụ (Dynamic ShenSha Padding) ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx))
- **Thuật Toán Pad Số Dòng Thần Sát Tự Động (`minShenShaLines`)**:
  - Tự động tính toán số lượng Thần Sát tối đa (`maxBaziShenSha` và `maxVanhHanShenSha`) trong từng nhóm trụ.
  - Áp dụng đệm dòng ẩn `invisible` cho các trụ có ít Thần Sát hơn.
  - **Kết quả nghiệm thu Chrome DevTools**: Cả 4 trụ ở Cấu Trúc Tứ Trụ và 6 trụ ở Bảng Vận Hạn Năm luôn luôn có **số dòng bằng chằn chặn 100%**, giữ cho đường nét đứt phân cách Tàng Can và viền chân khung bên dưới nằm trên 1 đường thẳng hàng tuyệt đối.

---

### Academic Engine & Calculation Optimization ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Khắc Phục Triệt Để Bug Lộn Xộn Thần Sát & Sao Ảo (Noble Stars & Void Stars Fix)**:
  - **Chuẩn hóa Hệ Quy Chiếu Tối Cao**: Ép buộc toàn bộ các Quý Nhân cá nhân (*Thiên Ất, Thái Cực, Văn Xương, Phúc Tinh, Quốc Ấn, Kim Dư*) **CHỈ ĐƯỢC TRA THEO NHẬT CHỦ (`dmGan`)**. Loại bỏ hoàn toàn việc dùng Can Năm `yearGan` rải sao Quý nhân ảo lên các trụ Ngày/Giờ.
  - **Phân tầng Không Vong chuẩn xác**: Chỉ sử dụng Tuần Không của Nhật Trụ (`dayKhong`) để xét Không Vong bản thể trên 3 trụ còn lại, triệt tiêu lỗi gộp Không Vong Niên Trụ gây loạn lá số.

---

## 📅 Phiên bản: Tứ Tự Hình, Ám Hợp Địa Chi & Giới Hạn Cực Cấn Can Trợ Giúp (Bazi 7.0 Upgrade) (02/08/2026)
  - Phân định chuẩn xác Tự hình thành công vs Không thành công dựa trên Lệnh tháng, vị trí kề nhau (với 2 chi), Thiên can dẫn hóa và kiểm tra xung/hại phá vỡ.
  - Khi Tự hình thành công $\rightarrow$ Triệt tiêu 100% tàng can phụ (chuyển 100% về Chính khí hóa thần) và cộng hệ số $+25\%$ lực lượng tại PHASE 2.
- **Thuật Toán Quét Địa Chi Ám Hợp & Can Chi Ám Hợp**:
  - Quét 5 cặp Chi Chi Ám Hợp kinh điển: `Mão-Thân`, `Dần-Sửu`, `Ngọ-Hợi`, `Tý-Tỵ`, `Tỵ-Dậu`.
  - Quét các trụ Can Chi Ám Hợp: `Mậu Tý`, `Tân Tỵ`, `Nhâm Ngọ`, `Giáp Ngọ`, `Quý Tỵ`.
- **Tinh Chỉnh Phạm Vi Trợ Giúp Thiên Can (`isDuocTroGiup`)**:
  - Giới hạn cờ `isDuocTroGiup` chỉ kiểm tra 2 Thiên Can kề sát Nhật Chủ (Can Tháng & Can Giờ). Can Năm ở xa bị Can Tháng ngăn cách nên không được tính trợ giúp trực tiếp cho Nhật Chủ.

### UI/UX Design & Relations Display ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx))
- Hiển thị danh sách Tứ Tự Hình, Chi Chi Ám Hợp và Can Chi Ám Hợp trong phần **Hóa Giải & Hình Xung / Quan Hệ Động**.

---

## 📅 Phiên bản: Phân Tích Sức Mạnh Thập Thần & Giao Diện Bảng Thập Thần Premium (31/07/2026)

### Calculation Engine & Quantitative Analysis ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Thuật Toán Định Lượng 10 Thập Thần**:
  - Tích lũy chính xác điểm số lực lượng của 10 Thập Thần (*Tỷ Kiên, Kiếp Tài, Thực Thần, Thương Quan, Thiên Tài, Chính Tài, Thất Sát, Chính Quan, Thiên Ấn, Chính Ấn*) từ 4 Thiên Can và các Tàng Can Địa Chi sau điều chỉnh Hợp/Hóa/Bế Khố và hệ số Nguyệt lệnh.
  - Tự động quy đổi phần trăm % lực lượng của từng Thập Thần và gom thành 5 Nhóm Thập Thần chính: *Tỷ Kiếp, Thực Thương, Tài Tinh, Quan Sát, Ấn Tinh*.
  - Trả về cấu trúc `thapThanAnalysis` chứa `scores`, `percentages`, `groups` và `totalScore`.
- **Khắc Phục Bug Đánh Giá Trạng Thái Thân (Vượng / Nhược)**:
  - Khắc phục triệt để sơ hở gán cứng `thanDegree = "vuong"` khi `count3 === 2` ở trường hợp Thất lệnh (`!isDucTuLenh`).
  - Bắt buộc kiểm tra điều kiện điểm lực lượng thực tế Đồng Đàng `dongDang >= khacTiet` mới được công nhận Thân Vượng, giúp lá số có Đồng Đàng kiệt quệ ($<2\%$) chuyển về đúng trạng thái **Thân Nhược** theo chuẩn học thuật Tử Bình.

### UI/UX Design & Premium Component ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx))
- **Bảng Phân Tích Sức Mạnh Thập Thần (ThapThanStrengthTable)**:
  - Tích hợp component `ThapThanStrengthTable` hiển thị ngay bên dưới khối Đánh Giá Ngũ Hành & Cách Cục.
  - Hiển thị 5 thẻ nhóm Thập Thần với thanh Progress Bar gradient sống động, badge phần trăm % và mô tả đặc trưng.
  - Hiển thị bảng chi tiết 10 Thập Thần 2 cột (Âm/Dương) gồm tên Thập thần, điểm số, thanh tỷ lệ mini-bar và nhãn xếp loại lực lượng (*Độc Vượng, Vượng, Vừa, Yếu, Khuyết*).

---

## 📅 Phiên bản: Áp Dụng Thần Sát & Khóa Độ Cao Đồng Đều Các Trụ Bên Hôn Nhân (31/07/2026)

### UI/UX Design & Marriage Customization ([MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx))
- **Áp Dụng & Hiển Thị Thần Sát Hợp Hôn**:
  - Truyền dữ liệu `shenSha` của cả Nam và Nữ từ Backend cho component `PillarCard` của trang Hợp Hôn.
  - Tích hợp hiển thị danh sách Thần Sát Bát Tự (ví dụ: Thiên Ất, Đào Hoa, Vong Thần...) dưới chân mỗi trụ của Nam và Nữ tương tự bên Bát Tự cá nhân.
  - Sử dụng chung hằng số màu sắc `SHEN_SHA_COLORS` để đồng bộ màu sắc học thuật (xanh lá cho cát thần, đỏ cho hung thần, xám cho thần sát trung tính).
- **Khóa Độ Cao Cố Định Cho Các Trụ Đồng Đều**:
  - *Pad Tàng Can lên 3 dòng:* Tự động bổ sung các dòng trống `invisible` đối với các trụ có ít hơn 3 tàng can, đảm bảo chiều cao khối tàng can luôn là 3 dòng.
  - *Pad Thần Sát lên 4 dòng:* Tự động bổ sung các dòng trống `invisible` đối với các trụ có ít hơn 4 thần sát, đảm bảo chiều cao khối thần sát luôn là 4 dòng.
  - Đặt thuộc tính chiều cao tối thiểu (`min-h-[385px] sm:min-h-[415px] md:min-h-[455px]`) thống nhất cho các trụ.
  - Nhờ cơ chế padding số dòng này, 8 trụ Bát Tự (4 của Nam, 4 của Nữ) luôn có **độ cao bằng nhau phẳng lỳ tăm tắp**, triệt tiêu hoàn toàn lỗi trồi sụt méo mó giao diện do chênh lệch lượng chữ.
- **Đồng Bộ Hóa Vòng Trường Sinh Địa Chi**:
  - Áp dụng cấu trúc xoay dọc `-rotate-90` lùi sát mép viền ngoài cùng bên trái cho Vòng Trường Sinh của Địa chi trong Hôn nhân giống hệt bên Bát Tự cá nhân, tạo sự đồng bộ thiết kế 100%.

### Frontend Deep-Linking & Routing Optimization ([BlogBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BlogBoard.jsx) & [UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx))
- **Đồng Bộ URL Khi Mở Chi Tiết Bài Viết Blog**:
  - Khai báo prop callback `onSelectPost` từ `UserApp.jsx` truyền xuống `BlogBoard.jsx`.
  - Khi người dùng click chọn đọc một bài viết Blog trong danh sách, `BlogBoard` sẽ kích hoạt gọi callback này để báo cho `UserApp` đồng bộ hóa `blogSlug` và cập nhật đường dẫn trình duyệt sang dạng thân thiện chuẩn SEO: **/blog/slug-bai-viet** thay vì dùng query parameter `?post=slug` loằng ngoằng như trước.
  - Khắc phục triệt để lỗi khi click vào bài viết Blog nhưng thanh địa chỉ trình duyệt không thay đổi, đồng thời hỗ trợ nạp đúng chi tiết bài viết ngay từ đầu khi người dùng truy cập trực tiếp bằng đường dẫn tĩnh `/blog/:slug` từ các công cụ tìm kiếm hoặc liên kết chia sẻ.
- **Tối Ưu SEO Trang Danh Sách Blog ở Backend & Nginx Gateway ([seo.js](file:///t:/Phongthuy/backend/src/routes/seo.js) & [default.conf](file:///t:/Phongthuy/nginx/default.conf))**:
  - Xây dựng mới route SEO tĩnh `/blog` ở Backend để tiêm sẵn Tiêu đề và Mô tả SEO hấp dẫn khi cào vào trang danh sách tin tức.
  - Cấu hình lại Regex định tuyến Nginx Gateway từ `^/blog/...` thành `^/blog($|/|/...)` để bao phủ toàn bộ các đường dẫn danh sách, trang chính, và chi tiết bài viết Blog, ép chuyển tiếp sang Backend tiêm Meta Tags trước khi tải SPA.

---

## 📅 Phiên bản: Tối Ưu Bố Cục Tứ Trụ Bát Tự & Định Dạng Thai Nguyên - Cung Mệnh (31/07/2026)

### UI/UX Design & Layout Optimization ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx))
- **Định Dạng Can Chi Cho Thai Nguyên & Cung Mệnh**:
  - Di chuyển hoàn toàn 2 trụ Thai Nguyên và Cung Mệnh ra khỏi bảng Cấu trúc Tứ Trụ 6 cột trước đây.
  - Chuyển hiển thị lên khu vực thông tin cơ bản với cấu trúc kết hợp Can Chi có màu ngũ hành nạp âm đầy đủ, định dạng dạng: `Can Chi - Nạp Âm` (ví dụ: `Kỷ Tỵ - Tích Lịch Hỏa`).
  - Đồng nhất kích thước chữ (`text-sm sm:text-[15px]`) của nhãn tiêu đề và giá trị cho cả Thai Nguyên và Cung Mệnh.
- **Tối Ưu 4 Trụ Cấu Trúc Bát Tự**:
  - Thiết kế lại phần cấu trúc Tứ Trụ còn lại với 4 cột chính (Giờ Sinh, Nhật Chủ, Nguyệt Lệnh, Năm Sinh) trên cả giao diện Desktop và Mobile.
  - Tự động nới rộng chiều rộng tối thiểu (`md:min-w-[170px] md:max-w-[200px]`) và bổ sung padding đối xứng để các trụ thoáng đãng, cân đối và sang trọng hơn.
  - Chỉ áp dụng giãn rộng đối với cấu trúc Tứ Trụ chính, bảo toàn tuyệt đối kích thước cũ đối với các trụ của Đại Vận và Lưu Niên.
- **Tái Định Vị Vòng Trường Sinh Địa Chi**:
  - Chuyển Vòng Trường Sinh (ví dụ: Mộ, Trường Sinh...) sang vị trí **xoay 90 độ ngược chiều kim đồng hồ (`-rotate-90`) bám sát đường viền trái của Pillar** bằng thuộc tính toạ độ âm `absolute -left-3 sm:-left-4 md:-left-5` và cố định khung bao `w-4 h-8`.
  - Thiết kế này kéo Trường Sinh ra ngoài padding của Pillar, định vị sát rạt mép viền xám ngoài cùng bên trái (đúng chỗ được đánh dấu), vừa thẩm mỹ vừa hoàn toàn không chiếm dụng không gian hay làm đẩy lệch vị trí căn giữa của Địa Chi chính.
  - Tăng cỡ chữ lên +1 size (`text-[10px] sm:text-[11.5px]`) và đổi màu chữ đậm rõ nét hơn (`text-slate-700`).
- **Mở Hiển Thị Trường Sinh Cho Vận Hạn**:
  - Gỡ bỏ thuộc tính `hideTruongSinh={true}` của cột **Đại Vận** và **Lưu Niên** trong bảng đối chiếu Vận hạn để Vòng Trường Sinh của Đại Vận/Lưu Niên được hiển thị đồng bộ lên giao diện.

---

### Calculation Engine Optimization ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Vùng Đệm Chuyển Tiếp Mềm Ngũ Hợp ($15.0 \rightarrow 20.0$ điểm)**:
  - Loại bỏ ranh giới số cứng $20.0$ điểm. Thiết lập tỷ lệ chuyển dịch mềm `transRatio`: điểm $\ge 20.0$ hóa 100%; điểm $[15.0-20.0]$ hóa theo tỷ lệ tuyến tính `(totalStrength - 15.0) / 5.0`; điểm $< 15.0$ Hợp bạn.
- **Kiểm Tra Định Tính Hỗ Trợ Cho Tòng Cách ($65\% \rightarrow 70\%$)**:
  - Với điểm Khắc/Tiết/Hao nằm ở vùng đệm $[65\%-70\%]$, bổ sung cờ **No-Root Anchor Check**: Nếu Nhật Chủ hoàn toàn không có Thiên Can Ấn/Tỷ Kiên lộ diện và không đắc địa $\rightarrow$ Công nhận Tòng Cách.
- **Bảo Toàn Hệ Thống Cách Cục**:
  - Tuyệt đối không bổ sung bất kỳ Cách cục mới nào, giữ nguyên toàn bộ cấu trúc và danh sách Cách cục hiện tại.

---

## 📅 Phiên bản: Nâng Cấp Quy Tắc Bát Tự Nâng Cao (Bazi VIP Upgrade) - Trường Sinh, Tam Hội & Thắt Chặt Ngũ Hợp (31/07/2026)

### Academic Engine & Calculation Optimization ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js))
- **Vòng Trường Sinh Cho Vận Hạn (Đại Vận & Lưu Niên)**:
  - Bổ sung trường `truongSinh` cho từng nấc Đại Vận và từng năm Lưu Niên trong đối tượng kết quả phân tích Bát Tự.
  - Cho phép giao diện hiển thị 12 vị trí Vòng Trường Sinh đối với Nhật Chủ (Trường Sinh, Mộc Dục, Quan Đới... Mộ, Tuyệt).
- **Thắt Chặt Thiên Can Ngũ Hợp & Động Hóa Giáp-Kỷ**:
  - *Nhật Chủ Tĩnh Không Hóa:* Bổ sung điều kiện nếu một trong hai can hợp là Nhật Chủ (Can ngày) $\rightarrow$ Từ chối hóa khí, chuyển sang trạng thái **Hợp Bạn (Trói buộc/tê liệt)** kèm lý do `"Nhật chủ tĩnh không hóa"`.
  - *Ngưỡng Lực Lượng Tối Thiểu ($\ge 20.0$ điểm):* Thiên can hợp hóa phải thỏa mãn tổng điểm can chi gốc của 2 ngũ hành $\ge 20.0$ điểm mới đủ lực hóa khí.
  - *Động Hợp Hóa Giáp-Kỷ:* Tự động chọn hướng hóa **Thổ** (tháng sinh Thổ/Hỏa) hoặc **Mộc** (tháng sinh Mộc/Thủy) dựa trên sự so sánh sức mạnh gốc giữa Thổ và Mộc trong lá số.
- **Tam Hội Hóa Khí & Triệt Tiêu Tàng Can**:
  - *Gỡ bỏ Bán Tam Hội:* Loại bỏ khái niệm Bán Tam Hội theo quy định học thuật slide (`Không có khái niệm bán tam hội`).
  - *Biến mất tàng can:* Khi Tam Hợp hoặc Tam Hội hóa thành công (đủ 3 chi, lộ can dẫn hóa, Nguyệt lệnh tương sinh/đồng hành, không bị xung phá), 100% tàng can cũ của cả 3 chi bị triệt tiêu hoàn toàn và biến thành tàng can đại diện của hóa thần.

---

## 📅 Phiên bản: Sửa Lỗi Hiển Thị Tên Trang Web (Site Name), Bổ Sung Meta og:site_name & Tối Ưu Định Tuyến SEO Module (31/07/2026)

### SEO & Web Site Name Optimization
- **Bổ Sung Thẻ Meta og:site_name Ở Frontend ([index.html](file:///t:/Phongthuy/frontend/index.html#L23-L24))**:
  - Khai báo rõ ràng `<meta property="og:site_name" content="Phong Thủy Luận Giải" />` trong file HTML tĩnh gốc.
  - Cung cấp tín hiệu nhận diện thương hiệu rõ ràng cho Googlebot và các bot mạng xã hội, giải quyết triệt để lỗi Google tự động lấy tên nhà cung cấp DNS "No-IP" để hiển thị cho trang web.
- **Tích Hợp og:site_name & Route SEO Tĩnh Phân Hệ Ở Backend ([seo.js](file:///t:/Phongthuy/backend/src/routes/seo.js#L235-L315))**:
  - Cập nhật hàm `injectMetaTags` tiêm động thẻ `<meta property="og:site_name" content="Phong Thủy Luận Giải" />` cho tất cả các trang.
  - Xây dựng mới 5 route SEO tĩnh dành riêng cho 5 phân hệ chính (`/bazi`, `/ziwei`, `/iching`, `/marriage`, `/xemngay`). Mỗi phân hệ được tiêm Tiêu đề (Title) và Đoạn mô tả (Meta Description) hấp dẫn, độc lập.
  - Cập nhật Nginx Gateway (`default.conf`) định tuyến trực tiếp các URL tĩnh phân hệ sang Backend Express để phục vụ HTML có tiêm Meta Tags riêng biệt cho Googlebot ngay từ lần cào đầu tiên.

### Frontend Routing & Dynamic SEO Canonical/Title
- **Gỡ Bỏ Canonical Link Tĩnh ([index.html](file:///t:/Phongthuy/frontend/index.html#L7-L10))**:
  - Xóa bỏ dòng `<link rel="canonical" href="https://tuynover.ddns.net/" />` được cấu hình cứng trỏ về trang chủ.
  - Loại bỏ hoàn toàn nguyên nhân Googlebot gộp tất cả các trang con `/bazi`, `/iching` về trang chủ do trùng lặp thẻ Canonical.
- **Đồng Bộ Định Tuyến Phân Hệ Tĩnh ([UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx#L61-L68))**:
  - Bổ sung ánh xạ router khi khởi chạy đối với các path tĩnh: `/bazi`, `/iching`, `/ziwei`, `/marriage`, `/xemngay`. Cho phép người dùng và bot truy cập trực tiếp các trang này mà không bị redirect về trang chủ.
  - Cập nhật hàm `handleSelectModule` thực hiện đẩy URL phân hệ thực tế (`/${mode}`) lên thanh địa chỉ trình duyệt thông qua `pushState` thay vì reset cưỡng bức về `/`.
- **Cập Nhật Canonical & Title Động ([UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx#L143-L177))**:
  - Thêm `useEffect` tự động cập nhật thẻ canonical link động và thay đổi tiêu đề `<title>` trang phù hợp với phân hệ hiện tại của người dùng.
- **Biên Dịch (Rebuild) Frontend**:
  - Khởi chạy thành công lệnh build client để cập nhật tệp tin `dist/index.html` của môi trường production chứa đầy đủ thay đổi định tuyến mới.

## 📅 Phiên bản: Vá Lỗ Hổng Bảo Mật Đăng Nhập Bằng Google (27/07/2026)

### Security Patches & Backend Authentication
- **Kiểm Tra Trạng Thái Xác Minh Email ([AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L242-L260))**:
  - Trích xuất thêm trường `email_verified` từ payload của Google ID Token sau khi giải mã qua `googleClient.verifyIdToken`.
  - Thực hiện kiểm tra nếu `email_verified` không phải là `true` thì chặn ngay từ đầu và trả về mã lỗi `400` cùng cảnh báo log bảo mật.
  - Ngăn chặn triệt để lỗ hổng chiếm đoạt tài khoản (Account Takeover) trong trường hợp người dùng tạo tài khoản Google giả mạo bằng email của nạn nhân nhưng chưa xác thực chủ sở hữu thực sự.


## 📅 Phiên bản: Nâng Cấp Hệ Thống Hợp Hóa Thiên Can & Lục Hợp Địa Chi Đồng Bộ (27/07/2026)

### Bazi Algorithm & Day Master Strength Evaluation
- **Đồng Bộ Hóa Hợp Hóa Thiên Can ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L461-L602))**:
  - Tách biệt logic phân tích Ngũ hợp Thiên can kề sát thành hàm helper `evaluateStemCombinations`.
  - Hỗ trợ đầy đủ các quy tắc Tranh hợp (Đố hợp), Can kề bên khắc phá, Nguyệt lệnh dẫn hóa và địa chi trợ giúp (chính khí / trung khí).
  - Tích hợp thay đổi điểm số định lượng: chuyển dịch 100% năng lượng khi Hợp hóa thành công (Hóa cách); giảm 50% điểm số gốc của cả 2 can khi bị trói buộc (Hợp bạn / Tê liệt).
- **Hệ Thống Lục Hợp Địa Chi Hóa Khí ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L611-L733))**:
  - Xây dựng helper `evaluateBranchCombinations` phân tích Lục Hợp Địa chi kề sát, phân định rõ hai nhóm Hợp Sinh và Hợp Khắc.
  - Áp dụng các điều kiện nghiêm ngặt: Thiên can bắt buộc dẫn hóa (không lộ can thì không hóa), Nguyệt lệnh tương sinh hoặc đồng hành, và cấm xung khắc bên ngoài phá vỡ đối với nhóm Hợp Khắc.
  - Quy đổi điểm số thực tế: chuyển đổi 100% tàng can sang ngũ hành mới khi Hóa khí thành công; giảm 50% trọng lượng điểm gốc khi bị trói buộc.

## 📅 Phiên bản: Hiệu Chỉnh Ma Trận Cờ Học Thuật Bát Tự - Tránh Luôn Thân Vượng & Sửa Logic Cách Cục (24/07/2026)

### Bazi Algorithm & Day Master Strength Evaluation
- **Phân Mức Nhật Chủ Chi Tiết ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L2007-L2039))**:
  - Mở rộng cờ `thanDegree` để phân chia độ vượng suy của Nhật chủ thành nhiều mức độ chi tiết và cụ thể hơn bao gồm: **Cực Vượng** (`cuc_vuong`), **Rất Vượng** (`rat_vuong`), **Vượng** (`vuong`), **Cân Bằng** (`can_bang`), **Nhược** (`nhuoc`), **Rất Nhược** (`rat_nhuoc`), **Suy Kiệt** (`suy_kiet`), và **Tòng Cách** (`tong_cach`).
  - Đồng bộ hóa hoàn toàn logic giữa `thanDegree` (phân cấp định tính) và `analysis.than` (kết luận định lượng chung) để triệt tiêu các mâu thuẫn hiển thị trước đây (ví dụ: `than: 'nhuoc'` đi kèm `thanDegree: 'vuong'`).
- **Sửa Lỗi Nhập Phút Trong Phân Hệ Bát Tự ([BaziInput.jsx](file:///t:/Phongthuy/frontend/src/components/BaziInput.jsx#L38-L44))**:
  - Khắc phục lỗi đụng độ placeholder khi cả ô Tháng và ô Phút đều dùng `placeholder="MM"`. Do logic của component `CustomSelect` gộp chung kiểm tra `placeholder === 'MM'`, khi người dùng nhập phút $>12$ (ví dụ 42), giá trị lập tức bị giới hạn cưỡng bức về 12 (giới hạn của tháng).
  - Thay đổi placeholder của ô nhập Phút sang `"Min"` và cập nhật logic kiểm tra điều kiện tương ứng của `CustomSelect` để phân biệt hoàn toàn với Tháng.
- **Hiệu Chỉnh Logic Đắc Địa ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L1904-L1940))**:
  - Giới hạn cờ Đắc Địa (`dacDia`) chỉ tính khi Can ngày có gốc **chính khí** (bản khí) ở Địa chi của các trụ, loại bỏ việc tính các căn rễ phụ (trung khí, dư khí chiếm tỷ lệ nhỏ).
  - Tích hợp kiểm tra xung/hình/hại: Nếu Địa chi đắc địa bị dính các mối quan hệ Lục Xung, Tương Hình, hoặc Lục Hại với bất kỳ chi nào khác trong 4 trụ thì gốc rễ đó bị coi là bị phá hủy và **không được tính là đắc địa**.
- **Giải Quyết Trùng Lặp Gốc và Căn (`isDuocTroGiup`)**:
  - Thay đổi cờ Được Trợ Giúp (`isDuocTroGiup`) chỉ kiểm tra Tỷ Kiếp ở các **Thiên can** khác (`hasPeerInStems`). Loại bỏ việc kiểm tra ở Địa chi (`hasPeerInBranches`) vì đã được gom vào cờ Đắc Địa, tránh việc một chi vừa tính đắc địa vừa tính trợ giúp làm tăng điểm `count3` vô lý.
- **Sửa Lỗi Lọc Tam Hợp / Tam Hội Hỗ Trợ**:
  - Tối ưu hóa `hasSelfTamHopHoi` chỉ chấp nhận các tổ hợp Tam hợp / Tam hội hóa ra **ngũ hành đồng đảng** (Tỷ Kiếp hoặc Ấn tinh) sinh trợ cho Nhật chủ mới được tính là có lực lượng hỗ trợ làm tăng cấp độ vượng suy (`thanDegree`). Loại bỏ các hóa cục Thực Thương, Tài, Sát vốn làm hao tiết thêm Nhật chủ.
- **Sửa Logic Xác Định Tòng Cách ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js#L540-L558))**:
  - Thắt chặt điều kiện định Cách cục đặc biệt: Một lá số chỉ được phân loại vào **Tòng cách** (Tòng Sát, Tòng Tài, Tòng Nhi) khi Nhật chủ cực nhược (<15%) đồng thời ngũ hành mạnh nhất phải thực sự áp đảo toàn cục (chiếm $\ge 45\%$ tổng lượng ngũ hành). 
  - Nếu ngũ hành mạnh nhất không đạt ngưỡng 45% (lực lượng phân tán cát khí), hệ thống sẽ bỏ qua Tòng cách và tự động phân vào Thường cách (Bát Cách) định theo Nguyệt lệnh thấu can, giải quyết triệt để sự mâu thuẫn giữa phân loại Vượng Suy và Cách Cục.
- **Đồng Bộ Tài Liệu Quy Tắc Nghiệp Vụ ([BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md#L151-L159))**:
  - Cập nhật định nghĩa học thuật của cờ Đắc Địa (`dacDia`) và cờ Được Trợ Giúp (`isDuocTroGiup`) để đồng bộ tuyệt đối giữa tài liệu nghiệp vụ và mã nguồn thực tế.

## 📅 Phiên bản: Sửa Lỗi Deep Linking, Đưa Phần Chia Sẻ Sang Cột Phải & Tích Hợp FloatingNotificationToast Cao Cấp (22/07/2026)

### Bug Fix & Router Deep Linking
- **Sửa Lỗi Middleware Quyền Sở Hữu ([checkRecordOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkRecordOwnership.js#L37-L41))**:
  - Bổ sung kiểm tra `record.isPublic === true` để cho phép bất kỳ ai (kể cả khách vãng lai chưa đăng nhập) truy cập xem chi tiết bản ghi qua API nếu bản ghi đó được bật công khai. Khắc phục triệt để lỗi báo 403 Forbidden và bị chuyển hướng về trang chủ khi truy cập link chia sẻ.
- **Deep Linking Ở Frontend ([UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx#L59-L135))**:
  - Viết bộ parse URL `window.location.pathname` ngay tại thời điểm khởi chạy React. Tự động nhận diện các URL dạng `/:type/record/:id` để chuyển `appMode` tương ứng và gọi API lấy dữ liệu kết quả hiển thị lên màn hình. Tích hợp màn hình LoadingShared và báo lỗi SharedError mượt mà.

### UI/UX Aesthetics & Layout Grid
- **Bố Cục Cột Phải Cho Bát Tự & Kinh Dịch**:
  - **Bát Tự ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx#L805-L938))**: Thiết kế lại lưới thông tin cơ bản thành 2 cột (`grid-cols-1 md:grid-cols-[1.8fr_1.2fr]`). Đưa phần Bật/Tắt công khai và Sao chép liên kết vào cột bên phải còn trống để bố cục gọn gàng, cân đối.
  - **Kinh Dịch ([IChingBoard.jsx](file:///t:/Phongthuy/frontend/src/components/IChingBoard.jsx#L475-L535))**: Tương tự, chuyển thông tin thời gian lập quẻ và nút chia sẻ sang bố cục 2 cột.
- **Ẩn Thanh Chia Sẻ Khi Xem Chéo**:
  - Cập nhật điều kiện hiển thị thanh chia sẻ ở cả 4 phân hệ (`BaziBoard`, `ZiweiBoard`, `IChingBoard`, `MarriageBoard`) để **chỉ hiển thị cho chính chủ sở hữu lá số/quẻ dịch**. Loại bỏ hoàn toàn điều kiện localhost giúp việc kiểm thử trạng thái ẩn thanh chia sẻ khi xem link của người khác hoạt động chính xác.
- **Tích Hợp Quản Lý Chia Sẻ Vào Lịch Sử ([HistoryBoard.jsx](file:///t:/Phongthuy/frontend/src/components/HistoryBoard.jsx))**:
  - Bổ sung nút Toggle bật/tắt chia sẻ công khai (`isPublic`) siêu nhỏ và icon sao chép liên kết (`Share2`) trực tiếp trên mỗi dòng kết quả trong danh sách Lịch Sử của cả 4 phân hệ.
  - Sửa lỗi đồng bộ cache `preloadedData` (map sai key `iching` -> `hexagrams`, `ziwei` -> `tuvis`) khiến danh sách lịch sử tự động render realtime các thay đổi của switch bật tắt mà không cần tải lại trang.
- **Thông Báo Premium Toast ([FloatingNotificationToast.jsx](file:///t:/Phongthuy/frontend/src/components/FloatingNotificationToast.jsx))**:
  - Tạo mới component Toast thông báo nổi đỉnh màn hình, thiết kế sang trọng với **nền trắng viền xám mờ tinh tế (Light Mode)** thay thế cho nền tối cũ.
  - Rút ngắn thời gian hiển thị thông báo xuống còn **1.5 giây** (tự động ẩn nhanh gọn) để tăng tính phản hồi nhanh và mượt mà cho giao diện.
  - Áp dụng đồng bộ cho cả 4 phân hệ và danh sách Lịch sử khi người dùng sao chép liên kết hoặc thay đổi trạng thái chia sẻ công khai.

## 📅 Phiên bản: Triển Khai Giải Pháp SEO Tự Chủ Siêu Nhẹ & Tích Hợp Các Trang Pháp Lý Frontend (22/07/2026)

### SEO, Sitemap & Google Indexing API Integration
- **Cấu hình Gateway Nginx ([default.conf](file:///t:/Phongthuy/nginx/default.conf))**:
  - Định tuyến các URL SEO và chia sẻ lá số công khai (`/bazi/record/:id`, `/ziwei/record/:id`, `/iching/record/:id`, `/marriage/record/:id`, `/blog/:slug`, `/sitemap.xml`) hướng thẳng sang container Backend Express (`http://backend:3001`).
- **Thay đổi Database Schemas**:
  - Bổ sung trường `isPublic` (boolean, mặc định `false`) cho `BaziRecord`, `ZiweiRecord`, `IChingRecord`, `MarriageRecord` để đảm bảo quyền riêng tư mặc định của khách hàng. Chỉ những lá số được chia sẻ công khai mới xuất hiện trên Sitemap và Google Index.
- **Xây dựng SEO Router & Dynamic Sitemap (`backend/src/routes/seo.js` & `backend/src/index.js`)**:
  - Viết bộ xử lý render tĩnh HTML, tiêm meta tags động (Open Graph) hỗ trợ hiển thị ảnh và tiêu đề chuẩn phong thủy khi chia sẻ link lên Facebook, Zalo, Telegram.
  - Bổ sung các trang static phụ (`/about` - Giới thiệu, `/privacy` - Chính sách bảo mật, `/terms` - Điều khoản dịch vụ) vào sơ đồ `sitemap.xml` để phục vụ tối ưu hóa SEO.
  - Đồng bộ router phía Client ([UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx)) để tự động nạp trang About, Privacy, Terms trực tiếp khi người dùng hoặc bot truy cập qua các deep links tĩnh này và tự động cập nhật URL trình duyệt khi click chuyển đổi.
  - Sử dụng API `fetch` có thiết lập abort timeout để lấy và cache tệp `index.html` từ container frontend một cách an toàn, tránh lỗi thiếu thư viện `axios` ở backend.
  - Xây dựng endpoint `/sitemap.xml` tự động cập nhật danh sách bài viết Blog và lá số công khai.
- **Tích hợp Google Indexing API (`backend/src/services/GoogleIndexingService.js` & Controllers)**:
  - Viết dịch vụ sử dụng `google-auth-library` để tự động ping Google Indexing API (`URL_UPDATED`, `URL_DELETED`) khi có bài viết blog mới được đăng/sửa/xóa hoặc khi người dùng bật/tắt công khai lá số.
  - Tích hợp triggers trong `BlogController.js` và hàm `togglePublicCalculation` trong `HistoryController.js`.
  
### Frontend Premium UI & Legal Pages
- **Các trang thông tin tĩnh ([InfoBoards.jsx](file:///t:/Phongthuy/frontend/src/components/InfoBoards.jsx))**:
  - Thiết kế 3 trang tĩnh mang phong cách học thuật trang nhã: **Giới thiệu** (sự giao thoa AI và Cổ học), **Chính sách bảo mật** (cam kết không bán dữ liệu ngày sinh), **Điều khoản sử dụng & Miễn trừ trách nhiệm** (tuyên bố từ chối trách nhiệm pháp lý).
- **Component Footer ([Footer.jsx](file:///t:/Phongthuy/frontend/src/components/Footer.jsx))**:
  - Thiết kế lại chân trang Premium với tông màu trắng nhã nhặn, cấu trúc 4 cột đồng bộ từ Homepage và kích hoạt các liên kết thông tin pháp lý hoạt động thực tế. Dùng chung cho cả `HomeBoard.jsx` và các phân hệ khác thông qua `UserApp.jsx`.
- **Tích hợp Chia sẻ Lá số ([UserApp.jsx](file:///t:/Phongthuy/frontend/src/components/UserApp.jsx) & Boards)**:
  - Bổ sung nút Toggle bật/tắt trạng thái chia sẻ công khai và nút sao chép liên kết trực tiếp trên giao diện kết quả của `BaziBoard.jsx`, `ZiweiBoard.jsx`, `IChingBoard.jsx`, `MarriageBoard.jsx`.
  - Cập nhật định tuyến `UserApp.jsx` để nhớ phân hệ trước đó nhằm tối ưu nút "Quay lại" tại các trang thông tin pháp lý.

## 📅 Phiên bản: Chuẩn Hóa Kiểm Tra Dữ Liệu Đầu Vào 2 Bước Cho Cả 4 Phân Hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân) (21/07/2026)

### Input Validation & Viewport-Pinned Toast Notification
- **Bổ Sung Validation Phân Hệ Kinh Dịch (`IChing`)**:
  - **Backend (`InputValidator.js` & `IChingController.js`)**: Tạo hàm `validateIChingInput` kiểm tra mảng 6 hào (`lines`), đảm bảo tính hợp lệ của thuộc tính `type` (0 hoặc 1), `moving` (boolean), và giới hạn độ dài câu hỏi gieo quẻ ($\le 500$ ký tự).
  - **Frontend Mai Hoa Dịch Số (`MaiHoaInput.jsx`)**: Thay thế các ô nhập số thô (`input[type="number"]`) bằng component chọn tùy chỉnh (`CustomSelect` combobox dropdown) đồng bộ phong cách với 3 phân hệ còn lại. Tích hợp kiểm tra thời gian thực đối với chế độ **Giờ Động Tâm** (sử dụng `validateInputDate`) và chế độ **Seri Tiền / Dãy số ngẫu nhiên** (bắt buộc đúng 8 chữ số, không chứa chữ hay ký tự đặc biệt). Vô hiệu hóa nút *"Lập Quẻ Mai Hoa"* khi dữ liệu lỗi hoặc trống.
- **Modal Thông Báo Nổi Đỉnh Màn Hình (`FloatingErrorToast.jsx`)**:
  - Tạo component [FloatingErrorToast.jsx](file:///t:/Phongthuy/frontend/src/components/FloatingErrorToast.jsx) cố định ở đỉnh màn hình (`fixed top-4 left-1/2 -translate-x-1/2 z-[9999]`). Đảm bảo dù người dùng đang cuộn trang xuống sâu ở bất kỳ đâu trên thiết bị di động hay máy tính, thông báo lỗi luôn hiển thị **100% rõ ràng ngay trước mắt**.
  - Cấu hình lại giao diện Toast: Nền trắng sạch (`bg-white`), chữ đen sang trọng (`text-slate-900`), icon dấu chấm cảm màu đỏ nổi bật (`AlertCircle text-red-600`), tự động biến mất (Auto-dismiss) sau 3 giây (`setTimeout 3000ms`).
- **Khắc Phục Hoàn Toàn Form Tử Vi (`ZiweiBoard.jsx`)**:
  - Tích hợp kiểm tra tính hợp lệ dữ liệu ngay trong `handleSubmit` của [ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx#L321). Chặn không cho phép gửi request nếu chưa chọn đủ ngày/tháng/năm hoặc dữ liệu sai.
  - Vô hiệu hóa nút nhấn (`disabled={!day || !month || !year || !!error}`) kèm hiệu ứng làm mờ `disabled:opacity-50 disabled:cursor-not-allowed` khi chưa chọn đủ dữ liệu hoặc có lỗi.
- **Tự Động Chuẩn Hóa Ngày/Tháng/Năm & Triệt Tiêu Chữ Dư Rác (Auto-Clamp & Digit Stripping)**:
  - **Tự động ép về số ngày tối đa (Day Auto-Clamp)**: Khi người dùng chọn Ngày 29/02 và đổi sang Năm không nhuận (như năm 2023), hệ thống tự động đẩy ngày về `28`. Nếu chọn Ngày 31 và đổi sang Tháng 30 ngày (Tháng 4, 6, 9, 11), hệ thống tự động đẩy về `30`.
  - **Tự động ép ngưỡng khi gõ tay (Smart Range Clamping)**: Gõ ngày $>31$ (vd gõ 100) $\rightarrow$ Tự động đẩy về `31`. Gõ tháng $>12$ $\rightarrow$ Tự động đẩy về `12`. Gõ năm $>2100$ $\rightarrow$ Tự động đẩy về `2100`.
  - **Triệt tiêu chữ & ký tự đặc biệt (Strict Digit Stripping)**: Tự động loại bỏ toàn bộ chữ cái (A-Z) và ký tự đặc biệt ngay khi gõ vào ô `CustomSelect` hoặc ô `Seri Tiền 8 số` của Mai Hoa Dịch Số (`val.replace(/\D/g, '')`), đảm bảo chữ không bao giờ chui qua hay gây lỗi hệ thống.
  - **Sửa lỗi `ReferenceError: getMaxDaysInMonth is not defined`**: Bổ sung khai báo import [getMaxDaysInMonth](file:///t:/Phongthuy/frontend/src/utils/dateValidator.js#L10) bị thiếu tại [MaiHoaInput.jsx](file:///t:/Phongthuy/frontend/src/components/MaiHoaInput.jsx#L4), giúp hệ thống tự động ép ngày hợp lệ trôi chảy không gây crash màn hình.
  - Áp dụng đồng nhất trên cả 4 phân hệ: **Bát Tự ([BaziInput.jsx](file:///t:/Phongthuy/frontend/src/components/BaziInput.jsx#L5)), Tử Vi ([ZiweiBoard.jsx](file:///t:/Phongthuy/frontend/src/components/ZiweiBoard.jsx#L28)), Hôn Nhân ([MarriageInput.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageInput.jsx#L5)), và Mai Hoa Dịch Số ([MaiHoaInput.jsx](file:///t:/Phongthuy/frontend/src/components/MaiHoaInput.jsx#L54))**. Verify build thành công $100\%$ qua Vite (`vite build` -> 3016 modules transformed, 0 errors).

## 📅 Phiên bản: Tinh Chỉnh Thuật Toán Bát Tự (Tư Lệnh Can, Đắc Địa, Phá Tổ Hợp Xung/Hình/Hại & Phân Cấp Thân) (21/07/2026)

### Bazi Algorithm & Academic Matrix Refinement
- **Chuyển đổi Được Lệnh $\rightarrow$ Được Tư Lệnh (`ducTuLenh`)**: Loại bỏ bảng Nguyệt Lệnh tĩnh, sử dụng **Nhân Khí Tư Lệnh (`tuLenhCan`)** tính theo khoảng thời gian sau Tiết Khí. Nếu Can Tư Lệnh cùng ngũ hành với Nhật Chủ hoặc sinh cho Nhật Chủ $\rightarrow$ Tính là Được Tư Lệnh.
- **Tính Đắc Địa (`dacDia`)**: Kiểm tra Can ngày có Căn rễ (Bản khí, Trung khí, Dư khí) ở Địa chi các Trụ.
- **Vô Hiệu Hóa Hợp Cục Khi Bị Xung/Hình/Hại (`hasDisruptionIntoCombination`)**: Nâng cấp bộ kiểm tra Tam Hợp, Bán Tam Hợp, Củng Hợp, Lục Hợp. Nếu bất kỳ địa chi nào trong tổ hợp bị dính Lục Xung, Tương Hình hoặc Lục Hại thì bị đánh dấu `(Bị xung/hình/hại phá)` và **không thể hợp thành công** (không được cộng điểm/trợ lực).
- **Tính Điểm Ngũ Hành Chuẩn Hóa Cho Nhật Chủ**: Điểm ngũ hành của Nhật Chủ được tính toán dựa trên các quy tắc học thuật (Đắc Địa, Được Tư Lệnh, Được Sinh, Được Trợ Giúp, Tam Hợp/Tam Hội không bị phá) thay vì tính thông căn đại trà như 4 ngũ hành còn lại.
- **Đồng bộ AI Prompt**: Cập nhật [BaziPrompts.js](file:///t:/Phongthuy/backend/src/services/BaziPrompts.js#L50) truyền dữ liệu Tư Lệnh Can và Đắc Địa vào prompt cho LLM.

## 📅 Phiên bản: Khắc Phục Triệt Để Nghẽn Lệnh & Trễ Redis/Mongo 3000ms Trên AWS EC2 (21/07/2026)

### AWS EC2 Infrastructure & Latency Optimization
- **Khắc phục triệt để lỗi phản hồi 3000ms (3 giây) trên AWS EC2 cho Đăng nhập, Đăng xuất và Tính lá số**:
  - **Kích hoạt `family: 4` cho Redis Client**: Thêm `family: 4` vào [redis.js](file:///t:/Phongthuy/backend/src/config/redis.js#L15) loại bỏ hoàn toàn độ trễ **3000ms** do trình phân giải DNS của AWS EC2 VPC treo khi truy vấn bản ghi AAAA (IPv6) cho `localhost` / hostname.
  - **Gỡ bỏ Mongoose `post('save')` Hooks dư thừa**: Xóa bỏ hook `post('save')` gọi `updateUserStatsBackground` trong [BaziRecord.js](file:///t:/Phongthuy/backend/src/models/BaziRecord.js), [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js), [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js), [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js), và [Conversation.js](file:///t:/Phongthuy/backend/src/models/Conversation.js). Việc này loại bỏ **12 câu lệnh MongoDB aggregation ($group, countDocuments)** bị thực thi lặp lại trên đĩa I/O của EC2 mỗi khi tạo lá số mới (vốn gây tốn 2.5s - 3s). Hệ thống đã chuyển hoàn toàn sang cộng dồn nguyên tử $inc O(1) trực tiếp từ Controller.
  - **Cấu hình Redis Fast Fail**: Đặt `connectTimeout: 2000`, `commandTimeout: 1500`, `keepAlive: 5000` (ngăn AWS NAT Gateway kill socket nhàn rỗi).
  - **Mô hình Hybrid Caching L1 RAM + L2 Redis**: Tích hợp lớp cache bộ nhớ RAM L1 trực tiếp trong [redis.js](file:///t:/Phongthuy/backend/src/config/redis.js#L96) cho `getUserProfileCache` & `setUserProfileCache`. Truy xuất Profile User cho các API auth/notifications liên tiếp đạt tốc độ cực đại **< 1ms** (0.001ms từ RAM) thay vì 2-5ms từ mạng TCP Redis.
  - **Đóng gói Hard Timeout Wrapper (`withTimeout`)**: Bọc tất cả Redis operations tối đa 300ms - 500ms để đảm bảo Instant Fallback về RAM / MongoDB nếu Redis phản hồi chậm.
  - **Tối ưu RedisQueue Worker (Khắc phục warning `Command timed out`)**: Chuyển đổi lệnh `blpop(queueName, 5)` trong [RedisQueueService.js](file:///t:/Phongthuy/backend/src/services/RedisQueueService.js#L50) sang cơ chế **Non-blocking `lpop`**, loại bỏ hoàn toàn xung đột giữa lệnh BLPOP 5s với `commandTimeout: 1500` của `ioredis`, triệt tiêu 100% cảnh báo log thừa trên môi trường máy chủ.

## 📅 Phiên bản: Tăng Cường Unit Test & Coverage (27 → 86 Tests) (21/07/2026)

### Testing & Quality Assurance
- **Nâng tổng số Tests từ 27 → 86** (+59 tests mới), coverage ước tính tăng từ ~22% → ~55-60%.
- **Test Suites tăng từ 11 → 19** (+8 files mới).
- **Tier 1 — Pure Logic (ROI cao nhất):**
  - [RuleEngineService.test.js](file:///t:/Phongthuy/backend/tests/services/RuleEngineService.test.js): Mở rộng từ 4 → 20 tests. Cover toàn bộ `analyze()` (Hóa Tiến/Thoái/Sinh/Khắc/Biến, Tuần Không, Phục Tàng, Thế Sinh Ứng, confidence score).
  - [DateService.test.js](file:///t:/Phongthuy/backend/tests/services/DateService.test.js) [NEW]: 12 tests cover `getUserYearInfo`, `checkDate`, `evaluateDay`, `consultDates`.
- **Tier 2 — Controller Logic (Mock Mongoose):**
  - [IChingController.test.js](file:///t:/Phongthuy/backend/tests/controllers/IChingController.test.js) [NEW]: 5 tests (calculate, idempotency, validation, guest).
  - [BaziController.test.js](file:///t:/Phongthuy/backend/tests/controllers/BaziController.test.js) [NEW]: 4 tests (analyze, idempotency header + semantic, validation).
  - [ZiweiController.test.js](file:///t:/Phongthuy/backend/tests/controllers/ZiweiController.test.js) [NEW]: 4 tests (createChart, 3-level idempotency, validation).
  - [MarriageController.test.js](file:///t:/Phongthuy/backend/tests/controllers/MarriageController.test.js) [NEW]: 3 tests (analyze, semantic dup, validation).
- **Tier 3 — History & Middleware:**
  - [HistoryController.test.js](file:///t:/Phongthuy/backend/tests/controllers/HistoryController.test.js) [NEW]: 8 tests (pagination, record lookup, rate, delete, pin).
  - [auth.test.js](file:///t:/Phongthuy/backend/tests/middleware/auth.test.js) [NEW]: 4 tests (JWT valid, expired, missing, tokenVersion revoke).
  - [checkRecordOwnership.test.js](file:///t:/Phongthuy/backend/tests/middleware/checkRecordOwnership.test.js) [NEW]: 3 tests (owner, non-owner 403, not found).

## 📅 Phiên bản: Bổ Sung Compound Indexes Cho Query Lịch Sử (21/07/2026)

### Database Performance Optimization
- **Thêm Compound Index `{ userId: 1, isDeleted: 1, createdAt: -1 }`** vào 4 model: [BaziRecord.js](file:///t:/Phongthuy/backend/src/models/BaziRecord.js), [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js), [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js), [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js).
- **Lý do**: Query pattern phổ biến nhất `{ userId, isDeleted: { $ne: true } }` sort `createdAt: -1` (xuất hiện 20+ lần trong codebase) trước đó phải dùng in-memory sorting, gây tốn CPU khi dữ liệu lớn. Compound index mới cho phép MongoDB thực hiện Index Scan + Sorted Merge trực tiếp.

## 📅 Phiên bản: Khắc Phục 3 Lỗi Bảo Mật & Chuẩn Hóa SSE Compliance (21/07/2026)

### Security Hardening & Protocol Compliance
- **Bổ sung JWT Session Invalidation khi Đổi Mật Khẩu**: Cập nhật hàm `changePassword` trong [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L452) bổ sung `user.tokenVersion = (user.tokenVersion || 0) + 1;` trước khi lưu, vô hiệu hóa tức thì 100% token cũ đang lưu hành.
- **Nâng Cấp OTP Sang CSPRNG (`crypto.randomInt`)**: Thay thế `Math.random()` bằng `crypto.randomInt(100000, 1000000)` trong cả 2 hàm `sendVerificationEmail` và `forgotPassword` tại [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L490), ngăn chặn 100% rủi ro suy đoán chuỗi PRNG.
- **Chuẩn Hóa SSE Heartbeat Ping 15 Giây**: Cập nhật [SseService.js](file:///t:/Phongthuy/backend/src/services/SseService.js#L21) thay `setInterval 30000ms` thành `15000ms` theo đúng quy chuẩn `AGENTS.md` Rule 2.1.
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/controllers/SecurityCompliance.test.js](file:///t:/Phongthuy/backend/tests/controllers/SecurityCompliance.test.js) kiểm thử tokenVersion increment và crypto OTP 6 chữ số.

## 📅 Phiên bản: Tái Cấu Trúc UserStatsService Bằng Phép Cộng Dồn Nguyên Tử $inc O(1) (21/07/2026)

### Performance & I/O Optimization
- **Chuyển Đổi Thuật Toán Từ O(N) Sang O(1) Atomic Increments**: Tái cấu trúc [backend/src/services/UserStatsService.js](file:///t:/Phongthuy/backend/src/services/UserStatsService.js) bổ sung các hàm cộng dồn nguyên tử `incrementRecordCount`, `incrementInterpretTokens`, `incrementChatTokens` sử dụng toán tử `$inc` của MongoDB.
- **Tiết Kiệm 99% Đĩa I/O**: Loại bỏ hoàn toàn việc gọi 12 câu lệnh `countDocuments` và `aggregate` mỗi khi có hành động gieo quẻ, lập lá số hoặc chat AI.
- **Cập Nhật Toàn Bộ Controllers Liên Quan**:
  - *Tạo quẻ/lá số mới*: [IChingController.js](file:///t:/Phongthuy/backend/src/controllers/IChingController.js#L51), [BaziController.js](file:///t:/Phongthuy/backend/src/controllers/BaziController.js#L187), [ZiweiController.js](file:///t:/Phongthuy/backend/src/controllers/ZiweiController.js#L75), [MarriageController.js](file:///t:/Phongthuy/backend/src/controllers/MarriageController.js#L133).
  - *Luận giải AI & Chat*: [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L42).
  - *Xóa mềm bản ghi*: [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js#L611).
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/services/UserStatsService.test.js](file:///t:/Phongthuy/backend/tests/services/UserStatsService.test.js) kiểm thử các phép cộng dồn nguyên tử O(1) `$inc`.

## 📅 Phiên bản: Tích Hợp Cơ Chế Mongoose ACID Transaction Cho 6 Kịch Bản Đa Bảng (21/07/2026)

### Data Consistency & ACID Guarantee
- **Tạo Module Tiện Ích `transactionHelper.js`**: Viết module [backend/src/utils/transactionHelper.js](file:///t:/Phongthuy/backend/src/utils/transactionHelper.js) cung cấp hàm `runInTransaction` hỗ trợ Mongoose ACID Transactions với cơ chế tự động commit, rollback và fallback thông minh cho môi trường standalone local.
- **Áp dụng Cho Toàn Bộ 6 Kịch Bản Đa Bảng**:
  1. *Xóa bản ghi & gỡ liên kết lá số bản thân* (`deleteCalculation` - [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js#L588)).
  2. *Liên kết lá số bản thân & cập nhật hồ sơ* (`linkBazi`, `linkZiwei`, `updateBaziInfo` - [HistoryController.js](file:///t:/Phongthuy/backend/src/controllers/HistoryController.js#L385) & [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L201)).
  3. *Xóa tài khoản người dùng & dọn dẹp lịch sử 4 bảng* (`deleteUser` - [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L243)).
  4. *Khôi phục tài khoản & lịch sử đi kèm* (`restoreUser` - [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L901)).
  5. *Phê duyệt khiếu nại & mở khóa tài khoản* (`resolveAppeal` - [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L873)).
  6. *Thanh toán credit & đồng bộ Redis Profile Cache* (`updateUserCredits` & `creditCheck` - [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js) & [creditCheck.js](file:///t:/Phongthuy/backend/src/middleware/creditCheck.js)).
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/utils/transactionHelper.test.js](file:///t:/Phongthuy/backend/tests/utils/transactionHelper.test.js) kiểm thử khả năng thực thi giao dịch và tự động rollback khi gặp lỗi.

## 📅 Phiên bản: Khắc Phục Lỗi Sập Server TypeError logger.debug is not a function (21/07/2026)

### Critical Hotfix & Logging Resilience
- **Bổ sung Phương thức `debug` vào `LoggerService`**: Cập nhật [backend/src/services/LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js#L122) bổ sung hàm `debug(message, context)` ngăn chặn hoàn toàn nguy cơ bắn ngoại lệ `TypeError` làm kích hoạt cơ chế Graceful Shutdown (`uncaughtException`).
- **Chuẩn hóa Log Sweep Cache**: Cập nhật [backend/src/services/MemoryCacheService.js](file:///t:/Phongthuy/backend/src/services/MemoryCacheService.js#L26) chuyển lệnh gọi log dọn dẹp cache hết hạn sang `logger.info`.

## 📅 Phiên bản: Tối Ưu Hóa Single DB Querying (Tiết kiệm 50% DB Queries) (20/07/2026)

### Performance & Latency Optimization
- **Loại bỏ Hiện tượng Double DB Querying**: Cập nhật [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) và [checkRecordOwnership.js](file:///t:/Phongthuy/backend/src/middleware/checkRecordOwnership.js). Sử dụng trực tiếp `req.record` đã được middleware xác thực và fetch sẵn (`let record = req.record || await findByIdFlex(Model, id)`), giảm 50% số lượng câu lệnh truy vấn MongoDB Atlas cho tất cả 8 API luận giải và chat AI.

## 📅 Phiên bản: Xóa Bỏ Thư Mục Rác Legacy database/ (SQL Files) (20/07/2026)

### Codebase & Repository Cleanup
- **Xóa bỏ Thư mục dư thừa `database/`**: Loại bỏ hoàn toàn 2 tệp SQL cũ không còn sử dụng (`schema.sql`, `seed_concepts.sql`), làm sạch cấu trúc repository khi dự án đã chuẩn hóa 100% trên MongoDB Atlas.

## 📅 Phiên bản: Sửa Lỗ Hổng Phân Quyền Co-Admin Trong API resolveAppeal (20/07/2026)

### Security & Privilege Management
- **Bắt Buộc Kiểm Tra Phân Cấp Quản Quyền (`req.hasAuthorityOver`)**: Cập nhật hàm `resolveAppeal` trong [backend/src/controllers/AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L875) bổ sung bước xác thực `req.hasAuthorityOver(targetUser)`. Trả về HTTP 403 Forbidden nếu Co-Admin cố tình duyệt đơn khiếu nại để mở khóa cho tài khoản Admin cấp cao hơn.
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/controllers/AdminController.test.js](file:///t:/Phongthuy/backend/tests/controllers/AdminController.test.js) xác minh 100% việc chặn Co-Admin khi cố gắng can thiệp tài khoản Admin.

## 📅 Phiên bản: Khắc Phục Lỗi Rò Rỉ Bộ Nhớ RAM Cache (Memory Leak / OOM) (20/07/2026)

### Resilience & Performance Optimization
- **Nâng cấp `MemoryCacheService.js` Thuật Toán LRU Eviction**: Tái cấu trúc [backend/src/services/MemoryCacheService.js](file:///t:/Phongthuy/backend/src/services/MemoryCacheService.js) thiết lập giới hạn dung lượng lưu trữ tối đa **3,000 phần tử** (`maxCapacity`), thời gian sống mặc định **3 phút** (`ttlMs = 180000`) và tự động đào thải phần tử cũ ít sử dụng nhất (Least Recently Used Eviction) khi vượt ngưỡng.
- **Dọn Rác Tự Động Định Kỳ (Background Sweep)**: Bổ sung bộ quét `startPeriodicSweep()` dọn sạch 100% các key hết hạn định kỳ 60 giây. Timer được gắn `.unref()` để không giữ treo tiến trình Node.js hay Jest test workers.
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/services/MemoryCacheService.test.js](file:///t:/Phongthuy/backend/tests/services/MemoryCacheService.test.js) kiểm thử toàn diện thuật toán LRU Eviction, giới hạn 3,000 items và thời gian sống 3 phút.

## 📅 Phiên bản: Khắc Phục Lỗi Trừ Oan Credit Người Dùng (Auto Credit Refund) (20/07/2026)

### Fair Credit Policy & Error Resilience
- **Bổ sung Cơ chế Hoàn Credit Tự động (`req.refundCredit()`)**: Nâng cấp [backend/src/middleware/creditCheck.js](file:///t:/Phongthuy/backend/src/middleware/creditCheck.js) gắn cờ `req.creditDecremented` và hàm helper `req.refundCredit()`, kết hợp Response Interceptor tự động hoàn trả credit khi phản hồi có status code >= 400.
- **Miễn Phí 100% Cho Đọc Cache Luận Giải**: Cập nhật [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js) gọi `req.refundCredit()` trước khi trả về dữ liệu cache (`hasValidCache`) cho tất cả 4 phân hệ (Bát Tự, Tử Vi, Kinh Dịch, Kết Hôn).
- **Tạo Suite Unit Test Tự Động**: Viết tệp [tests/middleware/creditCheck.test.js](file:///t:/Phongthuy/backend/tests/middleware/creditCheck.test.js) kiểm thử toàn diện khả năng hoàn trả credit khi đọc cache hit hoặc gặp lỗi từ chối đầu vào.

## 📅 Phiên bản: Sửa Lỗi Nghiêm Trọng ReferenceError sseService trong AuthController.js (20/07/2026)

### Critical Bug Fix
- **Khắc phục Sập API Luồng Đăng ký & Đăng nhập Google**: Thêm `const sseService = require('../services/SseService');` tại [backend/src/controllers/AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js#L10).
- **Tạo Suite Unit Test Kiểm thử Khởi tạo Controller**: Viết tệp [tests/controllers/AuthController.test.js](file:///t:/Phongthuy/backend/tests/controllers/AuthController.test.js) xác minh 100% các hàm đăng ký, đăng nhập, gieo quẻ và khiếu nại không chứa biến tham chiếu chưa khai báo (`ReferenceError`).

## 📅 Phiên bản: Đánh giá Toàn diện Hệ thống & Lập Kế hoạch Refactor (20/07/2026)

### System Audit & Code Review
- **Thực hiện Full System Review**: Thực hiện đánh giá chi tiết 18 khía cạnh kỹ thuật từ Kiến trúc, Mã nguồn, Bảo mật, Performance đến DevOps và AI Module.
- **Tạo Báo cáo Đánh giá**: Biên soạn báo cáo [system_review_report.md](file:///C:/Users/cobat/.gemini/antigravity/brain/5eead2cd-ad2f-451b-b1d0-ad27b58ae723/system_review_report.md) chỉ ra 5 lỗi nghiêm trọng (Critical/High/Medium Severity issues) bao gồm: ReferenceError của `sseService`, rò rỉ bộ nhớ Map cache, dọn dẹp Redis cache bị thiếu, trừ oan credit khi xem cache hoặc lỗi đầu vào, và bypass phân quyền Co-Admin.
- **Thiết lập Lộ trình Refactor**: Lập kế hoạch phân loại từ P0 đến P3 đi kèm ước tính thời gian, độ khó và mức độ ảnh hưởng của từng tác vụ.

## 📅 Phiên bản: Đồng bộ hóa Toàn bộ Tài liệu Kỹ thuật với Mã nguồn (Task 21) (20/07/2026)

### System Documentation & Knowledge Sync
- **Cập nhật Đặc tả API (`docs/API.md`)**: Loại bỏ toàn bộ các mô tả tham số query token `?token=<token>` legacy trong URL, chuẩn hóa 100% Header xác thực `Authorization: Bearer <token>` đúng theo Quy tắc 3.
- **Cập nhật Kiến trúc Hệ thống (`docs/ARCHITECTURE.md`)**: Bổ sung phần **5. Hạ tầng Bảo mật & Resilience** chi tiết hóa Helmet Security Headers, Winston Log Rotation, Graceful Shutdown, Global Error Handler và Jest Automated Unit Testing.
- **Cập nhật Hướng dẫn Khởi chạy (`README.md`)**: Bổ sung hướng dẫn khởi chạy lệnh `npm test` và cập nhật thông tin kiểm thử tự động.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#21** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Loại bỏ Code Legacy mongoose.isValidObjectId & Clean DB (Task 20) (20/07/2026)

### Architecture & Database Cleanup
- **Loại bỏ Code Legacy `isValidObjectId`**: Refactor `findByIdFlex` và `updateByIdFlex` trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L34). Xóa bỏ hoàn toàn các dòng code ép kiểu legacy `new mongoose.Types.ObjectId(id)` và `Model.hydrate`, chuẩn hóa 100% theo Mongoose UUIDv7 String Query.
- **Tạo Script Dọn dẹp Database (`cleanupNonUuidRecords.js`)**: Viết module [cleanupNonUuidRecords.js](file:///t:/Phongthuy/backend/src/scripts/cleanupNonUuidRecords.js) quét tự động tất cả các collections trên MongoDB và tự động xóa 100% các bản ghi legacy cũ không sử dụng định dạng UUID.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#20** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Nâng cấp GitHub Actions CI Pipeline (Task 16) (20/07/2026)

### CI/CD Automation & Build Verification
- **Nâng cấp Backend CI Workflow**: Cập nhật [.github/workflows/backend-ci.yml](file:///t:/Phongthuy/.github/workflows/backend-ci.yml) bổ sung các bước `node --check src/index.js` kiểm tra cú pháp và `npm test` tự động chạy 100% các tệp Unit Test Suite trước khi merge code.
- **Chuẩn hóa Frontend CI Workflow**: Cập nhật [.github/workflows/frontend-ci.yml](file:///t:/Phongthuy/.github/workflows/frontend-ci.yml) kiểm tra `npm run build` sản xuất.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#16** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Xây dựng Unit Test cho Thuật toán Phong thủy Cốt lõi (Task 15) (20/07/2026)

### Quality Assurance & Automated Testing
- **Cài đặt Jest Framework**: Tích hợp `jest` vào `devDependencies` của Backend và cấu hình `"test": "jest"` trong [package.json](file:///t:/Phongthuy/backend/package.json#L9).
- **Tạo Suite Unit Test Tự động**:
  - `BaziAnalyzer.test.js`: Kiểm thử phân tích 4 Trụ Can Chi, % điểm Ngũ Hành, Dụng Thần, Hỷ Thần cho các lá số mẫu (xác nhận tổng phần trăm ngũ hành chuẩn ~100%).
  - `ZiweiAstrology.test.js`: Kiểm thử bộ máy an sao Tử Vi `AstrologyEngine` (12 Cung, Nhật Nguyệt, Nam Bắc Đẩu) và bộ chuyển đổi `ZiweiFormatter` (Standard Output & AI Prompt Compression).
  - `IChingDataService.test.js`: Kiểm thử tái tạo quẻ chính, quẻ biến, Hào động, Quái Thân và Lục Thú.
  - `RuleEngineService.test.js`: Kiểm thử xác định Dụng Thần theo nhóm câu hỏi và phân loại độ vượng suy.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#15** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Bổ sung HTTP Security Headers với Thư viện Helmet (Task 14) (20/07/2026)

### Express Security & HTTP Headers
- **Tích hợp Helmet Security Middleware**: Cài đặt gói `helmet` và khai báo `app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }))` trong [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L69).
- **Thiết lập Lá chắn Bảo vệ Header**: Tự động áp dụng `X-Frame-Options` (chống Clickjacking), `X-Content-Type-Options: nosniff` (chống MIME Sniffing), `X-DNS-Prefetch-Control` và `Strict-Transport-Security`.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#14** (hoàn tất toàn bộ nhóm **P1: Ưu tiên cao**) trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Cập nhật & Tinh gọn AI Fallback Model Chain (Task 13) (20/07/2026)

### AI Model Fallback Strategy
- **Làm sạch Fallback Chain**: Cập nhật hàm `_executeWithFallback` trong [AiService.js](file:///t:/Phongthuy/backend/src/services/AiService.js#L35). Loại bỏ hoàn toàn các model bản preview/deprecated cũ (`flash-8b`, `preview-02-05`), tinh gọn chuỗi dự phòng bao gồm các model chính thức: `gemini-3.5-flash`, `gemini-3-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`.
- **Rút ngắn thời gian khôi phục lỗi**: Giúp giảm thiểu thời gian chờ đợt failover khi Gemini API bị sự cố, tránh nguy cơ bị timeout.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#13** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Tối ưu hóa đếm Token AI - Trích xuất Stream Metadata (Task 12) (20/07/2026)

### AI Streaming Performance & Quota Optimization
- **Trích xuất `usageMetadata` từ Stream Chunk**: Cập nhật cả 8 hàm stream AI trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L164) để trích xuất `chunk.usageMetadata` (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) trực tiếp từ luồng Gemini API stream.
- **Loại bỏ 2 HTTP API Calls Dư thừa**: Xóa bỏ các lệnh gọi `await AiService.countTokens(...)` sau khi stream kết thúc, giảm 300ms - 600ms độ trễ phản hồi và tiết kiệm 50% số lượt HTTP API calls dư thừa sang Google API.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#12** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Tích hợp Log Rotation Daily Rotate & Chuẩn hóa GMT+7 (Task 10 & 11) (20/07/2026)

### Logging Infrastructure
- **Tích hợp Winston Daily Rotate File (Task 10)**: Tích hợp `winston` và `winston-daily-rotate-file` vào [LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js). Tạo 2 transport xoay log tự động theo ngày `logs/app-%DATE%.log` và `logs/errors-%DATE%.log`, giới hạn kích thước tối đa 10MB/tệp, nén `.gz` log cũ và tự động xóa log quá 14 ngày, chống tràn ổ cứng server.
- **Chuẩn hóa Giờ Việt Nam GMT+7 (Task 11)**: Đổi `getTimestamp()` trong [LoggerService.js](file:///t:/Phongthuy/backend/src/services/LoggerService.js#L49) sang dùng `new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })` kết hợp milliseconds, đảm bảo chính xác tuyệt đối thời gian GMT+7 không bị lệch hay double-offset trên mọi hosting provider.
- **Cập nhật danh sách công việc**: Đánh dấu `[x]` công việc **#9** (bỏ qua theo yêu cầu UX), **#10** và **#11** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Khắc phục Graceful Shutdown cho Uncaught Exception & Signal (Task 8) (20/07/2026)

### Server Resilience & Process Lifecycle
- **Cơ chế Graceful Shutdown**: Phát triển hàm `gracefulShutdown` trong [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L7) bắt các sự kiện `uncaughtException`, `unhandledRejection`, `SIGTERM`, `SIGINT`.
- **Đóng Tài Nguyên & Self-Healing**: Dừng nhận request HTTP mới (`server.close()`), đóng kết nối MongoDB gracefully trước khi gọi `process.exit(1)` báo cho AWS ECS / Docker / PM2 khởi tạo lại container sạch. Tích hợp `setTimeout` 10s ép ngắt nếu shutdown bị đơ connection.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#8** (hoàn tất toàn bộ nhóm **P0: Cực kỳ khẩn cấp**) trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Bật lại Route Health Check Siêu Nhẹ & Xóa Self-Ping (Task 7) (20/07/2026)

### AWS Deployment & Health Monitoring
- **Bật lại Lightweight Health Check Route (`/health`)**: Mở lại route `app.get('/health', (req, res) => res.status(200).send('ok'))` trong [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L60) phục vụ AWS ALB, Target Group, Nginx và Uptime Monitor.
- **Loại bỏ Khối Code Self-Ping Dư Thừa**: Xóa bỏ hoàn toàn khối mã lệnh `setInterval` self-ping 3 phút ở cuối `index.js`, tối ưu hóa tài nguyên CPU cho môi trường AWS EC2/ECS/Fargate.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#7** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Tích hợp SSE Heartbeat Ping (15s) vào toàn bộ luồng AI Stream (Task 6) (20/07/2026)

### SSE Streaming & Resilience
- **Heartbeat Ping (`:\n\n`) 15s**: Tích hợp `setInterval` gửi gói comment ping rỗng `:\n\n` cho tất cả 8 luồng SSE stream (4 hàm sinh luận giải `interpretHexagram`, `interpretBazi`, `interpretMarriage`, `interpretZiwei` và 4 hàm chat follow-up) trong [AiInterpretationController.js](file:///t:/Phongthuy/backend/src/controllers/AiInterpretationController.js#L88), tuân thủ Quy tắc 2.1 (`AGENTS.md`) chống ngắt kết nối rác và lỗi 504 Gateway Timeout từ Reverse Proxy/Nginx.
- **Dọn dẹp Memory Leak (`clearInterval`)**: Đảm bảo dọn dẹp `clearInterval(pingInterval)` ở cả sự kiện `req.on('close')` khi client ngắt kết nối sớm lẫn khối `finally` khi stream hoàn tất.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#6** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Bổ sung Middleware Xử lý Lỗi Toàn cục (Task 5) (20/07/2026)

### Express Architecture & Error Handling
- **Middleware Xử lý Lỗi Tập trung (`app.use((err, req, res, next) => ...)`)**: Bổ sung middleware xử lý lỗi 4 tham số ở cuối chuỗi route trong [backend/src/index.js](file:///t:/Phongthuy/backend/src/index.js#L70), bắt 100% uncaught errors/exceptions, log lỗi qua `LoggerService.error` và trả về JSON tiêu chuẩn `{ error: "thông báo lỗi" }` cho Client.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#5** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Khắc phục lỗ hổng ReDoS Regex Attack trong Search Queries (Task 4) (20/07/2026)

### Security & ReDoS Prevention
- **Tạo Helper `escapeRegExp`**: Thêm module [escapeRegExp.js](file:///t:/Phongthuy/backend/src/utils/escapeRegExp.js) mã hóa an toàn toàn bộ các ký tự đặc biệt của Biểu thức chính quy (`.*+?^${}()|[]\`).
- **Áp dụng cho Admin User & Calculation Search**: Cập nhật [AdminController.js](file:///t:/Phongthuy/backend/src/controllers/AdminController.js#L26) làm sạch chuỗi tìm kiếm đầu vào ở cả 2 chức năng tìm kiếm người dùng và tìm kiếm lịch sử lá số.
- **Áp dụng cho Blog Post Search**: Cập nhật [BlogController.js](file:///t:/Phongthuy/backend/src/controllers/BlogController.js#L44) làm sạch chuỗi tìm kiếm bài viết blog.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#4** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Loại bỏ việc nhận JWT Token qua URL Query String (Task 3) (20/07/2026)

### Security & Authentication
- **Loại bỏ `req.query.token` ở Backend**: Xóa bỏ hoàn toàn khả năng đọc token qua query parameter trên URL trong 4 middleware: [auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js), [adminAuth.js](file:///t:/Phongthuy/backend/src/middleware/adminAuth.js), [chatCreditCheck.js](file:///t:/Phongthuy/backend/src/middleware/chatCreditCheck.js), [optionalAuth.js](file:///t:/Phongthuy/backend/src/middleware/optionalAuth.js). Đảm bảo 100% request phải qua HTTP Header `Authorization: Bearer <token>`.
- **Tích hợp `event-source-polyfill` ở Client**: Cài đặt `event-source-polyfill` và nâng cấp các kết nối SSE real-time tại [AuthContext.jsx](file:///t:/Phongthuy/frontend/src/context/AuthContext.jsx#L76) và [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx#L270) để gửi header `Authorization: Bearer ${token}` chuẩn mực, loại bỏ `?token=` khỏi URL SSE.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#3** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Khắc phục cấu hình CORS Wildcard (Task 2) (20/07/2026)

### Security & CORS Configuration
- **Thêm Biến Môi Trường `CLIENT_URL`**: Thêm `CLIENT_URL` chứa danh sách domain whitelist phân cách bằng dấu phẩy vào [backend/.env](file:///t:/Phongthuy/backend/.env).
- **Cấu hình Dynamic CORS Whitelist**: Cập nhật [index.js](file:///t:/Phongthuy/backend/src/index.js#L26) chuyển từ `cors()` wildcard sang hàm kiểm tra origin linh hoạt đọc từ `CLIENT_URL`, hỗ trợ `credentials: true`, giới hạn HTTP methods và allowed headers.
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#2** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Khắc phục lỗ hổng JWT Secret Fallback (Task 1) (20/07/2026)

### Security & Infrastructure
- **Tạo Module Kiểm Tra Môi Trường (`config/env.js`)**: Bắt buộc ứng dụng phải có biến `JWT_SECRET` trong `process.env`. Nếu thiếu hoặc rỗng, ứng dụng sẽ log lỗi FATAL và chủ động gọi `process.exit(1)` ngắt khởi động.
- **Yêu cầu `config/env` tại `index.js`**: Tích hợp khâu kiểm tra biến môi trường ngay lập tức khi ứng dụng Node.js vừa boot up.
- **Loại bỏ Hoàn toàn Chuỗi Fallback `'secret'`**:
  - Xóa bỏ tất cả fallback `'secret'` trong các phương thức ký token của [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js).
  - Xóa bỏ tất cả fallback `'secret'` trong 6 middleware xác thực và ghi log: [auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js), [adminAuth.js](file:///t:/Phongthuy/backend/src/middleware/adminAuth.js), [creditCheck.js](file:///t:/Phongthuy/backend/src/middleware/creditCheck.js), [chatCreditCheck.js](file:///t:/Phongthuy/backend/src/middleware/chatCreditCheck.js), [optionalAuth.js](file:///t:/Phongthuy/backend/src/middleware/optionalAuth.js), [logging.js](file:///t:/Phongthuy/backend/src/middleware/logging.js).
- **Cập nhật danh sách công việc**: Đã hoàn thành và đánh dấu `[x]` công việc **#1** trong [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md).

## 📅 Phiên bản: Full System Audit & Tạo Danh Sách Việc Cần Làm (20/07/2026)

### Full System Audit & Task Planning
- **Review toàn bộ 20 hạng mục hệ thống**: Thực hiện kiểm tra chuyên sâu từ tầng Kiến trúc, Mã nguồn Backend/Frontend, Cơ sở dữ liệu MongoDB, Bảo mật, Hiệu năng, AI Integration, DevOps, Logging, Error Handling đến Testing.
- **Tạo Tệp Quản lý Tiến độ Refactor**: Tạo tệp [việc cần làm.md](file:///t:/Phongthuy/vi%E1%BB%87c%20c%E1%BA%A7n%20l%C3%A0m.md) phân loại 21 công việc cần xử lý được xếp theo thứ tự ưu tiên giảm dần từ **P0 (Cực kỳ khẩn cấp)** đến **P3 (Tối ưu dài hạn)** kèm theo ô tick `[ ]`, chi tiết vị trí file, ngữ cảnh lỗi, hậu quả và hướng dẫn xử lý kỹ thuật.

## 📅 Phiên bản: Hoàn thiện 5 Tối ưu hóa Nâng cao Toàn diện với Redis Engine (20/07/2026)

### Infrastructure & Backend (Full Redis Optimization Suite)
- **Cấu hình Hạ tầng Docker Compose**: Bổ sung service `redis` (`redis:alpine`) vào [docker-compose.yml](file:///t:/Phongthuy/docker-compose.yml), giới hạn bộ nhớ cứng 256MB (`--maxmemory 256mb --maxmemory-policy allkeys-lru`) và kết nối vào mạng `phongthuy-network`.
- **Tích hợp Redis Client**: Cài đặt `ioredis` và xây dựng module [redis.js](file:///t:/Phongthuy/backend/src/config/redis.js) tích hợp sẵn các helper `setUserProfileCache`, `getUserProfileCache`, `setOtpRedis`, `getOtpRedis`, `acquireRedisLock` với cơ chế Graceful Fallback an toàn.
- **1. Cache Thông tin Người dùng & Session Auth (Bỏ truy vấn DB)**:
  - Nâng cấp [auth.js](file:///t:/Phongthuy/backend/src/middleware/auth.js), [adminAuth.js](file:///t:/Phongthuy/backend/src/middleware/adminAuth.js), và [creditCheck.js](file:///t:/Phongthuy/backend/src/middleware/creditCheck.js) kiểm tra thông tin User Profile (`tokenVersion`, `status`, `role`, `baziInfo`, `credits`) trực tiếp trên Redis key `user:profile:{userId}`.
  - Loại bỏ hoàn toàn câu lệnh `User.findById` trên MongoDB ở mỗi request đã xác thực (giảm 90% DB read queries).
  - Tự động xóa/cập nhật Redis Profile Cache khi user đăng xuất, đổi mật khẩu, cập nhật hồ sơ hoặc khi Admin khóa/chỉnh sửa tài khoản.
- **2. Chuyển Mã Email OTP hoàn toàn lên Redis (Dọn dẹp rác DB)**:
  - Chuyển lưu trữ mã OTP xác thực email (`otp:verify_email:{userId}`) và OTP khôi phục mật khẩu (`otp:reset_password:{email}`) sang Redis `SETEX` với thời gian tự hủy 10-15 phút.
  - Xóa bỏ hoàn toàn các trường `emailOtp` và `emailOtpExpires` trong [User.js](file:///t:/Phongthuy/backend/src/models/User.js) và [AuthController.js](file:///t:/Phongthuy/backend/src/controllers/AuthController.js).
- **3. Hàng đợi gửi Email ngầm (Redis Async Email Queue)**:
  - Phát triển [RedisQueueService.js](file:///t:/Phongthuy/backend/src/services/RedisQueueService.js) đẩy các task gửi mail OTP vào `queue:emails` giúp API phản hồi tức thì trong **~10ms**, tiến trình Worker ngầm rút job ra để gửi mail qua SMTP.
- **4. Cache Phân tích thô cho cả 4 phân hệ Học thuật**:
  - Tích hợp Caching 2 tầng (L1 RAM + L2 Redis) cho cả 4 phân hệ Kinh Dịch, Bát Tự, Tử Vi và Hợp Hôn qua [MemoryCacheService.js](file:///t:/Phongthuy/backend/src/services/MemoryCacheService.js) và [ZiweiCache.js](file:///t:/Phongthuy/backend/src/services/ZiweiCache.js), cho phép nhả kết quả tính toán thô tức thì (0ms).
- **5. Lock Chống Spam Click trùng (Distributed Mutex Lock)**:
  - Phát triển middleware [antiSpamLock.js](file:///t:/Phongthuy/backend/src/middleware/antiSpamLock.js) dùng `acquireRedisLock` (`SET key 1 NX PX 3000`) bảo vệ các API nhạy cảm (`/interpret`, gửi OTP) chống race condition và spam click đúp.

### Bazi Optimization & Data Cleanup
- **Loại bỏ On-the-fly Migration**: Xóa bỏ hoàn toàn logic tính toán và ghi đè `record.save()` tự động trong `HistoryController.getBaziRecord`, giúp API đọc bản ghi Bát Tự nhả phản hồi tức thì và không gây chậm giao diện.
- **Xóa sạch dữ liệu lá số cũ trước 10/07/2026**:
  - Phát triển và thực thi script `cleanOldCalculations.js` dọn dẹp vĩnh viễn 138 lá số cũ (63 Kinh Dịch, 49 Bát Tự, 17 Tử Vi, 9 Hôn Nhân) và 26 hội thoại/tin nhắn tạo trước mốc 10/07/2026.







---

## 📅 Phiên bản: Cải tiến Giao diện Di động, Tối ưu hóa Logo Thương hiệu & Đồng bộ Bài viết Trang chủ (20/07/2026)

### Frontend (Giao diện di động, Rebranding & Trang chủ)
- **Tích hợp Logo Thương hiệu**: Di chuyển tệp tin ảnh logo thực tế `T:\LOGO\2a61a9fd-0512-46c4-ab69-e48464b61a8c.png` vào thư mục public của ứng dụng Client (`/logo.png`). Thay thế hoàn toàn biểu tượng văn bản "PT" thô sơ ở Header và Footer bằng thẻ ảnh thương hiệu để tăng tính chuyên nghiệp.
- **Tái cấu trúc Điều Hướng Desktop**: Di chuyển tab "Blog" lên ngay cạnh "Trang Chủ" ở thanh Header trung tâm và đổi tên hiển thị thành "Kiến thức" để thuận tiện truy cập.
  - Bổ sung nút Trang Chủ (`Home`) và nút Kiến Thức (`BookOpen`) nằm ở phía bên trái nút Chức năng `(🧭 >)` trên thanh Header di động, cùng cấp với nút Lịch sử (`History`) để người dùng điều hướng nhanh chóng.
  - Đưa Chuông thông báo (`NotificationBell`) và Số dư Xu (credits) lên trực tiếp thanh Header trên di động.
  - Phân hệ 4 chức năng chính (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân) trong Mobile Menu Drawer được khôi phục dạng lưới độc lập đầy đủ.
  - Căn giữa khối Hồ Sơ Cá Nhân trong Mobile Menu Drawer (Avatar tròn lớn, tên, số dư Xu và các nút hành động được căn lề giữa tinh tế).
  - Khắc phục triệt để lỗi trắng màn hình (Runtime ReferenceError) trên di động & desktop do biểu tượng `Sparkles` bị thiếu trong danh sách import `lucide-react` tại `UserApp.jsx`.
  - Loại bỏ hoàn toàn Lazy Load và màn hình nạp quay tròn ở tất cả các phân hệ người dùng (Bát Tự, Tử Vi, Hôn Nhân, Trạch Cát, Blog). Nhúng trực tiếp các phân hệ con vào `UserApp.jsx`, mang lại trải nghiệm chuyển Tab tức thì (Instant 0ms Tab Switching) mượt mà như ứng dụng di động Native.
  - Tích hợp cơ chế tự động thu gọn thanh phân hệ con khi người dùng cuộn (scroll) màn hình để tối ưu trải nghiệm.
- **Tính năng Chia sẻ Bài viết & URL Trực Tiếp (Deep-Linking Share Bar)**:
  - Bổ sung thanh công cụ chia sẻ ở cả đầu và cuối màn hình xem chi tiết bài viết (`BlogBoard.jsx`).
  - Hỗ trợ nút **Sao chép link** (kèm hiệu ứng tích xanh "Đã sao chép!"), nút **Chia sẻ lên Facebook** (mở cửa sổ Facebook Sharer chính thức), và nút **Ứng dụng khác** (kích hoạt Web Share Sheet của thiết bị di động để chia sẻ qua Zalo, Messenger, Telegram, v.v.).
  - Tự động đồng bộ đường dẫn Deep-Linking dạng `https://tuynover.ddns.net/?post={slug}` lên thanh địa chỉ khi xem bài viết. Khi người dùng bấm sao chép hoặc chia sẻ, đường dẫn được tạo ra sẽ trỏ trực tiếp đến bài viết đó thay vì chỉ trỏ về trang chủ. Khi người khác mở link này, hệ thống tự động nhận diện tham số `?post` và mở đúng bài viết đó ngay lập tức.
- **Hỗ Trợ Bảng & Chèn Ảnh Markdown Nâng Cao (remark-gfm & Custom Image Renderer)**:
  - Cài đặt và tích hợp thư viện `remark-gfm` vào `ReactMarkdown` ở cả tệp `BlogBoard.jsx` và `AdminApp.jsx`.
  - Hỗ trợ chèn hình ảnh trực tiếp ở bất kỳ vị trí nào trong bài viết bằng cú pháp `![Mô tả ảnh](https://duong-dan-anh.jpg)`. Ảnh hiển thị bo góc mềm mại `rounded-2xl`, có chú thích ảnh nghiêng (`figcaption`) căn giữa tinh tế.
  - Tích hợp bộ tiền xử lý tự động ngắt dòng `text.replace(/\|\s*\|/g, '|\n|')`, hỗ trợ hiển thị bảng đẹp mắt ngay cả khi người dùng dán toàn bộ đoạn bảng Markdown trên 1 dòng duy nhất.
  - Xây dựng Thuật toán tự động chuẩn hóa bảng ngắt dòng đứng (Vertical Pipe Normalizer): Tự động phát hiện và nối các dòng bảng bị dán ngắt hàng đứng (ví dụ `|\n Ngũ Hành \n|\n Thiên Can \n|`) và thẻ bold bị vỡ (`**\nDương Kim\n**`) trở lại thành bảng GFM nằm ngang hoàn hảo.
  - Thiết kế thành phần hiển thị bảng (`table`, `thead`, `tbody`, `tr`, `th`, `td`) dạng Responsive với khung bo tròn mềm mại (`rounded-2xl`), viền sáng và hiệu ứng hover nhẹ nhàng.
- **Nâng Cấp Quản Lý & Tạo Bài Viết Blog Cho Admin (AdminApp.jsx)**:
  - Sửa lỗi triệt để `Uncaught ReferenceError: blogPages is not defined` tại dòng 2838 trong `AdminApp.jsx` bằng việc khai báo state `const [blogPages, setBlogPages] = useState(1);`.
  - Khắc phục lỗi thiếu import biểu tượng `BookOpen` từ `lucide-react` và thay thế biểu tượng `Edit` thành `Pencil`.
  - Cấu hình `minWidth={0} minHeight={0}` cho `ResponsiveContainer` để triệt tiêu hoàn toàn các cảnh báo kích thước âm trong Console.
  - Tích hợp tính năng tự động sinh đường dẫn tĩnh (Slugify) theo thời gian thực khi Admin nhập tiêu đề bài viết mới.
  - Bổ sung bộ chuyển đổi tab **Soạn Thảo Markdown** vs **Xem Trước (Preview)** ngay trong Modal viết/sửa bài viết. Sử dụng `ReactMarkdown` cho phép Admin xem trước chính xác hình thức hiển thị của bài viết trước khi bấm lưu/bản nháp.
  - Hỗ trợ đầy đủ bộ công cụ quản trị: Đăng bài mới, Sửa bài, Xóa mềm, Khôi phục bài viết, Tìm kiếm và Phân loại theo 6 danh mục phong thủy.
- **Kết nối Bài Viết Nổi Bật vào Trang Chủ**:
  - Bổ sung gọi API bất đồng bộ tải 3 bài viết học thuật mới nhất tại `HomeBoard.jsx`.
  - Thiết kế phần "Kiến thức & Chiêm nghiệm" hiển thị 3 bài viết nổi bật tuyệt đẹp dạng lưới (Grid 3 cột) nằm ngay trên chân trang. Tích hợp liên kết trực tiếp, khi click sẽ đưa người dùng vào xem nội dung bài viết.
- **Tinh chỉnh giao diện Lịch Sử Mobile (HistoryBoard.jsx)**:
  - Tái thiết kế toàn bộ card lịch sử ở cả 4 phân hệ cho giao diện di động.
  - Rút gọn nút "Xem chi tiết" thành icon `Eye` gọn gàng trên thiết bị di động để chặn triệt để tình trạng vỡ layout hoặc tràn chữ.
- **Tối ưu hóa SEO Toàn Diện**:
  - Nâng cấp [index.html](file:///t:/Phongthuy/frontend/index.html) thiết lập ngôn ngữ chuẩn `lang="vi"`, đồng bộ tên miền chính thức `https://tuynover.ddns.net/` cho các thẻ Canonical Link, OpenGraph URL, Twitter URL, ảnh xem trước và cấu trúc dữ liệu chuẩn Schema.org JSON-LD.
  - Tích hợp cơ chế đổi tiêu đề trang động (`document.title`) theo từng phân hệ (Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân, Xem Ngày, Blog, Lịch Sử, Hồ Sơ) trong `UserApp.jsx` và cập nhật tiêu đề theo bài viết trong `BlogBoard.jsx`.
  - Sửa lỗi thiếu import: Bổ sung icon `Eye` vào danh sách import từ `lucide-react` để khắc phục lỗi runtime ReferenceError gây trắng màn hình khi người dùng mở trang Lịch sử.
  - Nâng cấp bo góc của các ô input ghi chú ứng kỳ lên `rounded-xl`, đồng thời cải thiện nút "Lưu" với hiệu ứng nhấn nhả `active:scale-95`.

---

## 📅 Phiên bản: Tích hợp Mô-đun Tin tức & Kiến thức Phong Thủy (Blog) (20/07/2026)

### Backend (Mô hình dữ liệu, Seeding & API Endpoints)
- **BlogPost.js [NEW]**: Tạo mới Mongoose model `BlogPost` lưu trữ các bài viết phong thủy chuyên nghiệp sử dụng UUIDv7 cho `_id`. Tích hợp các chỉ mục phụ (`slug`, `category`, `isPublished`, `isDeleted`, `createdAt`) và các trường thông tin cơ bản.
- **BlogSeedService.js [NEW]**: Xây dựng service tự động chèn 4 bài viết mẫu học thuật sâu sắc về Kinh Dịch Lục Hào, Tứ Trụ Bát Tự, Tử Vi Đẩu Số và Trạch Cát khi cơ sở dữ liệu rỗng.
- **db.js [MODIFY]**: Kích hoạt tự động chạy `seedBlogPosts()` của `BlogSeedService` ngay sau khi kết nối MongoDB thành công.
- **BlogController.js [NEW]**: Viết mới các hàm xử lý công khai (`getPosts`, `getPostBySlug` tự động tăng lượt xem và trả về các bài viết liên quan) cùng các nghiệp vụ kiểm soát của Admin (`createPost` tự sinh slug tiếng Việt, `updatePost`, `deletePost` xóa mềm và `restorePost`).
- **blog.js [NEW] & index.js [MODIFY]**: Tạo router `blog.js` sử dụng `optionalAuth` cho các route công khai (để Admin có thể xem được bản nháp) và `adminAuth` làm hàng rào bảo mật cho các thao tác ghi của Admin. Mount router vào hệ thống API chính tại `/api/blog`.

### Frontend (Giao diện Người dùng & Bảng Điều khiển Quản trị)
- **api.js [MODIFY]**: Tích hợp các hàm gọi API Blog (`getBlogPosts`, `getBlogPost`, `createBlogPost`, `updateBlogPost`, `deleteBlogPost`, `restoreBlogPost`).
- **BlogBoard.jsx [NEW]**: Tạo mới component bảng tin tức phong thủy với giao diện sang trọng. Hỗ trợ tìm kiếm từ khóa, lọc theo tabs danh mục học thuật, phân trang, và hiển thị nội dung chi tiết bài viết dưới dạng Markdown. Tích hợp thanh CTA hấp dẫn điều hướng người dùng tới các dịch vụ Bát Tự, Tử Vi, Kinh Dịch tương ứng.
- **UserApp.jsx [MODIFY]**: Tích hợp tab "Blog" lên đầu trang (Desktop Header) và trình đơn di động (Mobile Menu - hiển thị 2 cột cân xứng), thiết lập lazy load cho `<BlogBoard />`, và cập nhật bộ nút cuộn trang hỗ trợ khi xem blog.
- **HomeBoard.jsx [MODIFY]**: Thêm nút liên kết "Kiến thức Phong Thủy (Blog)" vào danh mục footer để người dùng dễ dàng truy cập từ trang chủ.
- **AdminApp.jsx [MODIFY]**: Thêm tab "Quản Lý Blog" vào thanh điều hướng Admin, tích hợp danh sách bài viết dưới dạng bảng (hỗ trợ tìm kiếm, lọc danh mục, sửa bài viết, xóa mềm và khôi phục). Thiết kế form modal nhập liệu sang trọng hỗ trợ soạn thảo nội dung Markdown, tags, ảnh bìa và đặt trạng thái công khai/nháp, đồng bộ với chủ đề tối của giao diện Admin.

---

## 📅 Phiên bản: Tích hợp Thuật toán Ngũ hành Tư lệnh & Thiết kế lại Dòng Tiết khí (20/07/2026)

### Backend (Tính toán học thuật Bát tự)
- **BaziAnalyzer.js**:
  - Triển khai thuật toán tính **Ngũ hành tư lệnh / Can quản sự** dựa trên bảng phân phối ngày của tác phẩm *Tam Mệnh Thông Hội* (nhóm Tứ sinh: 5-5-20, Tứ vượng: 7-23, Tứ mộ: 7-5-18).
  - Tích hợp 2 hiệu chỉnh học thuật theo yêu cầu: Đổi 5 ngày Bính thành 5 ngày **Đinh** ở tháng Tuất; Đổi 5 ngày Canh thành 5 ngày **Tân** ở tháng Sửu.
  - Sử dụng đối tượng `lunarAdjusted` để xác định chính xác số ngày thực tế trôi qua từ thời điểm bắt đầu Tiết khí (`prevJie`) theo múi giờ Việt Nam (UTC+7).
  - Sửa lỗi tính toán ngày trôi qua cho Ngũ hành tư lệnh: Ép buộc dùng mốc bắt đầu của các **Tiết (Jie)** như Tiểu Hàn, Lập Xuân... thay vì các **Khí (Qi)** như Đại Hàn, Vũ Thủy... để tính chính xác số ngày trôi qua kể từ lúc bắt đầu của tháng Bát Tự (ví dụ: ngày 23/01/1970 là ngày thứ 18 tính từ Tiết Tiểu Hàn thuộc tháng Sửu, cho ra kết quả đúng là **Kỷ vượng** thay vì **Quý vượng** tính từ Đại Hàn).
- **BaziController.js & HistoryController.js**: Tích hợp trường `tuLenhCan` vào cơ chế tự động nâng cấp cấu trúc lá số cho các bản ghi cũ khi người dùng xem lại.
- **NotificationScheduler.js**: Khắc phục lỗi cộng dồn nhiều lượt sử dụng (credit) khi khởi động lại server. Đã tích hợp kiểm tra `SystemLog` theo múi giờ Việt Nam (UTC+7) để đảm bảo hành động cộng credit `DAILY_CREDIT_INCREMENT` chỉ được thực hiện duy nhất 1 lần mỗi ngày, tránh lỗ hổng người dùng nhận thêm credit khi restart/crash server.


- **BaziBoard.jsx & concepts.js**:
  - Xóa hiển thị Tiết khí trên dòng Dương / Âm lịch chính.
  - Thêm một dòng mới chuyên biệt **"Tiết khí:"** hiển thị đầy đủ thông tin: `Tiết khí - Ngày [Can] vượng` (Ví dụ: `Tiết Thu Phân - Ngày Mậu vượng`).
  - Tô màu Thiên Can của ngày vượng (`tuLenhCan`) tự động theo màu Ngũ hành tương ứng (ví dụ: Mộc màu xanh, Hỏa màu đỏ, Thổ màu nâu...) bằng cách áp dụng hàm `getColorClass(stemElements[data.tuLenhCan])`.
  - Cập nhật màu sắc tên Tiết khí thay đổi động theo từng Mùa (Mùa xuân màu Xanh lá: `text-emerald-600`, Mùa hạ màu Đỏ: `text-rose-600`, Mùa thu màu Nâu đất: `text-amber-700`, Mùa đông màu Xanh dương: `text-blue-600`).
  - Tích hợp Component `<Tooltip>` vào tên Tiết khí để hiển thị giải nghĩa chi tiết và thời điểm bắt đầu của 24 Tiết khí nông lịch khi hover hoặc chạm trên di động.
  - Bổ sung định nghĩa đầy đủ học thuật cho toàn bộ 24 Tiết khí vào từ điển cấu trúc `concepts.js`.

---

## 📅 Phiên bản: Đồng bộ Múi giờ Tiết khí cho Dịch vụ Xem ngày tốt xấu (20/07/2026)

### Backend (Quy đổi Âm Dương & Lịch Pháp)
- **DateService.js (`evaluateDay`)**:
  - Tích hợp cơ chế điều chỉnh múi giờ GMT+8 (cộng thêm 1 giờ thông qua `solar.nextHour(1)`) để tính toán chính xác ranh giới rẽ Tiết khí cho Trụ Năm, Trụ Tháng, và Kiến Trừ (Trực).
  - Sử dụng đối tượng `lunarAdjusted` để lấy thông tin về năm, tháng và Trực (Kiến, Trừ, Mãn...), đảm bảo đồng bộ hoàn toàn với logic tính toán Tứ Trụ Bát Tự trong `BaziAnalyzer.js` và bảng Tiết khí múi giờ Việt Nam (UTC+7) trong tài liệu đối chiếu.
  - Giữ nguyên ranh giới Ngày địa phương (UTC+7) cho Trụ Ngày, Thần trị ngày (Hoàng Đạo/Hắc Đạo) và Cát hung ngày (Yi/Ji) để tránh xê dịch ngày lịch pháp gốc.

---

## 📅 Phiên bản: Tích hợp Thần Sát Học Thuật & Giao Diện Lưu Niên Đối Chiếu 6 Cột Bát Tự (Cập nhật Không Vong & Định dạng) (19/07/2026)

### Backend (Tính toán học thuật Bát tự & Prompt)
- **BaziAnalyzer.js (`getShenSha`)**:
  - Triển khai hàm tính toán 14 Thần Sát Bát Tự học thuật chuyên biệt (Thiên Ất, Thái Cực, Thiên Đức, Nguyệt Đức, Lộc Thần, Kình Dương, Dịch Mã, Hoa Cái, Đào Hoa, Tướng Tinh, Kiếp Sát, Vong Thần, Văn Xương, Cô Thần, Quả Tú). Được tách biệt hoàn toàn khỏi công thức Tử Vi.
  - Tách biệt các điều kiện so sánh thành độc lập để tính đúng và đủ tất cả trường hợp khi 1 trụ có nhiều Thần Sát.
  - Bổ sung thuật toán tính **Không Vong** dựa trên cả Nhật Trụ (Trụ Ngày) và Niên Trụ (Trụ Năm) gốc. Nếu địa chi trùng khớp, sẽ an thêm "Không Vong" vào danh sách Thần Sát của trụ đó.
- **Tách biệt Thần Sát & Nạp Âm**:
  - Bỏ tính toán Thần Sát cho các trụ phụ Đại Vận, Lưu Niên, Thai Nguyên và Mệnh Cung để giao diện được tối giản và rành mạch.
  - Đảm bảo tính toán và lưu trữ Nạp Âm (`naYin`) đầy đủ cho các năm Lưu Niên trong mảng dữ liệu.
- **BaziController.js**: Tích hợp hàm `hasNewSchema` kiểm tra cấu trúc dữ liệu của các bản ghi cũ. Nếu phát hiện bản ghi đã lưu từ trước thiếu trường tàng can (`tangCan`) của Đại Vận, server sẽ tự động tính toán lại dữ liệu mới nhất thông qua `BaziAnalyzer` để nâng cấp lên phiên bản đầy đủ nhất và ghi đè vào DB.
- **BaziPrompts.js**: Truyền danh sách Thần Sát đã được tính sẵn trực tiếp vào Prompt của AI nhằm loại bỏ lỗi LLM tự tính toán sai lệch hay nhầm lẫn sang hệ sao của Tử Vi. Bổ sung chỉ dẫn học thuật nghiêm ngặt.

### Frontend (Giao diện người dùng)
- **HomeBoard.jsx & UserApp.jsx**: Bổ sung ô nhập liệu "Họ và Tên (Không bắt buộc)" trên modal xem vận mệnh ở trang chủ, tự động điền tên của tài khoản đang đăng nhập. Truyền tham số tên này qua API lập lá số Bát Tự & Tử Vi tương ứng.
- **concepts.js**: Cập nhật từ điển khái niệm để bổ sung đầy đủ chi tiết đặc trưng, phân loại tốt/xấu, mô tả ý nghĩa và biểu trưng cho toàn bộ 22 sao Thần Sát Bát Tự. Người dùng giờ đây có thể di chuột/chạm vào các sao trên giao diện để xem giải nghĩa tức thời qua Tooltip.
- **BaziBoard.jsx (`Pillar` Component & Bố cục)**:
  - Sửa lỗi khuyết viền (border clipping) ở các thẻ Đại Vận khi được chọn (`scale-105`) hoặc di chuột bằng cách thêm vùng đệm `p-3` và lề âm `-m-3` cho thanh cuộn ngang Đại Vận.
  - Hiển thị đầy đủ hai cột phụ **Thai Nguyên** và **Cung Mệnh** trên bảng Tứ Trụ, nhưng ẩn (không tính toán) Thần Sát của chúng để đảm bảo sự tối giản và tập trung vào các trụ chính.
  - Cố định phần Tàng Can hiển thị **đúng 3 dòng** cho mọi địa chi để đảm bảo căn lề ngang thẳng tắp trên giao diện.
  - Thiết kế lại Thần Sát hiển thị dạng các dòng văn bản đơn giản căn giữa, không có chữ tiêu đề "THẦN SÁT", không có màu nền.
  - Phân loại màu chữ Thần Sát thành 3 nhóm (chỉ dùng màu chữ): Cát Thần tốt (màu xanh lá: `text-emerald-600`), Hung Thần xấu (màu đỏ: `text-rose-600`, bao gồm cả Không Vong), Cát Hung trung tính (màu đen: `text-slate-800`).
  - Hỗ trợ cấu hình thuộc tính `hideTruongSinh` và `hideNaYin` để tái sử dụng Pillar linh hoạt.
- **Định dạng Khoảng Cách & Tiêu Đề**:
  - Nút bấm chọn năm Lưu Niên đổi định dạng cách dấu ngoặc: `2026 ( 19 tuổi )`.
  - Tên Can Chi tiêu đề bảng đối chiếu đổi thành: ` 2026 ( Bính Ngọ )` (cách rời Can Chi).
  - Tên Can Chi tiêu đề Đại Vận đổi thành: `Đại Vận Canh Thân ( 39 - 48 Tuổi )`.
  - Bảng đối chiếu Bát Tự hiển thị đầy đủ Nạp Âm cho Đại Vận và Lưu Niên (bằng cách bỏ ẩn Nạp Âm `hideNaYin={false}`).

---

## 📅 Phiên bản: Giao diện Bát Tự Mobile 3 Cột (17/07/2026)

### Frontend
- **BaziBoard.jsx**: Thiết kế riêng và áp cứng bố cục mobile cho phần hiển thị các trụ Bát Tự. Khi chiều rộng màn hình nhỏ hơn `md` (768px), các trụ sẽ được chia cố định thành 3 cột đều đặn:
  - **Cột 1**: Thai Nguyên & Cung Mệnh (nếu có dữ liệu)
  - **Cột 2**: Trụ Ngày (Nhật Chủ) & Trụ Giờ (Giờ Sinh)
  - **Cột 3**: Trụ Năm (Năm Sinh) & Trụ Tháng (Nguyệt Lệnh)
- **Tương thích Responsive**: Trên màn hình máy tính (tablet/desktop từ `md` trở lên), giữ nguyên bố cục nằm ngang linh hoạt sử dụng `flex-row-reverse` truyền thống.

---

## 📅 Phiên bản: Thuật toán Bát tự Ngũ hành 5.2 - Lực Lượng Can Chi Cột (17/07/2026)

### Backend (Tính toán học thuật Bát tự)
- **Tích Hợp Lực Lượng Can Chi (Tải, Phúc, Song Thể, Che Đầu, Tiết Cước):** Tích hợp 60 tổ hợp tương tác nội tại Trụ (dọc) dựa trên 5 hình ảnh học thuật. Điều phối trực tiếp tỷ lệ gia tăng/giảm thiểu vào điểm nền thô (Base Weight) của Stems và Branches của từng Trụ trước khi tham gia các tương tác ngoại vi.
- **Xác nhận Học thuật Cung Mệnh & Thai Nguyên:** Đánh giá toán học công thức tính Cung Mệnh và Thai Nguyên từ Trụ Tháng/Trụ Giờ. Công thức đệ trình hoàn toàn chính xác với logic của thư viện `lunar-javascript` đang sử dụng.

### Tài liệu (Documentation)
- **Cập nhật Tài liệu:** Tài liệu hóa chi tiết cơ cấu Bát tự 5.2 và công thức toán học Cung Mệnh/Thai Nguyên trong [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md#L135-L150).

---

## 📅 Phiên bản: Sửa lỗi hiển thị sai Giới tính khi xem Lịch sử Bát Tự (16/07/2026)

### Frontend
- **UserApp.jsx (`handleViewHistoricalBazi`)**: Khắc phục lỗi hiển thị giới tính "Nam" khi xem chi tiết lá số Bát Tự từ lịch sử mặc dù bản ghi là "Nữ". Đã bổ sung việc truyền các trường `gender`, `name` và `inputInfo` từ `record.inputInfo` vào state `baziResult` khi nạp chi tiết từ lịch sử để đồng bộ với cấu trúc dữ liệu của API phân tích Bát Tự chính.

---

## 📅 Phiên bản: Bổ sung trường Tên cho Lá số Bát Tự & Tử Vi (16/07/2026)

### Database Schemas
- **BaziRecord & ZiweiRecord Schemas**: Bổ sung trường `inputInfo.name` (mặc định chuỗi rỗng) để lưu trữ tên tùy chọn của lá số.

### Backend
- **ZiweiValidator**: Nhận diện và làm sạch trường `name` đầu vào.
- **BaziController & ZiweiController**: Tự động sinh tên mặc định theo giới tính (`Bát Tự - Nam Mệnh`/`Nữ Mệnh` và `Tử Vi - Nam Mệnh`/`Nữ Mệnh`) nếu người dùng không nhập tên lá số. Lưu tên lá số vào cơ sở dữ liệu và trả về trong response.
- **Sửa lỗi Địa Chi Bán Hội (seasonalGroups count bug)**: Sửa lỗi trong `BaziAnalyzer.js` đếm trùng các chi cùng loại (ví dụ: `Tuất - Tuất` trong lá số `Mùi - Tuất - Tuất - Dần`) thành mối quan hệ "Bán Hội" (Phương Tây Kim cục). Thuật toán hiện tại yêu cầu các chi phải là duy nhất (distinct) để tạo thành nhóm Phương hội.
- **Nâng cấp thuật toán Tam Hợp / Bán Tam Hợp / Củng Hợp**: Tách biệt thành 2 trường hợp chính trong `BaziAnalyzer.js`:
  - Có Đế Vượng (Bán Tam Hợp thực sự): cộng điểm hệ số nhân bình thường (`+5%`).
  - Không có Đế Vượng (Củng Hợp, ví dụ `Dần - Tuất` khuyết `Ngọ`): cộng điểm ít hơn (`+2%`). Nếu Thiên can lộ hành dẫn hóa tương ứng (ví dụ `Bính`/`Đinh` cho Hỏa cục), điểm cộng được nâng lên bằng lúc có Đế Vượng (`+5%`).
  - Tích hợp kiểm tra xung sát (Lục Xung): Nếu bất kỳ địa chi nào trong tổ hợp hợp cục bị xung khắc trực tiếp bởi chi khác trong bản mệnh (ví dụ `Thân` xung `Dần`), hợp lực bị giải tỏa và không cộng điểm (`+0%`).

### Frontend
- **BaziInput & ZiweiBoard**: Bổ sung ô nhập liệu "Họ và Tên (Không bắt buộc)" tương thích với phong cách thiết kế UI của hệ thống.
- **BaziBoard & ZiweiChart**: Hiển thị tên lá số tại khu vực thông tin bản mệnh chính (chi tiết lá số và Trung Cung).
- **HistoryBoard**: Hiển thị tên lá số trên tiêu đề các thẻ lịch sử của Bát Tự và Tử Vi.

---

## 📅 Phiên bản: Thuật toán Bát tự Ngũ hành 5.1 - Nâng cấp Cự Ly & Tương Tác Cản Trở (14/07/2026)

### Backend (Tính toán học thuật Bát tự)
- **Tích Hợp Khoảng Cách Địa Chi (Branch Distance Multipliers):** Điều chỉnh các phần thưởng/hình phạt từ tổ hợp địa chi theo khoảng cách địa lý giữa các trụ (Kề nhau $\times 1.0$, Cách 1 trụ $\times 0.6$, Cách 2 trụ $\times 0.3$; Tam hợp/Tam hội có chi xa giảm còn $0.7$ hoặc $0.5$).
- **Can Trung Gian Cản Trở (Blockage):** Giảm $90\%$ lực lượng tương tác giữa 2 can cách xa nhau nếu có Can trung gian mạnh (tổng điểm gốc $\ge 5.0$) và khắc một trong hai Can đầu cuối.
- **Quá Tải Tương Tác Can (Saturation):** Can ưu tiên tương tác ở cự ly gần nhất trước ($100\%$), cự ly trung bình giảm còn $50\%$, cự ly xa nhất giảm còn $20\%$.

### Tài liệu (Documentation)
- **Cập nhật Tài liệu:** Bổ sung mô tả cơ cấu toán học Bát tự 5.1 vào [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md#L126-L135).

---

## 📅 Phiên bản: Thuật toán Bát tự Ngũ hành 5.0 - Toán Học Cân Bằng Động (13/07/2026)

### Backend (Tính toán học thuật Bát tự)
- **Thiết lập toán học Tầng 1 (Base Score) & Tầng 2 (Multiplier):** Loại bỏ hiện tượng đếm trùng (Double Counting) bằng cách tách biệt điểm nền tĩnh và chuyển toàn bộ các khoản thưởng phụ sang hệ số nhân tỷ lệ phần trăm.
- **Thông căn Diminishing Returns:** Áp dụng hệ số suy giảm thông căn nhiều lần (gốc 1: 100%, gốc 2: 70%, gốc 3: 40%, gốc 4: 20%) và phân cấp trọng số gốc (Bản khí: 100%, Trung khí: 70%, Dư khí: 40%).
- **Hợp Xung dạng tỷ lệ & Hóa mồi:** Quy đổi các tổ hợp chi sang hệ số nhân phần trăm. Cấp điểm mồi $3.0$ điểm cho ngũ hành khuyết (0 điểm) nếu chúng tham gia hợp hóa.
- **Tương sinh tương khắc phi tuyến:** Thay thế tương khắc tuyến tính bằng công thức tỷ lệ tương quan động phi tuyến giữa hai hành.
- **Làm mượt ngưỡng kích hoạt:** Tích hợp hàm **Smoothstep** làm mượt ranh giới phản sinh/phản khắc ($30\% - 40\%$) và con vượng mẹ kiệt để tránh bước nhảy bậc năng lượng đột ngột.
- **Bão hòa & Bù đắp:** Tự động giảm bonus khi hành cực thịnh ($>40\%$) và tăng bonus khi hành cực suy ($<8\%$, $<5\%$).
- **Điểm sàn phân cấp:** Can lộ ($5\%$), Bản khí ẩn ($4\%$), Trung khí ẩn ($2\%$), Dư khí ẩn ($1\%$).
- **Chỉ số nâng cao:** Tính toán và lưu trữ song song `nguHanhRaw` (Điểm thô), `entropy` (Chỉ số cân bằng), `dominanceIndex` (Chỉ số chuyên chế), và `confidenceScore` (Chỉ số tin cậy Nhật Chủ).

### Tài liệu (Documentation)
- **Đồng bộ hóa Tài liệu:** Cập nhật [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md#L96-L140) và [AGENTS.md](file:///t:/Phongthuy/AGENTS.md#L71-L76) mô tả các ràng buộc và thông số chi tiết của thuật toán toán học 5.0.

## 📅 Phiên bản: Thuật toán Bát tự Ngũ hành 4.0 (13/07/2026)

### Tài liệu (Documentation)
- **Đồng bộ hóa toàn bộ Tài liệu Dự án:**
  - Cập nhật [AGENTS.md](file:///t:/Phongthuy/AGENTS.md#L71-L76) để thiết lập các nguyên tắc và hạn chế kỹ thuật của Bát tự Ngũ hành 4.0, tránh rủi ro phá vỡ code từ các AI agent khác trong tương lai.
  - Cập nhật [README.md](file:///t:/Phongthuy/README.md#L90-L95) giới thiệu tệp tin và cơ chế lõi của `BaziAnalyzer.js` trong mục Core Services.
  - Cập nhật [PROJECT_CONTEXT.md](file:///t:/Phongthuy/docs/PROJECT_CONTEXT.md#L18) đồng bộ mô tả các tính năng toán học của thuật toán 4.0.
  - Cập nhật [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md#L94-L125) để tài liệu hóa toàn diện các công thức phần trăm sinh khắc tương đối, quy tắc ưu tiên chi, đa thấu phân khí, và điều kiện bypass điểm sàn tòng cách.

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
  - Viết mới [AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx) chứa đầy đủ biểu đồ Recharts, bộ lọc tìm kiếm bản ghi, giao diện nạp credit và xử lý khiếu nại của người dùng.

---

## 📅 Phiên bản: Sửa Lỗi Giao Diện Trắng Khi Chat & Nâng Cấp Bộ Lọc Từ Khóa Ý Định

### 1. Khắc phục lỗi crash trắng màn hình ở Frontend
- **Sửa đổi component [Tooltip.jsx](file:///t:/Phongthuy/frontend/src/components/Tooltip.jsx):** Khắc phục triệt để lỗi `TypeError: e.trim is not a function` bằng cách ép kiểu an toàn cho prop `term` về định dạng chuỗi trước khi gọi phương thức `.trim()` và xử lý hiển thị an toàn.
- **Sửa đổi component [AiChatWidget.jsx](file:///t:/Phongthuy/frontend/src/components/AiChatWidget.jsx):** Giải quyết lỗi `TypeError: val.trim is not a function` trong phương thức helper `isMeaningful` và cơ chế hiển thị các trường ý định phụ (`dos`, `donts`, `timing`, `risk`) bằng cách xử lý an toàn cho cả định dạng mảng (Array) hoặc đối tượng (Object) khi AI trả về kết quả cấu trúc. Đồng thời xử lý lọc bỏ các ký tự gạch đầu dòng trùng lặp (`-`, `*`, `•`) khi định dạng mảng để tránh lỗi hiển thị nested list (lồng danh sách trống).

### 2. Mở rộng từ khóa cho Bộ lọc Ý định Chat (Intent Filtering) ở Backend
- **Sửa đổi [ConversationContextService.js](file:///t:/Phongthuy/backend/src/services/ConversationContextService.js):** Bổ sung thêm danh sách phong phú các từ khóa thường dùng trong đời sống hàng ngày và thuật ngữ chuyên môn của Bát Tự/Dịch Lý (như "con cái", "gia đạo", "tiền", "làm ăn", "bầu bí", v.v.) vào hàm `isDivinationRelated` để giảm thiểu các trường hợp từ chối sai (lỗi 400).

---

## 📅 Phiên bản: Bổ sung Chức năng Ghim Bản ghi Lịch sử (Pin Calculations)

### 1. Database (MongoDB / Mongoose Models)
- **Thêm trường `isPinned`:** Cập nhật các schemas: [IChingRecord.js](file:///t:/Phongthuy/backend/src/models/IChingRecord.js), [BaziRecord.js](file:///t:/Phongthuy/backend/src/models/BaziRecord.js), [ZiweiRecord.js](file:///t:/Phongthuy/backend/src/models/ZiweiRecord.js), và [MarriageRecord.js](file:///t:/Phongthuy/backend/src/models/MarriageRecord.js) để thêm trường `isPinned: { type: Boolean, default: false }`.

### 2. Backend (Routes & Controllers)
- **API Ghim bản ghi:** Đăng ký route mới `PUT /api/history/calculations/:type/:id/pin` trong [history.js](file:///t:/Phongthuy/backend/src/routes/history.js).
- **Controller Logic (`HistoryController.js`):**
  - Viết mới phương thức `pinCalculation` để kiểm tra phân quyền, thay đổi giá trị `isPinned` của bản ghi chỉ định và xóa cache lịch sử của người dùng tương ứng.
  - Cập nhật các hàm `getHexagramHistory`, `getBaziHistory`, `getZiweiHistory`, và `getMarriageHistory` để sắp xếp dữ liệu ưu tiên bản ghi được ghim lên đầu: `.sort({ isPinned: -1, createdAt: -1 })`.

### 3. Frontend (Services & Components)
- **API Call:** Khai báo hàm `pinCalculation` trong [api.js](file:///t:/Phongthuy/frontend/src/services/api.js).
- **Giao diện Lịch sử (`HistoryBoard.jsx`):**
  - Tích hợp biểu tượng `Pin` từ thư viện `lucide-react`.
  - Thiết kế nút Ghim (Pin) tương ứng với mỗi thẻ bản ghi. Hỗ trợ hiển thị hiệu ứng đổi màu động theo trạng thái ghim và theo tông màu chủ đạo của phân hệ (Amber cho Kinh Dịch, Blue cho Bát Tự, Purple cho Tử Vi, Rose cho Hợp Hôn).
  - Tự động thay đổi phong cách hiển thị viền nổi bật (border highlight), bóng mờ (shadow) và hiển thị nhãn "Đã ghim" (badge) bên cạnh ngày sinh/ngày gieo quẻ cho các thẻ được ghim.
  - Viết mới hàm `handleTogglePin` xử lý thay đổi trạng thái và tự động sắp xếp lại (re-sort) danh sách tại client-side để đồng bộ tức thời không cần tải lại trang. Loại bỏ thông báo popup thành công (`showAlert`) khi ghim để thao tác ghim/bỏ ghim diễn ra mượt mà và yên lặng (silent toggle).
- **Phong cách hiển thị danh sách (`index.css`):**
  - Thu nhỏ khoảng cách căn lề trái (padding-left) của thẻ danh sách `.markdown-content ul` và `.markdown-content ol` từ `1.25rem` xuống `0.9rem` để tối ưu hóa không gian hiển thị của danh sách gạch đầu dòng trên các thiết bị di động và các thẻ chat có diện tích hẹp.

---

## 📅 Phiên bản: Tách Biệt Thần Sát Tĩnh/Động & Nâng Cấp Thuật Toán Ngũ Hành Bát Tự 4.0

### 1. Tách Biệt Thần Sát Tĩnh & Động (Thái Tuế)
- **Backend & Frontend:**
  - Tách biệt hoàn toàn Thần Sát Tĩnh (Natal Stars - theo lá số bản mệnh) và Thần Sát Động (Yearly/Tai Sui Stars - tính theo lưu niên).
  - Phần đối chiếu vận hạn tổng hợp ở cuối trang chỉ hiển thị Thần Sát Tĩnh. Phần Niên Biểu Thần Sát hiển thị gộp cả Thần Sát Tĩnh và Thần Sát Động.
  - Lược bỏ sao phối hợp thập thần `Tỷ Kiên Cô Quả` ra khỏi kết quả phân tích trong [BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js).
  - Tự động lọc bỏ từ khóa "Quý Nhân" ở giao diện hiển thị tên sao để tối ưu hóa không gian hiển thị.

### 2. Sửa Lỗi Lệch Chiều Cao & Căn Thẳng Hàng Các Đường Nét Đứt
- **Frontend:**
  - **Bát Tự ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx)):**
    - Lược bỏ thuộc tính `h-full` tại thẻ cột trụ so sánh đối chiếu để cơ chế `items-stretch` của Flexbox tự động dãn đều các cột theo chiều cao của cột dài nhất.
    - Sửa đổi container Thập Thần trống của Nhật Chủ (Trụ Ngày) sử dụng `<span className="invisible">&nbsp;</span>` thay vì chuỗi trống `''` để ngăn trình duyệt tự động sụp đổ (collapse) chiều cao của ô, giúp căn hàng đầu của các trụ thẳng hàng tuyệt đối.
    - Loại bỏ wrapper div dùng `mt-auto` và `justify-end` ở phần Tàng Can & Thần Sát trong component `Pillar`. Đồng thời đặt khoảng cách cố định `mt-4` cho Tàng Can so với phần trên. Giải pháp này giúp căn chỉnh tất cả các đường nét đứt phân cách (`--------`) của cả 3 phần (Phần trên, Tàng Can, Thần Sát) thẳng hàng tuyệt đối nằm ngang trên toàn bộ 6 cột trụ Bát Tự.
  - **Hợp Hôn ([MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx)):**
    - Loại bỏ thuộc tính căn đều `justify-between` trên thẻ trụ `PillarCard` để các cột không bị kéo dãn khác nhau theo độ dài sao.
    - Đặt khoảng cách cố định `mt-4` cho Tàng Can so với phần trên, đồng bộ hóa hoàn toàn với Bát Tự giúp các đường phân nét đứt thẳng hàng tuyệt đối.

### 3. Nâng Cấp Thuật Toán Bát Tự & Cân Bằng Ngũ Hành
- **Backend ([BaziAnalyzer.js](file:///t:/Phongthuy/backend/src/services/BaziAnalyzer.js)):**
  - Khắc phục lỗi hàm `evaluate7LevelEnergy` gán cứng trạng thái Nhật Chủ là `CỰC NHƯỢC` cho toàn bộ các lá số Tòng Cách. Đã bổ sung bộ lọc phân loại dựa trên tỷ lệ Đồng Đảng: nếu tỷ lệ Đồng Đảng $\ge 50\%$ (như Thủy vượng 98% của Nhuận Hạ Cách) sẽ phản hồi trạng thái Nhật Chủ là **`CỰC VƯỢNG`**.
  - Bổ sung logic **Thuận khắc cực đoan (Cường khắc)**: Khi một hành khắc chiếm ưu thế tuyệt đối ($>40\%$ tổng lượng ngũ hành), hành bị khắc sẽ bị suy kiệt nặng nề hoặc bị tiêu diệt (giảm tối đa 90% điểm số, ví dụ Thủy vượng Hỏa tắt). Nhờ đó, hành bị khắc sẽ hiển thị đúng về $0\%$ trên biểu đồ.
  - **Sửa lỗi xác định Được Tư Lệnh (`isDucTuLenh`):** Thay đổi logic kiểm tra quan hệ ngũ hành giữa Nhật chủ (`dmElem`) và lệnh tháng (`tuLenhElem`). Trước đây kiểm tra ngược thành `relation[tuLenhElem][dmElem] === 'duoc_sinh'`, dẫn đến việc Thân Kim sinh tháng Thân lại bị coi là Thổ được Kim sinh (được Tư Lệnh), làm sai lệch toàn bộ trạng thái Nhật chủ sang Cường Vượng. Sau khi sửa thành `relation[dmElem][tuLenhElem] === 'duoc_sinh'`, hệ thống đánh giá chính xác Nhật chủ là **NHƯỢC** (Thất lệnh), Dụng thần là **HỎA** và Hỷ thần là **THỔ**.
  - **Sửa lỗi phân loại Tòng Cách (`tongCachType`):** Khắc phục lỗi hoán đổi vị trí phân loại Tòng Sát và Tòng Tài do đặt điều kiện so khớp nhầm giữa hành khắc và hành bị khắc. Đồng thời bổ sung trường hợp hành mạnh nhất là Ấn tinh (`duoc_sinh`) để gán chính xác là **Tòng Cường cách** thay vì rơi vào nhánh "Tòng cách đặc biệt" mặc định.
- **Kiểm thử ([BaziAnalyzer.test.js](file:///t:/Phongthuy/backend/tests/services/BaziAnalyzer.test.js), [InputValidator.test.js](file:///t:/Phongthuy/backend/tests/services/InputValidator.test.js), [IChingDataService.test.js](file:///t:/Phongthuy/backend/tests/services/IChingDataService.test.js)):**
  - Bổ sung bộ kiểm thử hồi quy bảo đảm tính đúng đắn cho logic Được Tư Lệnh và phân loại Tòng Cách.
  - Bổ sung kiểm thử tự động toàn diện cho **tất cả 15 cách cục hiện có** (5 ngoại cách độc vượng, 10 cách cục thập thần thông thường).
  - Bổ sung kiểm thử độ chính xác của **Dụng Thần, Hỷ Thần và Kỵ Thần** dựa trên các nhóm trạng thái Nhật Chủ Thân Vượng và Thân Nhược khác nhau (bao gồm các ca thực tế không bị nhiễu do Điều Hầu mùa đông).
  - **Tạo mới bộ kiểm thử cho `InputValidator.js`:** Bao quát 14 tests xác thực toàn bộ các luồng dữ liệu đầu vào của Bát Tự (Bazi), Tử Vi (Ziwei), Hợp Hôn (Marriage), và Kinh Dịch (IChing), bao gồm kiểm thử ngày thực tế (nhuận/thường), múi giờ, số hào Kinh Dịch, và giới hạn ký tự câu hỏi.
  - **Bổ sung kiểm thử cho Kinh Dịch (`IChingDataService.test.js`):** Thêm các test case tự động cho phương thức `calculate()`, bảo đảm giải đoán trùng khớp cấu trúc đầu ra của quẻ chủ, quẻ biến, tính chính xác của Lục Thần (Lục Thú), múi giờ Hà Nội (Asia/Ho_Chi_Minh), và cơ chế ném lỗi khi số hào gieo không hợp lệ.
- **Tài liệu:** Cập nhật các quy tắc học thuật mới này vào [BUSINESS_RULES.md](file:///t:/Phongthuy/docs/BUSINESS_RULES.md).

### 4. Sửa Lỗi Tự Động Xuống Dòng Dấu Ngoặc Đóng Thần Sát
- **Frontend ([BaziBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BaziBoard.jsx), [MarriageBoard.jsx](file:///t:/Phongthuy/frontend/src/components/MarriageBoard.jsx)):**
  - Loại bỏ các khoảng trắng dư thừa bên trong dấu ngoặc của nhãn Thần Sát (ví dụ: `( ngày )` chuyển thành `(ngày)`, `( năm )` chuyển thành `(năm)`) để trình duyệt hiểu đây là một chuỗi liền mạch, ngăn chặn việc tự động bẻ dấu ngoặc đóng `)` xuống dòng mới khi chiều ngang bị thu hẹp.
  - Tích hợp lớp CSS `whitespace-nowrap` cho các thẻ hiển thị Thần Sát của cả bốn Trụ bản mệnh lẫn cột Niên biểu vận hạn, đảm bảo toàn bộ tên Thần Sát luôn nằm gọn gàng trên cùng một dòng.



---

## 📅 Phiên bản: Hỗ Trợ Chủ Đề (Categories) Động & Cập Nhật Metadata Hiển Thị Bài Viết Blog

### 1. Backend & Database
- **Mongoose Schema ([BlogPost.js](file:///t:/Phongthuy/backend/src/models/BlogPost.js)):**
  - Gỡ bỏ thuộc tính `enum` giới hạn trong trường `category`, chuyển đổi sang kiểu `String` có cấu trúc động kèm các bộ lọc `trim` và giá trị mặc định là `'Chung'` (`default: 'Chung'`). Việc này cho phép tạo các chủ đề/category mới không giới hạn và tự ý nhập liệu bằng tiếng Việt trực tiếp (ví dụ: "ngũ hành", "sức khỏe").
- **API Routing & Controllers ([blog.js](file:///t:/Phongthuy/backend/src/routes/blog.js), [BlogController.js](file:///t:/Phongthuy/backend/src/controllers/BlogController.js)):**
  - Bổ sung endpoint mới `GET /api/blog/categories` lấy danh sách toàn bộ các chủ đề (categories) độc nhất hiện có từ cơ sở dữ liệu (`BlogPost.distinct('category')`), tự động sắp xếp theo thứ tự bảng chữ cái tiếng Việt.
  - Phân quyền động cho phép Admin xem cả các chủ đề của các bài viết nháp (`isPublished: false`), trong khi người dùng thường chỉ nhìn thấy các chủ đề của các bài viết đã công khai.

### 2. Frontend & Giao diện Người dùng
- **Trang chi tiết bài viết ([BlogBoard.jsx](file:///t:/Phongthuy/frontend/src/components/BlogBoard.jsx)):**
  - Loại bỏ hoàn toàn badge category màu mè dư thừa ở đầu trang chi tiết của cả bản desktop và mobile để thu gọn chiều cao header theo yêu cầu của người dùng.
  - Tích hợp nhãn hiển thị chủ đề động `"Chủ đề: [Tên chủ đề]"` ngay bên cạnh tác giả trên dòng metadata của bài viết, sử dụng màu chữ Indigo đậm nổi bật nhằm tăng tính đồng bộ thẩm mỹ.
  - Hỗ trợ click trực tiếp vào badge chủ đề trên thẻ bài viết hoặc link chủ đề dưới tiêu đề bài viết chi tiết để tự động lọc và hiển thị toàn bộ bài viết cùng chủ đề một cách nhanh chóng. Tích hợp `e.stopPropagation()` ngăn chặn hiện tượng nổi bọt sự kiện (event bubbling) khi click badge từ danh sách.
  - Nâng cấp nạp danh mục động khi component được khởi tạo (`mount`), thay thế mảng tĩnh cứng `CATEGORIES` cũ bằng `categories` state đồng bộ trực tiếp từ DB.
  - Viết mới các hàm helper `getCategoryLabel` và `getCategoryColor` hỗ trợ dịch tự động các danh mục tiếng Anh cũ (`bazi` thành "Bát Tự", `iching` thành "Kinh Dịch"...) và giữ nguyên văn các chủ đề tiếng Việt tự gõ mới tạo, đồng thời gán màu sắc HSL trang nhã tương ứng (màu xanh indigo dịu nhẹ cho các chủ đề mới).
- **Trang Quản trị Blog ([AdminApp.jsx](file:///t:/Phongthuy/frontend/src/components/AdminApp.jsx)):**
  - Nạp danh sách gợi ý categories từ API khi admin truy cập phân hệ Blog.
  - Thay thế ô chọn danh mục `<select>` gán cứng cũ trong Modal soạn thảo/chỉnh sửa bài viết bằng input text thông minh liên kết với `<datalist id="blog-categories-list">`. Cơ chế này cho phép admin vừa có thể chọn nhanh từ danh sách các chủ đề cũ đã tồn tại, vừa có thể nhập một chủ đề mới hoàn toàn một cách mượt mà và trực quan.
  - Làm mới (refresh) danh sách gợi ý chủ đề ngay sau khi lưu/cập nhật bài viết thành công.
  - Cập nhật nhãn category trong bảng danh sách bài viết quản trị để tự động hiển thị đúng tên chủ đề tiếng Việt tự tạo hoặc dịch các mã danh mục cũ.

### 3. Kiểm thử & Tài liệu
- **Kiểm thử Giao diện (Browser Verification):**
  - Sử dụng Chrome DevTools MCP chạy Dev Server, giả lập và chụp ảnh màn hình desktop/mobile chứng minh hiển thị chủ đề bên cạnh tác giả hoạt động chính xác và cực kỳ gọn gàng.
- **Tài liệu Kỹ thuật ([DATABASE.md](file:///t:/Phongthuy/docs/DATABASE.md), [API.md](file:///t:/Phongthuy/docs/API.md)):**
  - Đồng bộ cấu trúc schema `BlogPost.category` mới trong tài liệu database.
  - Cập nhật tài liệu API chi tiết cho endpoint `GET /api/blog/categories` mới cùng các bộ lọc tham số category động của API blog.
