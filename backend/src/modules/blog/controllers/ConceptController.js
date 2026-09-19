const conceptsData = require('../data/concepts.json');

// Dữ liệu fallback khi DB không có hoặc chưa seed
const CONCEPT_FALLBACK = {
    'Phụ Mẫu': {
        term: 'Phụ Mẫu', category: 'Lục Thân',
        short_description: 'Cha mẹ, bề trên, giấy tờ, xe cộ, nhà cửa.',
        full_detail: '▸ Người đại diện: Cha mẹ, ông bà, cô chú bác, thầy cô, cấp trên, chủ nhà.\n▸ Sự vật: Hợp đồng, văn bằng, giấy phép, nhà cửa, xe cộ, quần áo, thức ăn.\n▸ Tốt: Được che chở, được giúp đỡ từ người bề trên, ký được hợp đồng.\n▸ Xấu: Bị kiểm soát, ràng buộc, lo lắng, tốn hao tài sản.\n▸ Chú ý: Phụ Mẫu khắc Tử Tôn, nên hỏi về con cái hay sức khỏe cần tránh Phụ Mẫu quá vượng.'
    },
    'Thê Tài': {
        term: 'Thê Tài', category: 'Lục Thân',
        short_description: 'Vợ/người yêu (nam), tiền bạc, tài sản, hàng hóa.',
        full_detail: '▸ Người đại diện: Vợ hoặc người yêu (với nam giới), nhân viên, người hầu.\n▸ Sự vật: Tiền bạc, tài sản lưu động, hàng hóa, thực phẩm, vật nuôi.\n▸ Tốt: Phát tài, kiếm được tiền, quan hệ tình cảm thuận lợi.\n▸ Xấu: Mất tiền, hao tài, tình cảm trục trặc.\n▸ Chú ý: Thê Tài khắc Phụ Mẫu — hỏi về tiền mà Phụ Mẫu vượng thì khó kiếm tiền.'
    },
    'Huynh Đệ': {
        term: 'Huynh Đệ', category: 'Lục Thân',
        short_description: 'Anh em, bạn bè, đồng nghiệp ngang hàng.',
        full_detail: '▸ Người đại diện: Anh chị em, bạn bè, đồng nghiệp, người cùng trang lứa, đối thủ.\n▸ Sự vật: Tính cạnh tranh, tranh giành, chia sẻ.\n▸ Tốt: Được bạn bè hỗ trợ, có đồng minh, hợp tác thuận lợi.\n▸ Xấu: Bị tranh giành tài sản, bị bạn bè phản bội, thua lỗ vì cạnh tranh.\n▸ Chú ý: Huynh Đệ khắc Thê Tài — Huynh Đệ động thường không lợi về tiền bạc.'
    },
    'Tử Tôn': {
        term: 'Tử Tôn', category: 'Lục Thân',
        short_description: 'Con cái, phúc đức, giải hạn, khắc Quan Quỷ.',
        full_detail: '▸ Người đại diện: Con cái, học trò, người trẻ tuổi hơn, khách hàng.\n▸ Sự vật: Niềm vui, sức khỏe, phúc đức, sự giải thoát, thuốc men.\n▸ Tốt: Có tin vui, con cái bình an, giải được hung, trị được bệnh.\n▸ Xấu: Tử Tôn suy kém → khó có con, phúc mỏng, bệnh khó lành.\n▸ Chú ý: Tử Tôn là Phúc Thần — khắc Quan Quỷ nên dùng khi hỏi bệnh tật, tai ương.'
    },
    'Quan Quỷ': {
        term: 'Quan Quỷ', category: 'Lục Thân',
        short_description: 'Quan chức, công danh, bệnh tật, tai ương. Chồng (nữ).',
        full_detail: '▸ Người đại diện: Quan chức, cấp trên, chồng (với nữ), kẻ thù, ma quỷ.\n▸ Sự vật: Công danh, thi cử, bệnh tật, tai nạn, kiện tụng, áp lực.\n▸ Tốt: Đắc quan, thăng chức, thi đỗ (khi là Dụng thần).\n▸ Xấu: Bệnh tật, tai ương, bị kiện, bị trừng phạt khi là Kỵ thần.\n▸ Chú ý: Hỏi công danh cần Quan Quỷ vượng. Hỏi sức khỏe thì sợ Quan Quỷ.'
    },
    'Thế': {
        term: 'Thế', category: 'Lục Hào',
        short_description: 'Hào Thế đại diện cho bản thân người xem quẻ.',
        full_detail: '▸ Ý nghĩa: Đại diện cho chủ thể — người hỏi, bản thân, phe ta.\n▸ Vượng tướng: Bản thân mạnh, có lợi, sự việc thuận chiều.\n▸ Hưu tù: Bản thân yếu, bất lợi, cần thêm trợ giúp.\n▸ Động: Bản thân chủ động hành động, tình huống đang thay đổi.\n▸ Chú ý: Xem mối quan hệ Thế-Ứng để đánh giá tình thế giữa hai bên.'
    },
    'Ứng': {
        term: 'Ứng', category: 'Lục Hào',
        short_description: 'Hào Ứng đại diện cho đối tượng bên ngoài, người khác.',
        full_detail: '▸ Ý nghĩa: Đại diện cho đối tượng — đối tác, người yêu, đối thủ.\n▸ Thế sinh Ứng: Ta có lợi cho đối phương, bất lợi cho bản thân.\n▸ Ứng sinh Thế: Được đối phương giúp đỡ, thuận lợi.\n▸ Thế khắc Ứng: Ta chiếm ưu thế, có thể đạt mục tiêu.\n▸ Ứng khắc Thế: Đối phương mạnh hơn, bất lợi cho bản thân.'
    },
    'Hào Thế': {
        term: 'Hào Thế', category: 'Lục Hào',
        short_description: 'Hào Thế đại diện cho bản thân người xem quẻ.',
        full_detail: '▸ Ý nghĩa: Đại diện cho chủ thể — người hỏi, bản thân, phe ta.\n▸ Vượng tướng: Bản thân mạnh, có lợi, sự việc thuận chiều.\n▸ Hưu tù: Bản thân yếu, bất lợi, cần thêm trợ giúp.\n▸ Động: Bản thân chủ động hành động, tình huống đang thay đổi.\n▸ Chú ý: Xem mối quan hệ Thế-Ứng để đánh giá tình thế giữa hai bên.'
    },
    'Hào Ứng': {
        term: 'Hào Ứng', category: 'Lục Hào',
        short_description: 'Hào Ứng đại diện cho đối tượng bên ngoài, người khác.',
        full_detail: '▸ Ý nghĩa: Đại diện cho đối tượng — đối tác, người yêu, đối thủ.\n▸ Thế sinh Ứng: Ta có lợi cho đối phương, bất lợi cho bản thân.\n▸ Ứng sinh Thế: Được đối phương giúp đỡ, thuận lợi.\n▸ Thế khắc Ứng: Ta chiếm ưu thế, có thể đạt mục tiêu.\n▸ Ứng khắc Thế: Đối phương mạnh hơn, bất lợi cho bản thân.'
    },
    'Thanh Long': {
        term: 'Thanh Long', category: 'Lục Thú',
        short_description: 'Cát thần. Phú quý, quý nhân, hỷ sự.',
        full_detail: '▸ Bản chất: Cát thần đứng đầu Lục Thú, mang khí Mộc — thuộc phương Đông.\n▸ Tốt lành: Phú quý, may mắn, được quý nhân giúp đỡ, hỷ sự (cưới hỏi, sinh nở).\n▸ Tiền tài: Thanh Long lâm Thê Tài → tài lộc dồi dào.\n▸ Quan lộc: Thanh Long lâm Quan Quỷ → thăng quan tiến chức.\n▸ Xấu (bị khắc/tù): Niềm vui chưa đến, quý nhân không giúp được.'
    },
    'Chu Tước': {
        term: 'Chu Tước', category: 'Lục Thú',
        short_description: 'Văn thư, tin tức, kiện tụng, miệng lưỡi.',
        full_detail: '▸ Bản chất: Thuộc Hỏa — phương Nam. Chủ về ngôn ngữ, thông tin, giấy tờ.\n▸ Tốt: Tin tức đến nhanh, văn thư thuận lợi, hợp đồng ký được.\n▸ Xấu: Kiện tụng, thị phi, tranh cãi, bị nói xấu, thông tin sai lệch.\n▸ Chú ý: Chu Tước động thường có tin tức, thư từ hoặc lời nói gây sự.'
    },
    'Câu Trần': {
        term: 'Câu Trần', category: 'Lục Thú',
        short_description: 'Trì hoãn, đất đai, tranh chấp, ách tắc.',
        full_detail: '▸ Bản chất: Thuộc Thổ — trung ương. Chủ về sự trì trệ, đình trệ.\n▸ Đất đai: Câu Trần liên quan nhiều đến tranh chấp đất đai, bất động sản.\n▸ Tốt: Câu Trần lâm Thê Tài → đất đai, bất động sản có lợi.\n▸ Xấu: Việc bị cản trở, trì hoãn, ách tắc, bị giam cầm, bị giữ lại.'
    },
    'Đằng Xà': {
        term: 'Đằng Xà', category: 'Lục Thú',
        short_description: 'Lo âu, hư ảo, quái lạ, mộng mị.',
        full_detail: '▸ Bản chất: Thuộc Hỏa — kỳ dị, hư ảo, không thực. Tượng rồng bay.\n▸ Lo âu: Đằng Xà chủ sự hoảng hốt, lo lắng vô cớ, ảo giác.\n▸ Mộng: Hỏi về mộng mị, điềm báo thường liên quan Đằng Xà.\n▸ Xấu: Sự việc hư ảo, không thực, bị lừa dối, gặp điều kỳ quái.\n▸ Chú ý: Đằng Xà lâm Quan Quỷ → bệnh khó chữa, tai ương bất ngờ.'
    },
    'Bạch Hổ': {
        term: 'Bạch Hổ', category: 'Lục Thú',
        short_description: 'Hung thần. Tai nạn, phẫu thuật, tang ma, máu.',
        full_detail: '▸ Bản chất: Thuộc Kim — phương Tây. Hung thần mạnh nhất trong Lục Thú.\n▸ Hung hiểm: Tai nạn, đổ máu, phẫu thuật, tang ma, chiến tranh.\n▸ Bạch Hổ lâm Quan Quỷ: Bệnh nặng, phẫu thuật, nguy hiểm tính mạng.\n▸ Bạch Hổ lâm Phụ Mẫu: Cha mẹ bệnh, nhà cửa có chuyện không lành.\n▸ Tốt (hiếm): Trong võ quan, quân sự — Bạch Hổ có thể là điềm thắng trận.'
    },
    'Huyền Vũ': {
        term: 'Huyền Vũ', category: 'Lục Thú',
        short_description: 'Trộm cắp, gian dối, mờ ám, tình ái kín đáo.',
        full_detail: '▸ Bản chất: Thuộc Thủy — phương Bắc. Chủ về điều tối tăm, bí ẩn.\n▸ Gian lận: Trộm cắp, lừa đảo, giấu giếm, thủ đoạn ngầm.\n▸ Tình ái: Huyền Vũ lâm Thê Tài (hoặc Quan Quỷ) → ngoại tình, tình ái bí mật.\n▸ Xấu: Bị lừa, mất đồ, sự việc không minh bạch, bị phản bội sau lưng.\n▸ Tốt (hiếm): Trong gián điệp, điều tra — Huyền Vũ có thể là bí mật có lợi.'
    },
    'Kiếp Sát': {
        term: 'Kiếp Sát', category: 'Thần Sát Bát Tự',
        short_description: 'Sát tinh uy quyền & biến động. Khí thế mãnh liệt, chủ về quyền uy thao lược hoặc tranh chấp rủi ro.',
        full_detail: '▸ Bản chất: Một trong Tứ Đại Hung Sát, mang khí sát phạt quyết liệt và biến động đột ngột.\n▸ Ý nghĩa hung: Gặp Kỵ thần dễ phát sinh tranh chấp tài sản, họa hình thương dao kéo, thị phi hoặc hao tổn bất ngờ.\n▸ Ý nghĩa cát: Đắc Cát thần hoặc Dụng thần nâng đỡ thì hóa Sát vi Quyền, tính cách quả cảm dũng mãnh, túc trí đa mưu, đạt quyền uy lãnh đạo lớn trong quân sự, tư pháp, y khoa phẫu thuật hoặc thương trường quyết liệt.\n▸ Lời khuyên: Giữ tâm chính trực, hành sự thận trọng tuân thủ pháp luật, kiểm soát tính khí nóng nảy bốc đồng.'
    },
    'Hoa Cái': {
        term: 'Hoa Cái', category: 'Thần Sát Bát Tự',
        short_description: 'Lọng che nghệ thuật. Tư duy triết học, tài hoa xuất chúng.',
        full_detail: '▸ Loại tinh: Nghệ thuật & Tâm linh.\n▸ Ý nghĩa: Tư duy sâu sắc uyên bác, đam mê nghệ thuật tôn giáo, trí tuệ vượt trội, phong thái thanh cao thoát tục.'
    },
    'Thiên Tài': {
        term: 'Thiên Tài', category: 'Thập Thần',
        short_description: 'Thần bị Nhật Chủ khắc nhưng cùng âm dương. Tài sản ngoài luồng, cơ hội đầu tư kinh doanh.',
        full_detail: '▸ Bản chất: Thập Thần do Nhật Chủ khắc (đồng tính âm dương), đại diện cho của cải động, tài lộc phi chính ngạch.\n▸ Hình tượng: Nguồn lợi đầu tư bất ngờ, cổ phiếu, bất động sản, tài hoa buôn bán nhạy bén.\n▸ Đại diện: Tài sản lưu động, kinh doanh thương mại, người cha (phụ thân), nhân duyên tình ái (nam giới).\n▸ Tốt: Nắm bắt thời cơ làm giàu xuất chúng, hào sảng rộng lượng, giao thiệp rộng khắp, dễ đạt đại phú đại quý.\n▸ Xấu: Tiêu xài hoang phí, thiếu tích lũy bền vững; thân nhược tài vượng dễ tham tài rước họa, vướng nợ nần hoặc đào hoa rắc rối.\n▸ Tính cách: Phóng khoáng, nhạy bén, nhiệt tình, trọng nghĩa khinh tài, thích sự mạo hiểm và đột phá.'
    },
    'Thất Sát': {
        term: 'Thất Sát', category: 'Thập Thần',
        short_description: 'Thần khắc Nhật Chủ và cùng âm dương (còn gọi là Thiên Quan). Uy quyền mãnh liệt, tài thao lược.',
        full_detail: '▸ Hình tượng: Uy quyền dũng tướng, ngọn lửa thử thách bản lĩnh phi thường.\n▸ Đại diện: Quyền lực tuyệt đối, tài thao lược biến nguy thành an, sự nghiệp đột phá, người tình/chồng cá tính (nữ giới).\n▸ Tốt: Hóa Sát vi Quyền, lập đại công nghiệp, thăng tiến thần tốc trong môi trường cạnh tranh khốc liệt hoặc binh nghiệp, tư pháp.\n▸ Xấu: Tính tình nóng nảy, dễ gặp tai ương họa nạn, thị phi kiện tụng hoặc xung đột thương tích nếu không có chế hóa.\n▸ Tính cách: Quả cảm, kiên cường, dũng khí ngút trời, quyết đoán dứt khoát, dám nghĩ dám làm.'
    },
    'Chính Tài': {
        term: 'Chính Tài', category: 'Thập Thần',
        short_description: 'Thần bị Nhật Chủ khắc nhưng khác âm dương.',
        full_detail: '▸ Hình tượng: Lương bổng ổn định, tài sản tích lũy chính đáng.\n▸ Đại diện: Thu nhập từ sức lao động, người vợ chính thức (nam giới).\n▸ Tốt: Tài lộc bền vững, gia đình êm ấm hạnh phúc, được tín nhiệm.\n▸ Xấu: Quá thực dụng, keo kiệt chi li, thiếu chí khí mạo hiểm lớn.\n▸ Tính cách: Chăm chỉ, tiết kiệm, thực tế, coi trọng kỷ luật gia đình.'
    },
    'Chính Quan': {
        term: 'Chính Quan', category: 'Thập Thần',
        short_description: 'Thần khắc Nhật Chủ nhưng khác âm dương.',
        full_detail: '▸ Hình tượng: Vị quan tòa chính trực, người chồng danh chính ngôn thuận.\n▸ Đại diện: Địa vị danh vọng, uy tín xã hội, kỷ luật tự giác, người chồng (nữ).\n▸ Tốt: Thăng quan tiến chức bền vững, sống chuẩn mực được người tôn kính.\n▸ Xấu: Bảo thủ, cứng nhắc theo lối mòn, sợ thay đổi đột phá lớn.\n▸ Tính cách: Chính trực, đáng tin cậy, tôn trọng trật tự và quy củ.'
    },
    'Thiên Ấn': {
        term: 'Thiên Ấn', category: 'Thập Thần',
        short_description: 'Thần sinh Nhật Chủ và cùng âm dương (còn gọi là Kiêu Thần).',
        full_detail: '▸ Hình tượng: Người mẹ kế, người thầy truyền dạy kỹ nghệ độc môn.\n▸ Đại diện: Bằng cấp chuyên môn sâu, trực giác nhạy bén, y học huyền học.\n▸ Tốt: Trí tuệ xuất chúng lập dị, trực giác tâm linh nhạy, giỏi kỹ nghệ.\n▸ Xấu: Cô độc lẻ loi, dễ bỏ dở giữa chừng, khắc Thập thần tốt (khắc Thực).\n▸ Tính cách: Hướng nội, sắc sảo nhạy cảm, thích nghiên cứu sâu lập dị.'
    },
    'Chính Ấn': {
        term: 'Chính Ấn', category: 'Thập Thần',
        short_description: 'Thần sinh Nhật Chủ nhưng khác âm dương.',
        full_detail: '▸ Hình tượng: Người mẹ hiền từ che chở, ấn tín quyền lực tối thượng.\n▸ Đại diện: Mẹ đẻ, sự bảo bọc che chở, học vấn khoa bảng, đạo đức.\n▸ Tốt: Gặp nhiều quý nhân giúp đỡ, thi cử đỗ đạt, cuộc đời an lành.\n▸ Xấu: Thiếu chủ động chịu trách nhiệm, ỷ lại vào sự giúp đỡ nâng đỡ.\n▸ Tính cách: Ôn hòa, từ bi bác ái, hiếu học, sống trọng tình cảm danh dự.'
    },
    'Thực Thần': {
        term: 'Thực Thần', category: 'Thập Thần',
        short_description: 'Thần được Nhật Chủ sinh ra và cùng âm dương.',
        full_detail: '▸ Hình tượng: Vị phúc thần hiền hòa, người đầu bếp tài hoa, nghệ sĩ nhàn nhã.\n▸ Đại diện: Con cái (nữ), phúc thọ, năng khiếu nghệ thuật ẩm thực, tài lộc tự nhiên.\n▸ Tốt: Cuộc sống an nhàn, hóa giải tai ương rất mạnh, tài lộc dồi dào.\n▸ Xấu: Quá nhiều Thực Thần biến thành Thương Quan, gây lười biếng.\n▸ Tính cách: Ôn hòa, rộng lượng, thích tự do tự tại, chuộng hưởng thụ.'
    },
    'Thương Quan': {
        term: 'Thương Quan', category: 'Thập Thần',
        short_description: 'Thần được Nhật Chủ sinh ra nhưng khác âm dương.',
        full_detail: '▸ Hình tượng: Nhà cách mạng nổi loạn, thiên tài sáng tạo phá cách.\n▸ Đại diện: Con cái (nữ), trí tuệ vượt bậc, ngôn từ sắc bén, chống đối quan quyền.\n▸ Tốt: Cực kỳ thông minh, sáng tạo đột phá, giỏi kinh doanh và nghệ thuật.\n▸ Xấu: Khắc Quan hại chồng (nữ), dễ gây thị phi, kiêu ngạo tự phụ.\n▸ Tính cách: Cá tính mạnh mẽ, thích tự do, nhạy bén nhưng hay ngạo mạn.'
    },
    'Tỷ Kiên': {
        term: 'Tỷ Kiên', category: 'Thập Thần',
        short_description: 'Thần đồng hành cùng ngũ hành và cùng âm dương với Nhật Chủ.',
        full_detail: '▸ Hình tượng: Người anh em sinh đôi, hình bóng của chính bản thân.\n▸ Đại diện: Anh em đồng giới, bạn bè, tính tự lập, ý chí tự cường.\n▸ Tốt: Giúp bản thân mạnh mẽ chịu đựng khó khăn, tự lập nghiệp tốt.\n▸ Xấu: Quá vượng sẽ khắc Thê Tài (hao tài, lận đận tình cảm), cô độc.\n▸ Tính cách: Kiên định, độc lập, tự trọng rất cao, ghét dựa dẫm.'
    },
    'Kiếp Tài': {
        term: 'Kiếp Tài', category: 'Thập Thần',
        short_description: 'Thần đồng hành cùng ngũ hành nhưng khác âm dương với Nhật Chủ.',
        full_detail: '▸ Hình tượng: Đối thủ tranh giành trực diện, sự cướp đoạt tài sản.\n▸ Đại diện: Anh em khác giới, bạn bè cạnh tranh, sự hao tài đột ngột.\n▸ Tốt: Thích mạo hiểm, hào sảng phóng khoáng, giỏi giao thiệp rộng.\n▸ Xấu: Khắc cực mạnh Thê Tài, dễ gây tán tài, bất hòa trong hôn nhân.\n▸ Tính cách: Nhiệt tình bên ngoài, lạnh lùng bên trong, thích chinh phục.'
    }
};

class ConceptController {
    static async getConcept(req, res) {
        try {
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            const { term } = req.params;
            const fallback = CONCEPT_FALLBACK[term];
            const row = conceptsData.find(c => c.term === term);
            if (row) {
                const result = { ...row };
                if (result.short && !result.short_description) {
                    result.short_description = result.short;
                }
                // Nếu JSON thiếu full_detail, bổ sung từ fallback
                if (!result.full_detail && fallback) {
                    result.full_detail = fallback.full_detail;
                }
                if (!result.short_description && fallback) {
                    result.short_description = fallback.short_description;
                }
                return res.json(result);
            }
            if (fallback) {
                return res.json(fallback);
            }
            return res.status(404).json({ error: 'Not found' });
        } catch (error) {
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = ConceptController;
