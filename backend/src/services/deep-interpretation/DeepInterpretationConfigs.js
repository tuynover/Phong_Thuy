/**
 * DeepInterpretationConfigs.js
 * Quản lý tri thức học thuật, định nghĩa Replicas và Prompts cho các bộ môn (Bát Tự, Tử Vi, Hợp Hôn, Kinh Dịch)
 */

// =========================================================================
// 1. CẤU HÌNH BÁT TỰ CHUYÊN SÂU (BAZI VIP CONFIG)
// =========================================================================
const BAZI_VIP_CONFIG = {
  REPLICAS: [
    {
      id: 1,
      title: 'Sự Nghiệp & Công Danh',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'Năng lực cốt lõi và thiên hướng nghề nghiệp vượt trội (ánh xạ kinh tế tri thức)',
        'Định vị vai trò: Lãnh đạo độc lập hay Chuyên gia cố vấn/quản trị cấp cao',
        'Môi trường làm việc, phong cách cộng sự và văn hóa tương hỗ',
        'Rào cản sự nghiệp và cạm bẫy thương trường (chỉ luận yếu tố thực tế có trong mệnh)',
        'Thời điểm vàng bứt phá danh vọng và thành tựu đỉnh cao'
      ]
    },
    {
      id: 2,
      title: 'Tài Chính & Dòng Tiền',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY_2',
      subtopics: [
        'Chính Tài vs Thiên Tài: Nguồn thu chủ lực và bản chất dòng tiền',
        'Khả năng tích lũy và chiến lược bảo toàn của cải (Mộ Khố nếu có, hoặc chuyển hóa tài sản cứng)',
        'Cảnh báo rủi ro dòng tiền và cạm bẫy tài chính (chỉ luận nguy cơ thực tế, không nhắc yếu tố vắng mặt)',
        'Phong cách đòn bẩy tài chính và quản trị rủi ro tối ưu',
        'Bảng niên biểu các năm vượng tài đắc lộc trong cuộc đời'
      ]
    },
    {
      id: 3,
      title: 'Hôn Nhân & Gia Đạo',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Mô hình nhân duyên chủ đạo và xu hướng gắn kết tình cảm',
        'Chân dung, tính cách và ngũ hành bổ khuyết của người bạn đời tương hợp',
        'Vùng nhạy cảm tình cảm và nghệ thuật hóa giải xung đột (dựa trên Cung Phối Ngẫu)',
        'Đường con cái (Tử tức) và phúc trạch gia đạo nhiều thế hệ',
        'Bí quyết gìn giữ hòa khí và phong thủy không gian tổ ấm'
      ]
    },
    {
      id: 4,
      title: 'Sức Khỏe & Tạng Phủ',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Cân bằng Ngũ hành và trạng thái 5 tạng phủ theo lý luận Đông Y',
        'Nhận diện tạng phủ suy yếu tương đối và nguy cơ bệnh lý cần phòng ngừa từ sớm',
        'Vận hạn thể chất đặc biệt (chỉ luận hạn mổ xẻ/huyết quang nếu có hung sát thực tế)',
        'Đồng hồ sinh học, giờ giấc sinh hoạt và nhịp điệu tái tạo năng lượng',
        'Phác đồ dưỡng sinh Đông Y: Thực phẩm, thói quen và vận động thuận Dụng Thần'
      ]
    },
    {
      id: 5,
      title: 'Phong Thủy & Cải Vận',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Định hình Persona phong cách sống kích hoạt vận may theo độ tuổi',
        'Phương vị, hướng nhà, hướng làm việc và màu sắc bổ khuyết Dụng Thần',
        'Vật phẩm trợ mệnh, chất liệu trang phục và tần số năng lượng tương sinh',
        'Mạng lưới Quý Nhân phù trợ và phương vị kết nối cát lành',
        'Cải mệnh từ gốc: Rèn luyện tâm tính, kiểm soát cảm xúc và tích phúc hành thiện'
      ]
    },
    {
      id: 6,
      title: 'Mốc Đại Vận 100 Năm',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Bảng ma trận chu kỳ 10 năm từng bước Đại Vận suốt cuộc đời',
        '10 năm hoàng kim rực rỡ nhất để dốc sức kiến tạo đại nghiệp',
        'Các bước ngoặt vận hạn cần thu mình phòng thủ (chỉ cảnh báo xung khắc nếu có thực tế)',
        'Lộ trình chiến lược: Năm nào nên tấn công mở rộng, năm nào nên tích lũy nội lực',
        'Kim chỉ nam nhân sinh và bài học giác ngộ cuộc đời'
      ]
    }
  ],

  getChapterSpecificInstructions(chapterId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 1 (SỰ NGHIỆP & CÔNG DANH):
- ĐỊNH HƯỚNG CỐT LÕI: Phân tích sâu sắc năng lực vượt trội và vị thế nghề nghiệp MŨI NHỌN trong kỷ nguyên số (AI, Dữ liệu, Quản trị rủi ro tài chính, Tư vấn chiến lược, Công nghệ cao). Tránh đưa ra các định hướng chung chung nước đôi kiểu "làm gì cũng được".
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + CẤM lấn sân sang chuyện hôn nhân, gia đạo hay tiền bạc đầu tư (đã có chương riêng).
  + CẤM lặp lại điệp khúc "tính nóng nảy do Dần - Thân xung" (để dành việc này cho Chương 3).
- THẬP THẦN & QUY TẮC HIỆN HỮU:
  + Chỉ luận các Thập Thần CÓ MẶT THỰC TẾ trong nguyên cục (Thất Sát Giáp Mộc, Thực Thần Canh Kim, Thiên Ấn Bính Hỏa...).
  + TUYỆT ĐỐI CẤM viết "được sinh bởi Chính Ấn" nếu nguyên cục KHÔNG CÓ Đinh Hỏa (Chính Ấn). Chỉ được luận Thiên Ấn (Bính Hỏa).
- THẦN SÁT SỰ NGHIỆP: CHỈ LUẬN GIẢI các Thần Sát CÓ MẶT THỰC TẾ (như Văn Xương, Học Đường...). Sao nào không có thì BIẾN MẤT HOÀN TOÀN.`,

      2: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 2 (TÀI CHÍNH & DÒNG TIỀN):
- ĐI THẲNG TRỌNG TÂM THỰC CHIẾN: Nguồn thu Chính Tài vs Thiên Tài, cơ chế tích lũy qua Kho Tài, và giải pháp dòng tiền.
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + CẤM lặp lại chuyện định hướng nghề nghiệp của Chương 1.
  + CẤM nhai lại điệp khúc "nóng giận do Dần - Thân xung" của Chương 3.
- TÍCH LŨY QUA KHO TÀI (TÀI KHỐ) - TUÂN THỦ 100% DỮ LIỆU ĐÃ TÍNH TOÁN:
  + BẮT BUỘC kiểm tra khối dữ liệu "--- ĐỊNH DANH MỘ KHỐ & KHO TÀI (TÀI KHỐ) ---" được cung cấp.
  + NẾU ĐÃ XÁC ĐỊNH CÓ KHO TÀI (Ví dụ: Trụ Giờ tọa Chi Thìn là Thủy Khố = KHO TÀI của Mậu Thổ): BẮT BUỘC LUẬN GIẢI khả năng tích lũy ngầm qua Kho Tài này, tàng ẩn Chính Tài; giải thích hiện trạng kho đang đóng trong nguyên cục và khi gặp Đại Vận hoặc Lưu Niên đối xung (như Tuất xung Thìn) sẽ mở kho, tạo đột phá tài sản.
  + TUYỆT ĐỐI CẤM PHÁN ẨU "Lá số không có Thìn, Tuất, Sửu, Mùi" hoặc "Không có Mộ Khố đóng vai trò kho tài"!
  + Chỉ khi nào dữ liệu ghi rõ "KHÔNG CÓ KHO TÀI" thì mới được luận giải theo hướng dòng tiền luân chuyển không kho.
- CẢNH BÁO RỦI RO DÒNG TIỀN: Phân tích rủi ro chi tiêu cảm xúc, biến động thị trường. CẤM nhắc từ "Kiếp Tài" nếu lá số không có Kiếp Tài.
- PHONG CÁCH ĐÒN BẨY & BẢNG NIÊN BIỂU ĐẮC TÀI: Đưa ra bảng Markdown các năm kích hoạt tài lộc sắc bén.`,

      3: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 3 (HÔN NHÂN & GIA ĐẠO):
- ĐỊA BÀN CHỦ LỰC CỦA CUNG PHỐI NGẪU & TƯƠNG TÁC ĐỊA CHI:
  + Đây là ĐỊA BÀN DUY NHẤT để phân tích sâu sắc tác động của Cung Phối Ngẫu (Chi Ngày) và tương tác Lục Xung giữa Chi Ngày với Chi Tháng (như Dần - Thân Lục Xung).
  + Luận giải chân thực mâu thuẫn nội tâm giữa khát vọng tự do và nhu cầu gắn kết, cách kiểm soát cảm xúc và chuyển hóa xung đột thành hòa khí.
- THẦN SÁT TÌNH CẢM & GIA ĐẠO:
  + Chỉ luận các Thần Sát thực tế có trong bảng Thần Sát (Âm Dương Sai Thác, Hồng Diễm, Hoa Cái, Thái Cực...).
  + TUYỆT ĐỐI CẤM SỬ DỤNG CÁC SAO NGOẠI LAI CỦA TỬ VI ĐẨU SỐ: Tuyệt đối CẤM nhắc đến sao "Đà La", "Kình Dương", "Địa Không", "Địa Kiếp", "Hóa Kỵ"... Bát Tự KHÔNG CÓ các sao này!
- TỬ TỨC: Luận giải Trụ Giờ về đường con cái dựa trên Thập Thần và Thần Sát hiện diện thực tế.`,

      4: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 4 (SỨC KHỎE & TẠNG PHỦ):
- DƯỠNG SINH ĐÔNG Y THỰC CHIẾN (HOÀNG ĐẾ NỘI KINH):
  Quy chiếu ngũ hành thái quá hoặc bất cập sang 5 tạng (Can Mộc, Tâm Hỏa, Tỳ Thổ, Phế Kim, Thận Thủy).
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + Tập trung 100% vào thể chất, tạng phủ và nhịp sinh học.
  + CẤM nhắc lại chuyện sự nghiệp công danh, tiền bạc hay hôn nhân.
  + CẤM nhai lại điệp khúc "năm 2026-2027" một cách sáo rỗng ngoài khía cạnh lưu niên khí hậu ảnh hưởng đến tạng phủ.
- VẬN HẠN THỂ CHẤT: Chỉ cảnh báo huyết quang/phẫu thuật nếu có hung sát thực tế (Huyết Nhận, Lục Xung). Tuyệt đối CẤM dọa nạt ung u bướu hay bệnh hiểm nghèo!`,

      5: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 5 (PHONG THỦY & CẢI VẬN):
- CHIẾN LƯỢC CẢI VẬN DỰA TRÊN DỤNG THẦN & HỶ THẦN:
  + Không gian sống, phương vị làm việc (hướng nhà, hướng bàn làm việc).
  + Màu sắc, chất liệu trang phục, vật phẩm trợ mệnh thuận Dụng Thần.
  + Mạng lưới Quý Nhân kết nối cát lành.
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + Đi thẳng vào các giải pháp hành động phong thủy cụ thể. CẤM lặp lại các phân tích tính cách tiêu cực ở các chương trước.`,

      6: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 6 (MỐC ĐẠI VẬN 100 NĂM):
- BẢN ĐỒ THỜI GIAN 100 NĂM ĐỜI NGƯỜI:
  Phân tích từng bước Đại Vận 10 năm từ tiền vận đến hậu vận.
- BẢNG MA TRẬN ĐẠI VẬN BẮT BUỘC:
  | Giai Đoạn / Độ Tuổi | Can Chi Đại Vận | Khí Thế & Tương Tác Học Thuật | Đánh Giá Cát / Hung | Chiến Lược Tiến Thủ / Phòng Thủ |
- KỶ LUẬT HỌC THUẬT NGHIÊM NGẶT VỀ THẬP THẦN ĐẠI VẬN:
  + BẮT BUỘC phân tích đúng Can Chi của từng bước Đại Vận và Thập Thần tương ứng với Nhật Chủ.
  + TUYỆT ĐỐI CẤM COPY-PASTE nhãn "Thiên Tài (Nhâm Thủy)" cho tất cả các đại vận! Phải chỉ rõ: Đại vận can gì, chi gì, mang khí của Thập thần nào (Ấn, Quan, Sát, Tài, Thương, Thực, hay Tỷ Kiếp).
- 10 NĂM HOÀNG KIM & BƯỚC NGOẶT: Chỉ rõ đại vận đắc dụng thần rực rỡ nhất để dốc sức kiến tạo đại nghiệp.`
    };

    return INSTRUCTIONS[chapterId] || '';
  },

  getOpenRouterModelForChapter(chapterId) {
    const DEFAULT_MAP = {
      1: process.env.OPENROUTER_MODEL_CH1 || 'qwen/qwen-plus',
      2: process.env.OPENROUTER_MODEL_CH2 || 'qwen/qwen-plus',
      3: process.env.OPENROUTER_MODEL_CH3 || 'gemini-direct',
      4: process.env.OPENROUTER_MODEL_CH4 || 'gemini-direct',
      5: process.env.OPENROUTER_MODEL_CH5 || 'gemini-direct',
      6: process.env.OPENROUTER_MODEL_CH6 || 'gemini-direct'
    };
    return DEFAULT_MAP[chapterId] || 'qwen/qwen-plus';
  }
};

