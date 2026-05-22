class RuleEngineService {
    static getDungThanByQuestion(question, gender = 1) {
        const q = (question || '').toLowerCase();
        
        // Tình cảm, hôn nhân, vợ chồng
        if (q.includes('vợ') || q.includes('bạn gái') || q.includes('người yêu nữ') || (gender === 1 && (q.includes('người yêu') || q.includes('tình yêu') || q.includes('hôn nhân') || q.includes('cưới')))) {
            return 'Thê Tài';
        }
        if (q.includes('chồng') || q.includes('bạn trai') || q.includes('người yêu nam') || (gender === 0 && (q.includes('người yêu') || q.includes('tình yêu') || q.includes('hôn nhân') || q.includes('cưới')))) {
            return 'Quan Quỷ';
        }

        if (q.includes('tiền') || q.includes('tài') || q.includes('kinh doanh') || q.includes('mua bán') || q.includes('đầu tư')) {
            return 'Thê Tài';
        }
        if (q.includes('công việc') || q.includes('sự nghiệp') || q.includes('chức vụ') || q.includes('thăng tiến') || q.includes('quan')) {
            return 'Quan Quỷ';
        }
        if (q.includes('học hành') || q.includes('thi cử') || q.includes('giấy tờ') || q.includes('hợp đồng') || q.includes('nhà cửa') || q.includes('cha mẹ')) {
            return 'Phụ Mẫu';
        }
        if (q.includes('con cái') || q.includes('bệnh tật') || q.includes('sức khỏe') || q.includes('bình an') || q.includes('thuốc')) {
            return 'Tử Tôn';
        }
        if (q.includes('bạn bè') || q.includes('đối tác') || q.includes('anh em') || q.includes('hợp tác')) {
            return 'Huynh Đệ';
        }
        // Default to Thế or just general
        return 'Thế';
    }

    static getStrength(vuongSuy) {
        // Vượng Suy: Vượng, Tướng, Hưu, Tù, Tử
        if (['Vượng', 'Tướng'].includes(vuongSuy)) return 'strong';
        if (['Hưu', 'Tù', 'Tử'].includes(vuongSuy)) return 'weak';
        return 'neutral';
    }

    static analyze(record, userGender = 1) {
        const question = record.question;
        const dungThanTarget = this.getDungThanByQuestion(question, userGender);
        
        let dungThanLines = [];
        let theLine = null;
        let ungLine = null;

        const primaryLines = record.primaryLines || [];
        const secondaryLines = record.secondaryLines || [];
        
        const movingLinesResult = [];
        const specialStates = [];

        primaryLines.forEach((line, index) => {
            if (line.relative === dungThanTarget || (dungThanTarget === 'Thế' && line.is_host)) {
                dungThanLines.push(line);
            }
            if (line.is_host) theLine = line;
            if (line.is_guest) ungLine = line;

            if (line.moving && secondaryLines[index]) {
                const pBranch = line.stem_branch.split(' ').pop();
                const sBranch = secondaryLines[index].stem_branch.split(' ').pop();
                const pElement = line.element;
                const sElement = secondaryLines[index].element;
                
                let effect = '';
                // Simple Hoa Tien / Hoa Thoai logic
                const branchOrder = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
                const pIdx = branchOrder.indexOf(pBranch);
                const sIdx = branchOrder.indexOf(sBranch);
                
                if (pElement === sElement) {
                    if ((sIdx > pIdx && (sIdx - pIdx) <= 2) || (sIdx < pIdx && (pIdx - sIdx) > 9)) {
                        effect = 'Hóa Tiến';
                    } else {
                        effect = 'Hóa Thoái';
                    }
                } else {
                    const sinh = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
                    const khac = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
                    if (sinh[sElement] === pElement) effect = 'Hóa Sinh (Tốt)';
                    else if (khac[sElement] === pElement) effect = 'Hóa Khắc (Xấu)';
                    else effect = 'Hóa Biến';
                }

                movingLinesResult.push({
                    line: index + 1,
                    effect: effect,
                    from: `${line.relative} (${pElement})`,
                    to: `${secondaryLines[index].relative} (${sElement})`
                });
            }

            if (line.tk === 'K') {
                if (!specialStates.includes('Tuần Không')) specialStates.push('Tuần Không');
            }
        });

        // Resolve Dung Than
        // If multiple Dung Than, pick the one that is moving or is the host. If none, pick first.
        let mainDungThan = dungThanLines.find(l => l.moving) || dungThanLines.find(l => l.is_host) || dungThanLines[0];
        
        let dungThanInfo = { relation: 'Không hiện trên quẻ', strength: 'neutral', element: 'Unknown' };
        if (mainDungThan) {
            dungThanInfo = {
                relation: mainDungThan.relative,
                strength: this.getStrength(mainDungThan.vuong_suy),
                element: mainDungThan.element,
                is_tuankhong: mainDungThan.tk === 'K'
            };
        } else if (dungThanTarget !== 'Thế') {
            // Find hidden spirit (Phục thần) - simplified
            specialStates.push('Dụng Thần Phục Tàng (Ẩn)');
        }

        const theInfo = theLine ? {
            relation: theLine.relative,
            strength: this.getStrength(theLine.vuong_suy),
            element: theLine.element,
            is_tuankhong: theLine.tk === 'K'
        } : null;

        const ungInfo = ungLine ? {
            relation: ungLine.relative,
            strength: this.getStrength(ungLine.vuong_suy),
            element: ungLine.element,
            is_tuankhong: ungLine.tk === 'K'
        } : null;

        // Xung Hợp (Simplified between The and Ung)
        if (theLine && ungLine) {
            const sinh = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
            const khac = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
            if (sinh[theLine.element] === ungLine.element) specialStates.push('Thế Sinh Ứng');
            if (sinh[ungLine.element] === theLine.element) specialStates.push('Ứng Sinh Thế');
            if (khac[theLine.element] === ungLine.element) specialStates.push('Thế Khắc Ứng');
            if (khac[ungLine.element] === theLine.element) specialStates.push('Ứng Khắc Thế');
        }

        // Tính toán điểm tin cậy số học (confidence score)
        let confidence = 0.75; // Baseline
        if (dungThanTarget !== 'Thế' && mainDungThan) {
            confidence += 0.10; // Tìm thấy Dụng thần cụ thể
        }
        if (dungThanInfo && dungThanInfo.strength === 'strong') {
            confidence += 0.05; // Dụng thần vượng/tướng
        }
        if (movingLinesResult.length > 0) {
            confidence += 0.05; // Có hào động báo hiệu diễn biến rõ ràng
        }
        if (specialStates.includes('Tuần Không') || specialStates.includes('Dụng Thần Phục Tàng (Ẩn)')) {
            confidence -= 0.15; // Tuần không hoặc phục tàng làm giảm độ ứng nghiệm tức thời
        }
        confidence = parseFloat(Math.max(0.50, Math.min(0.95, confidence)).toFixed(2));

        return {
            dungThan: dungThanTarget,
            dungThanDetails: dungThanInfo,
            the: theInfo,
            ung: ungInfo,
            movingLines: movingLinesResult,
            specialStates: specialStates,
            confidence: confidence
        };
    }
}

module.exports = RuleEngineService;
