const BlogPost = require('../models/BlogPost');
const logger = require('./LoggerService');

const SEED_POSTS = [
  {
    title: 'Ý Nghĩa 64 Quẻ Kinh Dịch Và Phương Pháp Giải Đoán Cát Hung',
    slug: 'y-nghia-64-que-kinh-dich-va-giai-doan-cat-hung',
    summary: 'Khám phá ý nghĩa sâu xa của 64 quẻ dịch, cách phân biệt quẻ Chính, quẻ Biến, hào Động và phương pháp ứng dụng Kinh Dịch Lục Hào để dự đoán cát hung trong cuộc sống.',
    category: 'iching',
    tags: ['Kinh Dịch', 'Gieo Quẻ', 'Lục Hào', 'Cổ Học'],
    thumbnailUrl: '',
    author: 'Chuyên gia Dịch Học',
    content: `# Ý Nghĩa 64 Quẻ Kinh Dịch Và Phương Pháp Giải Đoán Cát Hung

Kinh Dịch là đỉnh cao của trí tuệ cổ học phương Đông, không chỉ là một cuốn sách bói toán mà là một hệ thống triết học giải thích sự vận động của vạn vật vũ trụ thông qua hai trạng thái cơ bản: **Âm** và **Dương**. 

Trong bài viết này, chúng ta sẽ tìm hiểu về cấu trúc của 64 quẻ dịch và phương pháp giải đoán Lục Hào cơ bản để ứng dụng vào việc dự đoán cát hung, tìm kiếm hướng đi đúng đắn.

---

## 1. Cấu Trúc Của Một Quẻ Dịch
Mỗi quẻ Dịch (còn gọi là quẻ kép) được cấu tạo từ hai quẻ đơn (Bát Quái) xếp chồng lên nhau:
*   **Thượng quái (Quẻ ngoại):** Nằm ở phía trên, đại diện cho môi trường bên ngoài, xã hội, những yếu tố khách quan hoặc tương lai.
*   **Hạ quái (Quẻ nội):** Nằm ở phía dưới, đại diện cho bản thân, nội bộ gia đình, yếu tố chủ quan hoặc hiện tại.

Mỗi quẻ kép gồm có **6 hào** được đếm từ dưới lên trên (Hào 1 đến Hào 6). Hào có thể là Hào Dương (vạch liền \`—\`) hoặc Hào Âm (vạch đứt \`--\`).

---

## 2. Ý Nghĩa Của Quẻ Chính Và Quẻ Biến
Khi gieo quẻ (bằng đồng xu hoặc Mai Hoa), chúng ta thường gặp trạng thái **Hào Động** (hào có sự biến đổi từ Âm sang Dương hoặc ngược lại):
*   **Quẻ Chính (Quẻ Chủ):** Là quẻ ban đầu thu được ngay khi gieo. Quẻ này mô tả trạng thái hiện tại, bản chất nguyên nhân của sự việc bạn đang thắc mắc.
*   **Quẻ Biến:** Là quẻ hình thành sau khi các hào động biến đổi (Dương hóa Âm, Âm hóa Dương). Quẻ Biến đại diện cho xu hướng phát triển cuối cùng, kết quả tương lai của sự việc.

*Nếu quẻ gieo được không có hào động, sự việc sẽ diễn tiến tĩnh lặng và kết quả chính là ý nghĩa của quẻ Chính.*

---

## 3. Quy Trình Giải Đoán Lục Hào Cơ Bản
Để luận đoán một quẻ dịch chi tiết theo phương pháp Lục Hào học thuật, ta cần thực hiện các bước sau:

### Bước 1: Xác định Dụng Thần
Dụng Thần là hào đại diện cho sự việc cần hỏi. Tùy thuộc vào câu hỏi, ta chọn một trong năm mối quan hệ (Lục Thân) làm Dụng Thần:
1.  **Phụ Mẫu:** Hỏi về cha mẹ, nhà cửa, hợp đồng, bằng cấp, xe cộ.
2.  **Quan Quỷ:** Hỏi về công danh, sự nghiệp, thi cử, hoặc tai nạn, bệnh tật. Với nữ giới, Quan Quỷ đại diện cho chồng/bạn trai.
3.  **Thê Tài:** Hỏi về tiền bạc, của cải, kinh doanh. Với nam giới, đại diện cho vợ/bạn gái.
4.  **Tử Tôn:** Hỏi về con cái, phúc đức, giải nạn, thuốc men chữa bệnh.
5.  **Huynh Đệ:** Hỏi về bạn bè, đồng nghiệp, đối tác hoặc sự cạnh tranh, hao tài.

### Bước 2: Xem xét Nhật Nguyệt (Ngày và Tháng gieo quẻ)
Ngũ hành của Ngày và Tháng gieo quẻ đóng vai trò quyết định nguồn năng lượng vượng hay suy của Dụng Thần:
*   Nếu Dụng Thần được Ngày/Tháng sinh hoặc đồng hành $\rightarrow$ **Vượng tướng** (Sự việc dễ thành công, có nội lực mạnh).
*   Nếu Dụng Thần bị Ngày/Tháng khắc hoặc sinh xuất $\rightarrow$ **Hưu tù** (Yếu thế, khó thành công hoặc gặp nhiều trắc trở).

### Bước 3: Phân tích Hào Động và Hào Biến
Hào động là tác nhân thúc đẩy sự việc biến chuyển:
*   Hào động sinh Dụng Thần: Có quý nhân giúp đỡ, thời cơ đến.
*   Hào động khắc Dụng Thần: Gặp tiểu nhân cản trở, nguy cơ rủi ro cao.
*   **Hóa Tiến Thần:** Hào động biến ra hào đồng hành nhưng chi tiến lên (Ví dụ: Dần hóa Mão) $\rightarrow$ Sự việc phát triển ngày càng mạnh mẽ.
*   **Hóa Thoái Thần:** Biến ra hào đồng hành nhưng đi lùi (Ví dụ: Mão hóa Dần) $\rightarrow$ Năng lượng suy giảm, thoái lui nửa chừng.

---

## 4. Lời Khuyên Khi Chiêm Nghiệm Kinh Dịch
Gieo quẻ Kinh Dịch là cách để chúng ta trò chuyện với tiềm thức và quy luật vũ trụ. Để quẻ dịch đạt độ linh ứng cao nhất, bạn cần chú ý:
*   **Tập trung ý niệm:** Chỉ hỏi khi tâm trạng bình tĩnh, đặt câu hỏi rõ ràng, cụ thể.
*   **Không hỏi đi hỏi lại một việc:** Một sự việc chỉ gieo hỏi 1 lần. Nếu kết quả chưa rõ, cần đợi thời gian thích hợp mới hỏi lại.
*   **Tâm thành ý chính:** Dùng Kinh Dịch để tìm hướng đi thiện lương, tránh mưu cầu những việc hại người lợi mình.

Hy vọng bài viết này giúp bạn hiểu rõ hơn về logic vận hành của phân hệ **Kinh Dịch Lục Hào** trên ứng dụng của chúng tôi!
`
  },
  {
    title: 'Hướng Dẫn Tự Xem Lá Số Bát Tự (Tứ Trụ) Chi Tiết Từ A-Z',
    slug: 'huong-dan-tu-xem-la-so-bat-tu-chi-tiet-tu-a-z',
    summary: 'Tìm hiểu cách đọc hiểu mệnh bàn Tứ Trụ Bát Tự cá nhân, phân tích cán cân Ngũ Hành và cách tìm ra Dụng Thần để cải thiện vận số hanh thông.',
    category: 'bazi',
    tags: ['Bát Tự', 'Tứ Trụ', 'Ngũ Hành', 'Dụng Thần'],
    thumbnailUrl: '',
    author: 'Chuyên gia Bát Tự',
    content: `# Hướng Dẫn Tự Xem Lá Số Bát Tự (Tứ Trụ) Chi Tiết Từ A-Z

Bát Tự (hay còn gọi là Tứ Trụ) là bộ môn mệnh lý học chính tông dựa trên 4 cột mốc thời gian sinh của một người: **Giờ, Ngày, Tháng, Năm sinh**. Mỗi trụ gồm một Thiên Can và một Địa Chi, tổng cộng là 8 chữ (Bát Tự). 

Mục tiêu lớn nhất của Bát Tự không phải là bói toán định mệnh, mà là **tìm ra sự mất cân bằng của Ngũ Hành** và ứng dụng các phương pháp cải vận bằng **Dụng Thần**.

---

## 1. Bản Mệnh Nhật Chủ - Bạn Là Ai?
Chữ quan trọng nhất trên lá số Bát Tự của bạn chính là **Thiên Can của ngày sinh** (được gọi là **Nhật Chủ** hoặc **Nhật Nguyên**).
*   Nhật Chủ đại diện cho chính bản thân bạn, là cốt lõi tính cách và là điểm gốc để so sánh vượng suy với các hành khác trên lá số.
*   Ví dụ: Nếu ngày sinh của bạn có thiên can là **Giáp Mộc**, bạn mang bản tính của cây đại thụ thẳng thắn, nhân hậu nhưng đôi khi bảo thủ. Nếu là **Đinh Hỏa**, bạn giống như ngọn lửa ngọn nến ấm áp, tỉ mỉ nhưng dễ dao động cảm xúc.

---

## 2. Phân Tích Cán Cân Ngũ Hành (Vượng Suy)
Một lá số Bát Tự lý tưởng là lá số có ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ) phân bổ hài hòa, lưu thông. Tuy nhiên, 99% con người sinh ra đều có lá số bị lệch khí: có hành quá vượng (quá mạnh) và có hành cực suy (quá yếu hoặc khuyết).

Hệ thống tính toán **Bát Tự 5.0** trên ứng dụng của chúng tôi tự động tính điểm khí lực của từng ngũ hành dựa trên:
1.  **Đắc lệnh:** Nhật chủ sinh vào tháng có ngũ hành đồng hành hoặc tương sinh (Ví dụ Nhật chủ Mộc sinh tháng Xuân là đắc lệnh $\rightarrow$ Thân Vượng).
2.  **Thông căn:** Các thiên can lộ trên mặt có gốc địa chi tàng ẩn bên dưới để bám vào.
3.  **Tương tác sinh khắc:** Các mối quan hệ Tam Hợp, Tam Hội, Lục Xung, Khắc chế giữa các trụ.

---

## 3. Định Nghĩa Dụng Thần và Hỷ Thần
Sau khi đo lường tổng điểm ngũ hành, chúng ta sẽ biết lá số của mình thuộc trạng thái **Thân Vượng (thừa năng lượng)** hay **Thân Nhược (thiếu năng lượng)**:

*   **Nếu Thân Vượng:** Ta cần dùng các hành giúp **hao tán bớt** hoặc **chế ngự** bớt bản mệnh. Hành được chọn đó gọi là **Dụng Thần**.
*   **Nếu Thân Nhược:** Ta cần dùng các hành giúp **sinh trợ** hoặc **đồng hành** để tiếp sức cho bản mệnh mạnh lên. Hành tiếp sức đó chính là **Dụng Thần**.
*   **Hỷ Thần:** Là hành tương sinh hoặc giúp đỡ đắc lực cho Dụng Thần.
*   **Kỵ Thần:** Là hành gây tổn hại trực tiếp đến Dụng Thần, mang lại vận hạn trắc trở.

---

## 4. Ứng Dụng Dụng Thần Để Cải Vận Trong Đời Sống
Khi đã biết rõ ngũ hành Dụng Thần của mình là gì, bạn có thể chủ động áp dụng vào cuộc sống hàng ngày để bổ trợ năng lượng cát tường:

*   **Dụng thần là Mộc:** Nên chọn hướng Đông; mặc trang phục màu xanh lá cây; làm các công việc liên quan đến cây cối, giáo dục, viết lách; trồng nhiều cây xanh trong nhà.
*   **Dụng thần là Hỏa:** Nên chọn hướng Nam; mặc trang phục màu đỏ, hồng, cam, tím; làm các công việc liên quan đến công nghệ, ẩm thực, năng lượng; giữ nhà cửa đủ ánh sáng ấm áp.
*   **Dụng thần là Thổ:** Nên chọn hướng Trung tâm hoặc Tây Nam, Đông Bắc; mặc màu vàng, nâu; làm ngành nghề bất động sản, xây dựng, gốm sứ; hành thiền định để gia tăng năng lượng đất ấm.
*   **Dụng thần là Kim:** Nên chọn hướng Tây, Tây Bắc; mặc màu trắng, xám, ghi, vàng ánh kim; làm ngành tài chính, trang sức, kim khí; đeo trang sức kim loại vàng/bạc.
*   **Dụng thần là Thủy:** Nên chọn hướng Bắc; mặc màu đen, xanh nước biển; làm ngành logistics, nước giải khát, truyền thông; đặt bể cá hoặc phong thủy luân trong nhà.

Hãy kiểm tra kết quả phân tích lá số Bát Tự của bạn trên ứng dụng để xem biểu đồ ngũ hành và nhận lời khuyên Dụng Thần cá nhân hóa ngay hôm nay!
`
  },
  {
    title: 'Sao Thái Tuế Là Gì? Các Phương Pháp Hóa Giải Hạn Thái Tuế Hiệu Quả',
    slug: 'sao-thai-tue-la-gi-va-cach-hoa-giai-hieu-qua',
    summary: 'Tìm hiểu định nghĩa sao Thái Tuế dưới góc nhìn thiên văn và mệnh lý học Tử Vi, nhận diện các tuổi phạm Thái Tuế trong năm và cách cúng kiếng hóa giải.',
    category: 'ziwei',
    tags: ['Tử Vi', 'Thái Tuế', 'Hóa Giải', 'Sao Hạn'],
    thumbnailUrl: '',
    author: 'Chuyên gia Tử Vi',
    content: `# Sao Thái Tuế Là Gì? Các Phương Pháp Hóa Giải Hạn Thái Tuế Hiệu Quả

Trong văn hóa phương Đông và môn mệnh lý học Tử Vi, **Thái Tuế** (hay còn gọi là trị niên Thái Tuế) là một vị thần cai quản cát hung họa phúc của trần gian trong suốt một năm đó. Dưới góc nhìn thiên văn học cổ, Thái Tuế chính là đại diện cho **Sao Mộc** (Jupiter) — hành tinh lớn nhất hệ mặt trời có chu kỳ quay quanh mặt trời khoảng 12 năm, tương đương với 12 địa chi.

Khi tuổi của bạn trùng hoặc xung với địa chi của năm hiện tại, dân gian gọi là **Phạm Thái Tuế**. 

---

## 1. Các Trạng Thái Phạm Thái Tuế
Không phải cứ phạm Thái Tuế là đều gặp xui xẻo giống nhau. Mức độ ảnh hưởng phụ thuộc vào loại xung khắc địa chi cụ thể:

1.  **Trực Thái Tuế (Trùng tuổi):** Tuổi bản mệnh trùng với con giáp của năm (Ví dụ người tuổi Tý gặp năm Tý). Chủ về tâm trạng bất an, dễ có biến động lớn về công việc, sức khỏe dao động.
2.  **Xung Thái Tuế (Đối xung):** Tuổi bản mệnh đối diện trực tiếp với năm đó (Ví dụ tuổi Tý xung năm Ngọ). Đây là trạng thái biến động mạnh nhất, dễ gặp trục trặc hợp đồng, di chuyển đi lại nhiều, hao tổn tiền bạc.
3.  **Hình Thái Tuế (Hình phạt):** Tuổi bản mệnh và năm nằm trong quan hệ địa chi tương hình (Ví dụ Dần - Tỵ - Thân hình nhau). Chủ về thị phi, kiện tụng pháp lý, hoặc gặp rắc rối giấy tờ công sở.
4.  **Hại Thái Tuế (Hại hại):** Tuổi bản mệnh và năm nằm trong quan hệ địa chi tương hại. Chủ về bị phản bội, tiểu nhân đâm sau lưng, tình cảm rạn nứt.
5.  **Phá Thái Tuế (Phá hoại):** Tuổi bản mệnh và năm nằm trong quan hệ địa chi tương phá. Chủ về tiền của hao hụt đột ngột, việc kinh doanh bị cản trở giữa chừng.

---

## 2. Sao Thái Tuế Trên Mệnh Bàn Tử Vi
Trong lá số Tử Vi cát cánh, sao Thái Tuế là một phụ tinh luôn an tại cung vị trùng với địa chi năm xem hạn.
*   Cung vị có Thái Tuế tọa thủ sẽ là tiêu điểm chú ý chính của năm đó. Nó mang lại năng lượng mạnh mẽ, thúc đẩy sự thay đổi quyết liệt.
*   Nếu Thái Tuế hội hợp với nhiều cát tinh (Hóa Lộc, Hóa Quyền, Thiên Khôi, Thiên Việt) $\rightarrow$ Bạn sẽ có một năm đột phá lớn, thăng tiến vượt trội đầy uy thế.
*   Nếu Thái Tuế hội tụ nhiều sát bại tinh (Kình Dương, Đà La, Không Kiếp, Hóa Kỵ) $\rightarrow$ Khó tránh khỏi tai ương, thị phi vây hãm, bệnh tật đau ốm.

---

## 3. Các Phương Pháp Hóa Giải Hạn Thái Tuế
Dù phạm Thái Tuế, bạn cũng không nên quá hoang mang lo sợ. Cổ nhân luôn có các giải pháp hóa giải để giảm thiểu rủi ro, chuyển hung thành cát:

### Về Tâm lý và Hành vi
*   **Hạn chế đầu tư mạo hiểm:** Tránh dồn toàn bộ vốn liếng vào các phi vụ may rủi trong năm bị xung khắc mạnh.
*   **Giữ tâm thái hòa nhã:** Học cách lắng nghe, tránh tranh cãi thị phi không đáng có để không dẫn đến kiện tụng pháp luật.
*   **Chú ý an toàn đi lại:** Hạn chế lái xe đường dài lúc mệt mỏi, không tham gia các hoạt động thể thao mạo hiểm vào các tháng đại kỵ của năm.

### Về Phong Thủy và Cúng Kiến
*   **Đeo vật phẩm phong thủy hộ mệnh:** Sử dụng trang sức có hình con giáp thuộc nhóm **Tam Hợp** hoặc **Lục Hợp** với tuổi mình để thu hút quý nhân trợ lực, hóa giải xung khắc.
*   **Cúng nghênh đón Thái Tuế:** Đầu năm (thường vào ngày rằm tháng Giêng âm lịch), chuẩn bị mâm lễ chay đơn giản hướng về phía vị trí của chòm sao Thái Tuế để khấn cầu bình an gia đạo.

Hãy mở ngay lá số Tử Vi hạn năm của bạn trên ứng dụng để kiểm tra xem chòm sao Thái Tuế đang nằm ở cung vị nào và nhận bài phân tích giải đoán vận hạn cụ thể!
`
  },
  {
    title: 'Xem Tuổi Kết Hôn: Bối Cảnh Bát Tự Hợp Hôn Và Gia Đạo Hòa Hợp',
    slug: 'xem-tuoi-ket-hon-bat-tu-hop-hon-va-gia-dao-hoa-hop',
    summary: 'Phân tích các yếu tố học thuật quyết định độ hòa hợp giữa hai vợ chồng dựa trên ngũ hành Bát Tự, Cung Phi Bát Trạch và phương pháp hóa giải xung khắc.',
    category: 'marriage',
    tags: ['Hợp Hôn', 'Kết Hôn', 'Vợ Chồng', 'Gia Đạo'],
    thumbnailUrl: '',
    author: 'Chuyên gia Gia Đạo',
    content: `# Xem Tuổi Kết Hôn: Bối Cảnh Bát Tự Hợp Hôn Và Gia Đạo Hòa Hợp

Hôn nhân là sự kiện trọng đại của cuộc đời người. Từ xa xưa, việc xem tuổi trước khi kết hôn đã trở thành nét đẹp văn hóa giúp các cặp đôi thấu hiểu lẫn nhau, chuẩn bị tâm lý vững vàng và tìm kiếm các biện pháp hóa giải nếu tuổi tác có sự xung khắc về mặt khí trường.

Trong bài viết này, chúng ta sẽ tìm hiểu 3 cột trụ học thuật cốt lõi dùng để đo lường mức độ hòa hợp giữa hai phối ngẫu.

---

## 1. Cung Phi Bản Mệnh (Bát Trạch Nhân Duyên)
Đây là phương pháp phổ biến nhất dựa trên năm sinh và giới tính để tính ra cung mệnh bát quái của mỗi người (Càn, Khảm, Cấn, Chấn, Tốn, Ly, Khôn, Đoài). Khi ghép cung của Nam và Nữ với nhau, ta thu được 8 trạng thái khí trường:

*   **Các cung tốt (Cát khí):** 
    *   **Sinh Khí:** Chủ về phát tài, con cái thành đạt, gia đạo hưng vượng.
    *   **Diên Niên (Diên Niên):** Vợ chồng gắn kết bền chặt, tài lộc ổn định dài lâu.
    *   **Thiên Y:** Gia đình khỏe mạnh, ít đau ốm, được quý nhân phò trợ.
    *   **Phục Vị:** Cuộc sống bình yên, vợ chồng hòa thuận, ít sóng gió.
*   **Các cung xấu (Hung khí):**
    *   **Tuyệt Mệnh:** Xung khắc mạnh, dễ gặp chia lìa hoặc gia đạo lục đục.
    *   **Ngũ Quỷ:** Dễ mất mát tiền của, thị phi tranh chấp từ bên ngoài vây hãm.
    *   **Lục Sát:** Vợ chồng hay tranh cãi việc nhỏ nhặt, tình cảm lạnh nhạt dần.
    *   **Họa Hại:** Dễ gặp chuyện rắc rối, mệt mỏi đầu óc.

---

## 2. Ngũ Hành Tương Sinh Tương Khắc (Khí Trường Bản Mệnh)
Ngoài Cung Phi, bản mệnh Ngũ Hành của hai người (Kim, Mộc, Thủy, Hỏa, Thổ) có sự tương tác sâu sắc đến đời sống sinh hoạt hàng ngày:
*   **Tương sinh (Tốt):** Chồng mệnh Thủy - Vợ mệnh Mộc (Thủy sinh Mộc: chồng hỗ trợ đắc lực giúp vợ phát triển công danh), Chồng mệnh Hỏa - Vợ mệnh Thổ (ấm áp nâng đỡ nhau).
*   **Tương khắc (Cần lưu ý):** Chồng mệnh Kim - Vợ mệnh Mộc (Kim khắc Mộc: dễ có sự bất đồng quan điểm sống, chồng hay lấn át ý kiến của vợ).

---

## 3. Tương Tác Thiên Can Địa Chi Bát Tự
Đây là tầng phân tích sâu nhất của học thuật chính tông. Chúng ta không chỉ xem tuổi năm sinh (con giáp) mà xem xét toàn bộ lá số Tứ Trụ của hai vợ chồng:
*   **Địa chi ngày sinh (Cung Phu Thê):** Nếu chi ngày của hai người tương hợp (Ví dụ Tý hợp Sửu, Dần hợp Hợi) $\rightarrow$ Nội tâm thấu hiểu nhau, đời sống tình cảm cực kỳ gắn kết. Nếu xung khắc (Ví dụ Tý Ngọ tương xung) $\rightarrow$ Dễ khắc khẩu, khắc tính.
*   **Bù trừ ngũ hành:** Nếu chồng có lá số quá nhiều Hỏa (nóng nảy, khô hạn) gặp vợ có lá số nhiều Thủy/Kim (mát mẻ, mềm mại) $\rightarrow$ Ngũ hành của người này bổ trợ đắp bù cho người kia, tạo nên sự cân bằng tự nhiên tuyệt vời.

---

## 4. Nguyên Tắc Hóa Giải Xung Khắc Hôn Nhân
Cổ nhân có câu: *"Đức năng thắng số"*. Không có lá số vợ chồng nào hoàn hảo 100% và cũng không có sự xung khắc nào là không thể hóa giải nếu hai bên biết nhường nhịn và áp dụng phong thủy khoa học:

*   **Hóa giải bằng con cái:** Chọn năm sinh con có ngũ hành cầu nối giúp dung hòa xung khắc giữa cha và mẹ. (Ví dụ: Chồng mệnh Mộc, Vợ mệnh Kim xung nhau $\rightarrow$ Sinh con mệnh Thủy để tạo vòng tròn sinh khắc Kim sinh Thủy - Thủy sinh Mộc).
*   **Hóa giải bằng hướng phòng ngủ:** Đặt hướng giường ngủ quay về hướng sinh khí tốt của người chồng hoặc người có bản mệnh yếu hơn để bồi đắp năng lượng ấm áp.
*   **Thấu hiểu tâm lý:** Bát Tự Hợp Hôn chỉ ra điểm xung khắc để hai vợ chồng chủ động kiềm chế cái tôi cá nhân, tôn trọng sự khác biệt của nhau.

Bạn và bạn đời có thể sử dụng phân hệ **Bát Tự Hợp Hôn** trên ứng dụng để nhận ngay bản phân tích đo lường tỷ lệ hòa hợp chi tiết và lời khuyên gia đạo thiết thực nhất!
`
  }
];

const seedBlogPosts = async () => {
  try {
    const count = await BlogPost.countDocuments();
    if (count === 0) {
      logger.info('[BlogSeedService] No blog posts found. Seeding 4 professional Feng Shui articles...');
      await BlogPost.insertMany(SEED_POSTS);
      logger.info('[BlogSeedService] Seeding completed successfully!');
    } else {
      logger.info(`[BlogSeedService] Found ${count} blog posts in database. Seeding skipped.`);
    }
  } catch (error) {
    logger.error('[BlogSeedService] Error seeding blog posts:', error);
  }
};

module.exports = {
  seedBlogPosts
};