// =========================================================================
// 2. CẤU HÌNH TỬ VI CHUYÊN SÂU (ZIWEI VIP CONFIG)
// =========================================================================
const ZIWEI_VIP_CONFIG = {
  REPLICAS: [
    {
      id: 1,
      title: 'Mệnh - Thân - Phúc Đức (Cốt Cách & Bài Học Nghiệp Duyên)',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'Cung Mệnh: Cốt cách tinh đẩu tọa thủ, ngũ hành bản mệnh, diện mạo, tư chất và thiên phú trời sinh',
        'Cung Thân: Vị trí cư ngụ của Thân (Thân cư Mệnh, Tài, Quan, Thiên Di hay Phúc), chiều hướng chuyển hóa nhân sinh quan từ trung niên',
        'Cung Phúc Đức: Phúc trạch dòng tộc gia tiên, thế giới nội tâm tinh thần, bài học nghiệp duyên (Karmic Lesson) và sứ mệnh tâm thức',
        'Cát hung hội tụ: Tương tác tam hợp Mệnh - Tài - Quan đối kháng/cộng hưởng với hung sát tinh tại Mệnh Thân Phúc',
        'Khung chuyển hóa cốt cách: Điểm tựa tâm thức để chuyển hóa hung sát thành động lực vươn lên'
      ]
    },
    {
      id: 2,
      title: 'Quan Lộc - Tài Bạch - Điền Trạch (Công Danh, Tài Lộc & Sản Nghiệp)',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY_2',
      subtopics: [
        'Cung Quan Lộc: Khả năng nắm giữ chức quyền, tư chất làm chủ (khởi nghiệp) hay làm tướng (quản trị), định hướng ngành nghề mũi nhọn',
        'Cung Tài Bạch: Nguồn thu chủ lực (chính tài bền vững hay hoạnh tài đột biến), khả năng quản trị dòng tiền và tích lũy',
        'Cung Điền Trạch: Cơ duyên đất đai, nhà cửa, sản nghiệp thừa kế hoặc tự tay gây dựng; phong thủy nơi chốn cư ngụ',
        'Cảnh báo rủi ro hao tài: Cạm bẫy thương trường từ Hóa Kỵ, Không Kiếp, Kình Đà hội chiếu tam giác sự nghiệp - tài sản',
        'Bảng lộ trình thời điểm vàng kiến tạo danh vọng và đột phá tài sản'
      ]
    },
    {
      id: 3,
      title: 'Phu Thê - Tử Tức (Hôn Nhân, Bạn Đời & Hậu Duệ)',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Cung Phu Thê: Khí chất, tính cách, gia thế người bạn đời; các tinh đẩu chủ quản và ngũ hành bổ trợ',
        'Duyên nợ và xung đột hôn nhân: Các thời điểm biến động tình cảm lớn, cạm bẫy đào hoa sát hoặc hình khắc',
        'Nghệ thuật gìn giữ hòa khí: Giải pháp dung hòa cái tôi, hóa giải thế bất đối xứng tình cảm',
        'Cung Tử Tức: Cơ duyên đường con cái, xu hướng tính cách, tài năng và sự hiếu nghĩa của thế hệ sau',
        'Phúc trạch gia đạo: Mối liên kết giữa con cái với vận khí chung của gia đình'
      ]
    },
    {
      id: 4,
      title: 'Tật Ách - Thiên Di (Sức Khỏe Tạng Phủ & Xuất Ngoại Giao Tế)',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Cung Tật Ách: Cân bằng tạng phủ theo ngũ hành tinh đẩu (Kim - Phế, Mộc - Can, Thủy - Thận, Hỏa - Tâm, Thổ - Tỳ)',
        'Nguy cơ tai ương tiềm ẩn: Cảnh báo huyết quang, tai nạn hoặc bệnh lý mãn tính cần phòng bị từ sớm',
        'Phác đồ dưỡng sinh Đông Y: Thói quen sinh hoạt, chế độ dinh dưỡng và giờ giấc tái tạo năng lượng',
        'Cung Thiên Di: Cơ hội xuất ngoại, làm ăn phương xa, vận may giao tế và cách nhìn nhận của xã hội',
        'Thế đối lập Mệnh - Di: Bài học thích nghi khi rời xa vùng an toàn để khai mở chân trời mới'
      ]
    },
    {
      id: 5,
      title: 'Nô Bộc - Phụ Mẫu - Huynh Đệ (Bằng Hữu, Quý Nhân & Dòng Tộc)',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Cung Nô Bộc: Mạng lưới bằng hữu, đồng sự cấp dưới, đối tác làm ăn; tiêu chí nhận diện bạn hiền vs kẻ trắc trở',
        'Chiến lược dụng nhân: Mẫu người nên kết giao, nghệ thuật quản trị nhân sự thuận sao tọa thủ',
        'Cung Phụ Mẫu: Mối liên kết tình cảm, học vấn, phúc ấm và bài học đạo hiếu đối với song thân',
        'Cung Huynh Đệ: Tình cảm anh chị em trong nhà, khả năng chung vốn làm ăn hay nên giữ độc lập tài chính',
        'Quý Nhân phù trợ: Nhận diện các tinh đẩu trợ mệnh (Khôi Việt, Tả Hữu, Quang Quý) trong mạng lưới quan hệ'
      ]
    }
  ],

  getClusterSpecificInstructions(clusterId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 1 (MỆNH - THÂN - PHÚC ĐỨC):
- Đi sâu vào căn cơ gốc rễ: Bản tính, cốt cách, khí chất tự nhiên của Mệnh.
- Phân tích vị trí Cung Thân: Thân cư cung nào, cách thức đương số tương tác với cuộc đời khi bước sang giai đoạn hậu vận.
- Phúc Đức là điểm tựa tâm linh: Phân tích nghiệp duyên, phúc ấm tổ tiên và bài học tinh thần cần tu dưỡng.
- Tuyệt đối không phán bế tắc, luôn đưa ra giải pháp nâng cao tần số tâm thức.`,

      2: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 2 (QUAN LỘC - TÀI BẠCH - ĐIỀN TRẠCH):
- Trụ cột sự nghiệp & tài sản: Đánh giá thực chất năng lực quản trị, kinh doanh và kiến tạo của cải.
- Phân định rõ: Kiếm tiền bằng chuyên môn (Quan) hay bằng đầu tư tích sản (Tài/Điền).
- Đưa ra bảng Markdown thời điểm vàng và các lưu ý rủi ro hao tài cụ thể.`,

      3: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 3 (PHU THÊ - TỬ TỨC):
- Luận giải nhân duyên: Chân dung người bạn đời, mức độ tương thích về tinh thần và thực tế cuộc sống.
- Giải pháp hóa giải mâu thuẫn gia đạo: Không dùng ngôn từ gây hoang mang chia ly, tập trung vào cách thấu hiểu và sẻ chia.
- Con cái: Dự báo xu hướng phát triển và bài học nuôi dạy con cái thuận theo thiên tính.`,

      4: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 4 (TẬT ÁCH - THIÊN DI):
- Đông Y tạng phủ: Ánh xạ ngũ hành các sao tại Tật Ách sang ngũ tạng.
- Thiên Di: Năng lực xã giao, cơ hội đi xa, xuất ngoại và xây dựng uy tín ngoài xã hội.
- Tuyệt đối cấm phán xét ngày tận số hay bệnh nan y không cứu vãn; luôn đi kèm chế độ dưỡng sinh phòng bệnh.`,

      5: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 5 (NÔ BỘC - PHỤ MẪU - HUYNH ĐỆ):
- Các mối quan hệ ngoại vi: Đánh giá bằng hữu, người giúp việc, anh em dòng tộc.
- Cảnh báo cạm bẫy tiểu nhân (nếu có hung tinh) và cách chiêu cảm quý nhân tương trợ.`
    };
    return INSTRUCTIONS[clusterId] || '';
  }
};

// =========================================================================
// 3. CẤU HÌNH HỢP HÔN CHUYÊN SÂU (MARRIAGE VIP CONFIG)
// =========================================================================
const MARRIAGE_VIP_CONFIG = {
  PILLARS: [
    {
      id: 1,
      title: 'Cốt Cách & Tâm Lý Hai Bản Thể',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'So sánh Nhật Chủ, ngũ hành bản mệnh và bản chất khí chất của Chồng vs Vợ',
        'Nhu cầu cảm xúc nội tâm và phong cách giao tiếp vợ chồng',
        'Vùng nhạy cảm tâm lý dễ kích hoạt xung đột và điểm mù nhận thức',
        'Điểm tương đồng gắn kết và các khác biệt cần học cách chấp nhận',
        'Nghệ thuật lắng nghe và thấu hiểu để hòa hợp hai cái tôi'
      ]
    },
    {
      id: 2,
      title: 'Tài Chính & Quản Trị Tổ Ấm Gia Đình',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY_2',
      subtopics: [
        'Đối chiếu Thập Thần Tài Tinh: Chính Tài (thu nhập vững) vs Thiên Tài (đầu tư, kinh doanh)',
        'Khả năng tụ tài và quản lý chi tiêu của vợ chồng (Mộ Khố / Kho Tài)',
        'Mô hình phân công tài chính gia đình: Ai giữ chìa khóa tay hòm chìa khóa?',
        'Cảnh báo các chu kỳ rủi ro tài chính và nguy cơ thất thoát dòng tiền chung',
        'Chiến lược tích sản, mua nhà đất và kiến tạo nền tảng thịnh vượng vững bền'
      ]
    },
    {
      id: 3,
      title: 'Hóa Giải Xung Khắc & Phong Thủy Phòng Cưới',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Phân tích Cung Phi Bát Trạch (Đông Tứ Mệnh vs Tây Tứ Mệnh, Diên Niên/Thiên Y vs Tuyệt Mệnh/Họa Hại)',
        'Hóa giải các cặp Can Chi hình xung hại phá giữa hai lá số',
        'Phương vị phòng ngủ, hướng kê đầu giường và bố trí phong thủy phòng cưới cát tường',
        'Màu sắc nội thất và vật phẩm phong thủy cầu an gia đạo theo ngũ hành tương sinh',
        'Pháp tu tâm dưỡng tính: "Lạt mềm buộc chặt", lấy nhu thắng cương trong đời sống thường nhật'
      ]
    },
    {
      id: 4,
      title: 'Con Cái, Dòng Tộc & Lộ Trình Vận Trình Trăm Năm',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Đường con cái (Tử Tức) qua Trụ Giờ và Cung Phúc: Cơ duyên thụ thai và phúc trạch con cái',
        'Mối quan hệ với cha mẹ hai bên (Nội - Ngoại) và bài học đối nhân xử thế',
        'Ma trận đối chiếu Đại Vận 10 năm của hai vợ chồng: Các mốc vàng vượng phát và giai đoạn cần đồng cam cộng khổ',
        'Dự báo mốc chuyển biến quan trọng của hôn nhân và cách phòng ngừa rạn nứt từ xa',
        'Lời chúc phúc và kim chỉ nam gìn giữ tổ ấm trăm năm hạnh phúc'
      ]
    }
  ],

  getPillarSpecificInstructions(pillarId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 1 (CỐT CÁCH & TÂM LÝ HAI BẢN THỂ):
- Đi sâu vào tâm lý thực chứng: Không chỉ nói suông ngũ hành sinh khắc, hãy miêu tả sống động cách Chồng phản ứng khi gặp áp lực và cách Vợ tìm kiếm sự an toàn cảm xúc.
- Phân tích rõ: Điểm tương hợp tự nhiên nằm ở đâu (ví dụ: cùng hướng ngoại, hoặc người điềm tĩnh bù cho người nóng tính).
- Nhận diện vùng xung đột: Chỉ ra chính xác thói quen ngôn ngữ hay hành vi nào dễ khiến đối phương tổn thương và đưa ra câu nói "cứu nguy" hóa giải ngay tại chỗ.`,

      2: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 2 (TÀI CHÍNH & QUẢN TRỊ TỔ ẤM GIA ĐÌNH):
- Phân tích thực chất dòng tiền gia đình: Đánh giá ai là người kiếm tiền giỏi hơn, ai là người giữ tiền cẩn trọng hơn dựa trên Chính Tài/Thiên Tài và Kho Tài.
- Đưa ra giải pháp phân bổ ngân sách: Tránh mập mờ, gợi ý cơ chế quỹ chung - quỹ riêng minh bạch.
- Cảnh báo năm hao tài: Chỉ cảnh báo nếu có xung khắc thực tế ở Cung Tài hoặc vận hạn xung phá.`,

      3: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 3 (HÓA GIẢI XUNG KHẮC & PHONG THỦY PHÒNG CƯỚI):
- Tuyệt đối tuân thủ nguyên tắc: KHÔNG BAO GIỜ PHÁN "CHẮC CHẮN LY HÔN" HAY "TUYỆT MỆNH KHÔNG THỂ CỨU". Trong triết lý phong thủy cổ học, mọi thế xung đều có ngũ hành cầu nối trung gian để chuyển hóa (ví dụ: Kim khắc Mộc thì dùng Thủy thông quan; Thủy khắc Hỏa thì dùng Mộc hóa giải).
- Phong thủy phòng ngủ: Cung cấp hướng giường, màu sắc rèm/chăn ga và vật phẩm phong thủy thiết thực.`,

      4: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 4 (CON CÁI, DÒNG TỘC & LỘ TRÌNH TRĂM NĂM):
- Con cái và gia đạo: Phân tích dựa trên Trụ Giờ và cung phối ngẫu, mang thông điệp nuôi dưỡng tích cực, hướng dẫn đồng lòng dạy con.
- Lộ trình 10 năm: Vẽ bảng Markdown so sánh các chặng đại vận của 2 người, chỉ ra giai đoạn ai cần làm điểm tựa cho ai.`
    };
    return INSTRUCTIONS[pillarId] || '';
  }
};

// =========================================================================
// 4. CẤU HÌNH KINH DỊCH CHUYÊN SÂU (ICHING VIP CONFIG)
// =========================================================================
const ICHING_VIP_CONFIG = {
  SCENARIOS: [
    {
      id: 1,
      title: 'Biện Chứng Lục Hào & Động Hào Cát Hung',
      provider: 'openrouter',
      model: 'qwen/qwen-plus',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'Bản chất Quẻ Gốc (Thể) và xu hướng chuyển hóa sang Quẻ Biến (Dụng)',
        'Tương quan Thế - Ứng: Đương số đứng ở đâu trong toàn cảnh thế sự',
        'Giải mã chi tiết các Hào Động: Nguyên nhân khởi phát biến động và mắt xích trọng yếu',
        'Vượng suy của Dụng Thần theo Nguyệt Kiến (Tháng) và Nhật Thần (Ngày gieo quẻ)',
        'Tác động của Lục Thân (Phụ Mẫu, Huynh Đệ, Tử Tôn, Thê Tài, Quan Quỷ) và Thần Thú hộ trì'
      ]
    },
    {
      id: 2,
      title: '3 Kịch Bản Diễn Tiến Tương Lai',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Kịch bản 1 (Thuận dòng tự nhiên): Nếu giữ nguyên hiện trạng, sự việc sẽ đi về đâu?',
        'Kịch bản 2 (Nghịch cảnh tiềm ẩn): Cạm bẫy bất ngờ, trở ngại nhân sự hoặc biến động ngoại cảnh cần lường trước',
        'Kịch bản 3 (Đột phá chuyển nguy thành an): Hành động can thiệp chủ động để đảo ngược thế cờ',
        'Đối chiếu các biến số then chốt: Yếu tố con người (Nhân hòa) vs Cơ hội thiên thời',
        'Bảng tổng hợp so sánh xác suất và hệ quả của 3 kịch bản'
      ]
    },
    {
      id: 3,
      title: 'Mốc Thời Gian Ứng Kỳ & Chiến Lược Hành Động',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Xác định chính xác mốc Ứng Kỳ (Thời điểm sự việc phát tác hoặc có kết quả rõ ràng theo Địa Chi tháng/ngày)',
        'Thời điểm nên chủ động tấn công hoặc ký kết, triển khai quyết định quan trọng',
        'Thời điểm nên thu mình phòng thủ, bảo toàn lực lượng và tránh đối đầu trực diện',
        'Diệu kế hành động thực chiến theo từng bước (Step-by-step Execution Blueprint)',
        'Lời khuyên Đạo Dịch: Trọng đức, tu tâm, tùy thời biến dịch để đạt cát tường'
      ]
    }
  ],

  getScenarioSpecificInstructions(scenarioId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT KHỐI 1 (BIỆN CHỨNG LỤC HÀO & ĐỘNG HÀO CÁT HUNG):
- Bám sát quẻ gieo: Nêu rõ tên Quẻ Chính và Quẻ Biến, ngũ hành quái tượng.
- Luận sâu Dụng Thần: Xác định Dụng Thần dựa trên câu hỏi của đương số. Nếu hỏi tài lộc thì lấy Thê Tài, hỏi thi cử/công danh thì lấy Quan Quỷ/Phụ Mẫu...
- Phân tích hào động: Hào nào động thì hào đó phát động khí, tương tác sinh khắc thế nào với Hào Thế.`,

      2: `NGUYÊN TẮC HỌC THUẬT KHỐI 2 (3 KỊCH BẢN DIỄN TIẾN TƯƠNG LAI):
- Luận giải đa chiều biện chứng: Không đưa ra một lời phán cứng nhắc mà phân tích 3 kịch bản:
  + Kịch bản Thuận: Khi yếu tố cát thần phát huy tối đa.
  + Kịch bản Nghịch: Cảnh báo những rủi ro nếu đương số nôn nóng, bất cẩn.
  + Kịch bản Đột phá: Con đường sáng tạo, giải pháp vượt khung để xoay chuyển tình thế.
- Trình bày dạng bảng so sánh Markdown rõ ràng, cô đọng.`,

      3: `NGUYÊN TẮC HỌC THUẬT KHỐI 3 (MỐC THỜI GIAN ỨNG KỲ & CHIẾN LƯỢC):
- Xác định Ứng Kỳ rõ ràng: Dựa vào hào động xung/hợp hoặc tuần không để chỉ ra tháng/ngày âm lịch cụ thể (ví dụ: Ứng vào tháng Dậu xung Mão, hoặc ngày Thìn hợp Dậu).
- Chiến lược thực chiến: Hướng dẫn đương số nên làm gì, gặp ai, tránh điều gì. Kết thúc bằng lời khuyên sâu sắc từ triết lý Kinh Dịch cổ truyền.`
    };
    return INSTRUCTIONS[scenarioId] || '';
  }
};

module.exports = {
  BAZI_VIP_CONFIG,
  ZIWEI_VIP_CONFIG,
  MARRIAGE_VIP_CONFIG,
  ICHING_VIP_CONFIG
};
