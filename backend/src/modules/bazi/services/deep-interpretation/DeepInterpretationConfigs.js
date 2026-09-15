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
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
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
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
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
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY_2',
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
      keyEnv: 'GEMINI_API_KEY_2',
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
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY',
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
      keyEnv: 'GEMINI_API_KEY',
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
      1: process.env.OPENROUTER_MODEL_CH1 || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      2: 'gemini-direct',
      3: process.env.OPENROUTER_MODEL_CH3 || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      4: 'gemini-direct',
      5: process.env.OPENROUTER_MODEL_CH5 || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      6: 'gemini-direct'
    };
    return DEFAULT_MAP[chapterId] || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free';
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
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
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
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
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
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY_2',
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
      keyEnv: 'GEMINI_API_KEY_2',
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
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY',
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
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
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
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
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
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY_2',
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

/// =========================================================================
// 4. CẤU HÌNH KINH DỊCH CHUYÊN SÂU (ICHING VIP CONFIG - 6 CHƯƠNG TOÀN DIỆN)
// =========================================================================
const ICHING_VIP_CONFIG = {
  CHAPTERS: [
    {
      id: 1,
      title: 'Khởi Quái & Tượng Pháp Chu Dịch (Bản Chất Thời Thế & Quái Tượng Vĩ Mô)',
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'Bản chất Quẻ Chủ (Thể) và xu hướng chuyển hóa sang Quẻ Biến (Dụng), Quẻ Hỗ tiềm ẩn',
        'Ý nghĩa quái tượng thiên nhiên (Trời, Đất, Sấm, Gió, Nước, Lửa, Núi, Đầm) ứng vào hoàn cảnh câu hỏi',
        'Giải mã Thoán Từ của quẻ chủ và Hào Từ tại các hào phát động',
        'Định vị thời thế đương số: Đang ở giai đoạn Tiềm ẩn, Khó khăn, Hanh thông hay Kháng cực thoái trào',
        'Lời răn học thuật: Tượng quẻ là hoàn cảnh bên ngoài (Biểu), chưa thể vội kết luận cát hung thực chất'
      ]
    },
    {
      id: 2,
      title: 'Biện Chứng Lục Hào & Vị Thế Dụng Thần (Thực Lực Cốt Lõi Trọng Tâm)',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Định vị Dụng Thần chuẩn xác duy nhất theo câu hỏi cốt lõi (Tài, Quan, Phụ, Tử, Huynh)',
        'Thẩm định độ Vượng - Tướng - Hưu - Tù của Dụng Thần dưới ảnh hưởng của Nguyệt Kiến (Tháng) và Nhật Thần (Ngày)',
        'Tương quan Hào Thế (Nội lực bản thân) vs Hào Ứng (Mục tiêu / Đối tác / Môi trường)',
        'Phân tích thế cục: Thế Ứng tương sinh, tương khắc, hay tỷ hòa; ai đang nắm quyền chủ động',
        'Kỷ luật học thuật: Tuyệt đối bám sát câu hỏi, không lan man sang chủ đề không liên quan'
      ]
    },
    {
      id: 3,
      title: 'Động Hào Biến Khí & Yếu Tố Ẩn Tàng (Dòng Chảy Biến Động & Tâm Lý Vi Mô)',
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY_2',
      subtopics: [
        'Giải phẫu chi tiết các Hào Động: Hào phát động sinh hay khắc Dụng Thần, hỗ trợ hay phá hoại',
        'Biến Hóa Hào: Hóa Tiến thần (ngày càng mạnh), Hóa Thoái thần (dần tiêu hao), Hóa Hồi Đầu Khắc (tự gây họa)',
        'Hào Động hóa Tuyệt, hóa Mộ, hoặc hóa Không ảnh hưởng trực tiếp đến kết quả',
        'Truy vết Phục Thần & Phi Thần: Những yếu tố chìm khuất, tiền ngầm, người giấu mặt, mầm bệnh chưa phát',
        'Lục Thần tác động vi mô: Thanh Long hỷ khí, Chu Tước khẩu thiệt, Câu Trần trì trệ, Đằng Xà lo âu, Bạch Hổ hung sát, Huyền Vũ khuất tất'
      ]
    },
    {
      id: 4,
      title: 'Đối Chiếu Biện Chứng Tượng - Hào & Phán Quyết Thực Thể (Nút Thắt Cốt Lõi - Không Thiên Vị)',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY',
      subtopics: [
        'Bảng Đối Chiếu Ma Trận Biểu (Tượng 64 Quẻ) vs Lý (Lục Hào Dụng Thần)',
        'Phân tích biện chứng sâu sắc: Quẻ Hung Hào Cát (vượt chông gai hái quả ngọt) hay Quẻ Cát Hào Hung (mật ngọt chết ruồi)',
        'Đánh giá tính đồng thuận hoặc mâu thuẫn giữa hoàn cảnh bên ngoài và thực chất bên trong',
        'Phán quyết dứt khoát không thiên vị: Thành hay Bại? Được hay Mất? Lành hay Dữ? Tuyệt đối không phán nước đôi',
        'Chỉ rõ tử huyệt lớn nhất và nguyên nhân cốt lõi dẫn đến kết quả này'
      ]
    },
    {
      id: 5,
      title: 'Định Lượng Thời Khắc Ứng Kỳ & Bản Đồ Không - Thời Gian Theo Ngữ Cảnh',
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
      keyEnv: 'OPENROUTER_API_KEY',
      subtopics: [
        'Phân loại câu hỏi theo 4 Nhóm Thời Gian: Chu kỳ sinh học (theo tháng) vs Chuyển dịch cơ hội (tháng + ngày vàng gần nhất) vs Ngắn hạn/Giao dịch (ngày gần nhất + giờ hoàng đạo) vs Tìm đồ/Người (còn/mất + giờ/ngày gần nhất)',
        'Bắt buộc tra cứu trực tiếp mốc ngày/tháng từ [BẢNG TRA CỨU MỐC DƯƠNG LỊCH GẦN NHẤT CHÍNH XÁC], tuyệt đối không bịa ngày xa xôi vô căn cứ',
        'Phân tích Dịch lý Ứng kỳ Lục Hào: Dụng Thần đắc lệnh, Xuất Không, Trị Nhật, Hợp Hào, Xung Hào, Khai Mộ',
        'Bảng Ma Trận Ứng Kỳ 4 Cột: Mốc Thời Gian (Âm Lịch) | Mốc Dương Lịch Gần Nhất Cụ Thể | Dịch Lý Luận Giải | Diệu Kế & Hành Động Cụ Thể',
        'Cảnh báo thời khắc tử huyệt hung sát (hình xung phá hại) cần tuyệt đối né tránh hoặc thu mình phòng thủ'
      ]
    },
    {
      id: 6,
      title: 'Kim Chỉ Nam Đạo Dịch & Diệu Kế Hành Động "Tùy Thời Biến Dịch"',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      keyEnv: 'GEMINI_API_KEY_2',
      subtopics: [
        'Phác đồ hành động từng bước (Step-by-step Action Blueprint) giải quyết nút thắt câu hỏi',
        'Sách lược điều hòa: Cách ứng xử khi gặp Quẻ Hung Hào Cát (nhẫn nại tích lũy) vs Quẻ Cát Hào Hung (tỉnh táo phòng thủ)',
        'Thời điểm nên chủ động tấn công, chốt hạ quyết định quan trọng vs Thời điểm nên thu mình ẩn nhẫn',
        'Người cần gặp, việc nên làm, điều tối kỵ cần tránh để bảo toàn bản thân',
        'Lời khuyên Đạo Dịch: Cương Nhu tương phối, tri kỷ tri bỉ, thuận thiên ứng nhân để vạn sự hanh thông'
      ]
    }
  ],

  // Alias để bảo toàn tương thích ngược
  get SCENARIOS() {
    return this.CHAPTERS;
  },

  getChapterSpecificInstructions(chapterId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 1 (KHỞI QUÁI & TƯỢNG PHÁP CHU DỊCH):
- Nêu rõ tên Quẻ Chủ, Quẻ Hỗ, Quẻ Biến; ngũ hành của các quái (Càn Kim, Khôn Thổ, v.v.).
- Phân tích Quẻ Thể (Chủ thể đương số) và Quẻ Dụng (Sự việc/Môi trường): Thể Dụng sinh khắc ra sao.
- Luận Thoán Từ quẻ chủ và Hào Từ tại các hào động, rút ra thông điệp thế cuộc của cổ nhân về câu hỏi.
- ‼️ LƯU Ý BẮT BUỘC: Nhấn mạnh Tượng Quẻ 64 quẻ phản ánh bối cảnh môi trường bên ngoài ("Biểu"). Tuyệt đối chưa vội kết luận thành bại mà phải chờ đối chiếu Lục Hào ở các chương sau.`,

      2: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 2 (BIỆN CHỨNG LỤC HÀO & VỊ THẾ DỤNG THẦN):
- ‼️ TẬP TRUNG 100% VÀO CÂU HỎI CỐT LÕI: Xác định DUY NHẤT Dụng Thần tương ứng với câu hỏi:
  + Hỏi Bệnh tật/Sức khỏe: Dụng thần là Hào Thế (thể trạng), Quan Quỷ (bệnh tà), Tử Tôn (dược liệu/phúc thần giải bệnh). TUYỆT ĐỐI KHÔNG LUẬN CÔNG DANH TIỀN BẠC!
  + Hỏi Tiền tài/Đầu tư/Kinh doanh: Dụng thần là Thê Tài (vốn/lãi), Tử Tôn (nguồn sinh tài), Huynh Đệ (đối thủ/nguy cơ đoạt tài).
  + Hỏi Công việc/Thăng chức/Thi cử: Dụng thần là Quan Quỷ (chức vụ), Phụ Mẫu (bằng cấp/hồ sơ), Huynh Đệ (đối thủ cạnh tranh).
  + Hỏi Kiện tụng/Pháp lý: Quan Quỷ (quan tòa/pháp luật), Thế (mình), Ứng (đối phương), Tử Tôn (hòa giải).
  + Hỏi Tình duyên/Hôn nhân: Nam lấy Thê Tài, Nữ lấy Quan Quỷ, Ứng hào là đối phương.
- Đánh giá Vượng Tướng Hưu Tù của Dụng Thần dựa trên Nguyệt Kiến (Tháng) và Nhật Thần (Ngày gieo).
- Phân tích tương quan Hào Thế (Bản thân) vs Hào Ứng (Đối phương/Mục tiêu): Sinh trợ, tương khắc, hay xung phá.`,

      3: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 3 (ĐỘNG HÀO BIẾN KHÍ & YẾU TỐ ẨN TÀNG):
- Phân tích chi tiết từng Hào Động: Hào phát động tương tác sinh khắc thế nào với Dụng Thần và Thế hào.
- Đánh giá Biến Hào: Hóa Tiến Thần (vấn đề tăng tiến), Hóa Thoái Thần (suy giảm thoái lui), Hóa Hồi Đầu Khắc (tự chuốc vạ vào thân), Hóa Mộ/Tuyệt/Không.
- Truy vết Phục Thần & Phi Thần: Có yếu tố nào chìm khuất chưa lộ rõ (tiền ngầm, kẻ thứ ba, bệnh ngầm)?
- Tác động của Lục Thần (Thanh Long, Chu Tước, Câu Trần, Đằng Xà, Bạch Hổ, Huyền Vũ) lên tâm lý, hành vi của các bên.`,

      4: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 4 (ĐỐI CHIẾU BIỆN CHỨNG TƯỢNG - HÀO & PHÁN QUYẾT THỰC THỂ):
- ‼️ BẮT BUỘC THIẾT LẬP BẢNG SO SÁNH MA TRẬN 3 CỘT:
  | Chiều Kích Soi Chiếu | Góc Nhìn Tượng Pháp (64 Quẻ) | Góc Nhìn Lục Hào (Dụng Thần) | Biện Chứng Hợp Nhất (Thực Tế) |
- Luận giải sâu sắc sự mâu thuẫn hoặc đồng thuận giữa Tượng và Hào:
  + Nếu Quẻ Hung mà Hào Cát: Tượng quẻ gian nan trắc trở (như Khốn, Truân, Phệ Hạp) nhưng Dụng thần vượng tướng, đắc sinh phù ➡️ Bản chất là "TRONG NGUY CÓ CƠ", phải chịu áp lực vượt khó ban đầu mới hái quả ngọt lớn.
  + Nếu Quẻ Cát mà Hào Hung: Tượng quẻ êm ả thuận hòa (như Thái, Tấn, Đại Hữu) nhưng Dụng thần Không Tuyệt, Hóa Thoái, bị khắc ➡️ Bản chất là "MẬT NGỌT CHẾT RUỒI", bề ngoài bánh vẽ hào nhoáng nhưng bên trong rỗng tuếch, dễ mất trắng nếu nhẹ dạ.
  + Nếu Cát - Cát: Thuận buồm xuôi gió toàn diện, thiên thời địa lợi.
  + Nếu Hung - Hung: Tứ phía bủa vây, họa vô đơn chí, tuyệt đối dừng lại.
- ‼️ ĐƯA RA PHÁN QUYẾT DỨT KHOÁT: Trả lời thẳng câu hỏi cốt lõi: Thành hay Bại? Được hay Mất? Lành hay Dữ? TUYỆT ĐỐI KHÔNG NÓI NƯỚC ĐÔI.`,

      5: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 5 (ĐỊNH LƯỢNG ỨNG KỲ THEO NGỮ CẢNH & QUY ĐỔI DƯƠNG LỊCH GẦN NHẤT - PHƯƠNG ÁN B):
- ‼️ QUY TẮC BẮT BUỘC: TRA CỨU LỊCH PHÁP TỪ DỮ LIỆU ĐƯỢC CUNG CẤP:
  Bạn được cung cấp [BẢNG TRA CỨU MỐC DƯƠNG LỊCH GẦN NHẤT CHÍNH XÁC (SOURCE OF TRUTH)] bên dưới.
  BẮT BUỘC bạn phải tra cứu trực tiếp ngày, tháng, thứ và khoảng ngày Dương lịch từ bảng này.
  TUYỆT ĐỐI CẤM tự suy đoán hoặc bịa ra ngày tháng Dương lịch xa xôi, vô căn cứ!

- ‼️ MA TRẬN PHÂN LOẠI NGỮ CẢNH 4 NHÓM THỜI GIAN (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
  1. NHÓM 1 - CHU KỲ SINH HỌC & TÍCH LŨY DÀI HẠN (Hỏi mang thai, sinh con, mua nhà đất, định cư, kết hôn):
     + ĐẶC ĐIỂM BẮT BUỘC: Đoán theo THÁNG ÂM LỊCH (kèm khoảng 30 ngày Dương lịch cụ thể).
     + LÝ GIẢI HỌC THUẬT: Việc mang thai, sinh nở hay giao dịch bất động sản cần chu kỳ sinh học và chuẩn bị tài chính dài ngày. TUYỆT ĐỐI CẤM đoán ngày lẻ xa xôi gây ngộ nhận cho người hỏi.
     + CÁCH CHỌN MỐC: Tra Bảng 2, chọn 1 - 2 tháng cát lợi gần nhất (ví dụ: Tháng 9 ÂL Mậu Tuất từ 10/10/2026 đến 08/11/2026 DL; hoặc Tháng 10 ÂL Kỷ Hợi từ 09/11/2026 đến 08/12/2026 DL) khi Dụng Thần (Tử Tôn/Phụ Mẫu) đắc lệnh hoặc xuất Không.

  2. NHÓM 2 - BƯỚC NGOẶT CHUYỂN DỊCH & CƠ HỘI NGHỀ NGHIỆP (Hỏi tìm việc làm, chuyển việc, thi cử, kết quả phỏng vấn, thăng chức):
     + ĐẶC ĐIỂM BẮT BUỘC: KẾT HỢP SONG SONG HAI CẤP ĐỘ (CÁC NGÀY VÀNG GẦN NHẤT + THÁNG MỤC TIÊU):
       * Cấp độ 1 - Các Ngày Vàng Gần Nhất (Hàng 1, 2, 3 của bảng ma trận): BẮT BUỘC CHỌN 2 - 3 NGÀY TRONG BẢNG 1 CÓ MỐC GẦN NHẤT (ƯU TIÊN MỐC LẦN 1 TRONG VÒNG 1 - 14 NGÀY TỚI) đắc sinh phù để NỘP HỒ SƠ, GỬI CV, HẸN PHỎNG VẤN, CHỦ ĐỘNG LIÊN HỆ. TUYỆT ĐỐI CẤM nhảy cóc sang tháng 10 hay tháng 11 nếu việc có thể khởi động ngay trong tuần này/tuần sau!
       * Cấp độ 2 - Tháng Mục Tiêu: Chọn tháng gần nhất trong 1 - 2 tháng tới từ Bảng 2 (ví dụ: Tháng 8 ÂL hiện tại hoặc Tháng 9 ÂL kế tiếp) làm mốc chính thức nhậm chức/nhận kết quả chung cuộc. TUYỆT ĐỐI KHÔNG nhảy sang tháng quá xa (tháng 10, 11, 12).

  3. NHÓM 3 - SỰ KIỆN NGẮN HẠN / GIAO DỊCH TỨC THÌ / PHÁP LÝ (Hỏi đòi nợ, ký hợp đồng, xuất hành, giải quyết tranh chấp, thi đấu, sự kiện tuần này/tháng này):
     + ĐẶC ĐIỂM BẮT BUỘC: Đoán theo NGÀY GẦN NHẤT (trong vòng 1 - 14 ngày tới) + KHUNG GIỜ HOÀNG ĐẠO.
     + CÁCH CHỌN MỐC: Tra Bảng 1, lấy ngay mốc Lần 1 gần nhất của Chi tương sinh/hợp Dụng Thần. Nếu ngày gần nhất bị Tuần Không hoặc Xung phá thì chỉ định ngày Lần 2 gần kế tiếp (Kế hoạch B).

  4. NHÓM 4 - TÌM ĐỒ MẤT / TÌM NGƯỜI THẤT LẠC:
     + Thẩm định TIÊN QUYẾT: Còn hay Mất hẳn? Nếu Dụng Thần lâm Không Tuyệt, bị Huynh Đệ đoạt, Huyền Vũ lừa gạt ➡️ KHẲNG ĐỊNH ĐÃ MẤT HẲN, TUYỆT ĐỐI KHÔNG TÍNH ỨNG KỲ TÌM THẤY ĐỂ TRÁNH GÂY HY VỌNG HÃO HUYỀN.
     + Nếu còn tìm được: Cung cấp Phương Vị (hướng Bát Quái) + Địa Điểm đặc trưng (vật dụng/vị trí) + Giờ & Ngày GẦN NHẤT (trong 24h - 72h tới) để tìm kiếm.

- ‼️ BẢNG MA TRẬN ỨNG KỲ QUY ĐỔI SONG SONG (BẮT BUỘC 4 CỘT):
  BẮT BUỘC thiết lập 1 bảng Markdown chi tiết gồm 4 cột:
  | Mốc Thời Gian (Âm Lịch) | Mốc Dương Lịch Gần Nhất Cụ Thể | Dịch Lý Luận Giải | Diệu Kế & Hành Động Cụ Thể |
  (BẮT BUỘC: 2 - 3 hàng đầu trích xuất nguyên văn mốc ngày GẦN NHẤT từ BẢNG 1 trong vòng 1 - 14 ngày tới để nộp CV/hành động; hàng cuối cùng lấy mốc tháng từ BẢNG 2 cho kết quả nhận việc chính thức. TUYỆT ĐỐI CẤM lấy toàn mốc xa xôi).`,

      6: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 6 (KIM CHỈ NAM ĐẠO DỊCH & DIỆU KẾ HÀNH ĐỘNG):
- Phác đồ hành động từng bước (Action Blueprint): 3 việc nên làm ngay, người cần gặp hoặc nhờ cậy, điều tối kỵ cần tránh.
- Sách lược Đạo Dịch "Tùy Thời Biến Dịch": Biết tiến thoái đúng lúc, vận dụng đức Cương Kiện hay Nhu Thuận theo quái khí.
- Lời khuyên tu tâm định tính: Giữ tâm an định, trung chính để chuyển hung hóa cát.`
    };
    return INSTRUCTIONS[chapterId] || '';
  },

  // Alias để bảo toàn tương thích
  getScenarioSpecificInstructions(id) {
    return this.getChapterSpecificInstructions(id);
  }
};

module.exports = {
  BAZI_VIP_CONFIG,
  ZIWEI_VIP_CONFIG,
  MARRIAGE_VIP_CONFIG,
  ICHING_VIP_CONFIG
};
