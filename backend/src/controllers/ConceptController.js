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
};

class ConceptController {
    static async getConcept(req, res) {
        try {
            const { term } = req.params;
            const fallback = CONCEPT_FALLBACK[term];
            const row = conceptsData.find(c => c.term === term);
            if (row) {
                const result = { ...row };
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
