const fs = require('fs');
const path = require('path');
const { Lunar, Solar } = require('lunar-javascript');

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const toVi = (hanStr) => {
    if (!hanStr) return '';
    let result = hanStr;
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(han, vi);
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(han, vi);
    return result;
};

const THAP_THAN = {
    "比肩": "Tỷ Kiên", "劫财": "Kiếp Tài", "食神": "Thực Thần", "伤官": "Thương Quan",
    "偏财": "Thiên Tài", "正财": "Chính Tài", "七杀": "Thất Sát", "正官": "Chính Quan",
    "偏印": "Thiên Ấn", "正印": "Chính Ấn", "日主": "Nhật Chủ"
};
const toThapThan = (han) => THAP_THAN[han] || han;

class BaziAnalyzer {
    constructor() {
        const rulesPath = path.join(__dirname, '../data/rules.json');
        this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }

    analyze(dateStr, timeStr, gender = 1) { // gender: 1 (Nam), 0 (Nữ)
        // 1. Data Prep
        const [day, month, year] = dateStr.split('/').map(Number);
        const [hour, minute] = timeStr.split(':').map(Number);
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunar = solar.getLunar();
        const bazi = lunar.getEightChar();

        // Build Da Yun
        const yun = bazi.getYun(gender);
        const daYunData = yun.getDaYun().map(d => ({
            startYear: d.getStartYear(),
            gan: toVi(d.getGanZhi().substring(0, 1)),
            zhi: toVi(d.getGanZhi().substring(1, 2)),
        }));

        // Bóc tách Tàng can & Thập thần
        const buildPillar = (type) => {
            let gan, zhi, thapThanGan;
            let hiddenList = [];
            
            if (type === 'year') { gan = bazi.getYearGan(); zhi = bazi.getYearZhi(); thapThanGan = toThapThan(bazi.getYearShiShenGan()); hiddenList = bazi.getYearShiShenZhi(); }
            if (type === 'month') { gan = bazi.getMonthGan(); zhi = bazi.getMonthZhi(); thapThanGan = toThapThan(bazi.getMonthShiShenGan()); hiddenList = bazi.getMonthShiShenZhi(); }
            if (type === 'day') { gan = bazi.getDayGan(); zhi = bazi.getDayZhi(); thapThanGan = "Nhật Chủ"; hiddenList = bazi.getDayShiShenZhi(); }
            if (type === 'hour') { gan = bazi.getTimeGan(); zhi = bazi.getTimeZhi(); thapThanGan = toThapThan(bazi.getTimeShiShenGan()); hiddenList = bazi.getTimeShiShenZhi(); }

            const viZhi = toVi(zhi);
            const hiddenStemsArr = this.rules.hiddenStems[viZhi] || [];
            
            const tangCan = hiddenStemsArr.map((tGan, idx) => ({
                gan: tGan,
                thapThan: toThapThan(hiddenList[idx])
            }));

            return {
                gan: toVi(gan),
                zhi: viZhi,
                thapThanGan,
                tangCan
            };
        };

        const canChi = {
            year: buildPillar('year'),
            month: buildPillar('month'),
            day: buildPillar('day'),
            hour: buildPillar('hour')
        };

        const analysis = {
            than: "",
            tongCachType: "",
            relations: {
                tamHop: [], banTamHop: [], lucXung: [], lucHop: [], lucHai: [], lucPha: []
            }
        };

        // PHASE 1: Build Base Elements
        let elementScore = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
        const pillars = ['year', 'month', 'day', 'hour'];
        
        pillars.forEach(p => {
            const gan = canChi[p].gan;
            const zhi = canChi[p].zhi;
            
            // Stem score
            const ganElem = this.rules.stemElement[gan];
            if (ganElem) elementScore[ganElem] += this.rules.scoreConfig.canWeight;

            // Branch score
            const zhiElem = this.rules.branchElement[zhi];
            if (zhiElem) elementScore[zhiElem] += this.rules.scoreConfig.chiWeight;

            // Hidden Stems score
            const hiddens = this.rules.hiddenStems[zhi] || [];
            hiddens.forEach(hGan => {
                const hElem = this.rules.stemElement[hGan];
                if (hElem) elementScore[hElem] += this.rules.scoreConfig.tangCanWeight;
            });
        });

        // Apply Month Power Scale (Nắm lệnh)
        const monthZhi = canChi.month.zhi;
        const mPower = this.rules.monthPower[monthZhi];
        if (mPower) {
            this.rules.elements.forEach(el => {
                const factor = mPower[el] || 0;
                // Add points: base + power * scale * 10
                elementScore[el] += factor * this.rules.scoreConfig.monthScale * 10;
            });
        }

        // PHASE 2: Dynamic Adjustments
        // Relationships: Sinh, Khắc globally for the elements score.
        // Actually, simple global relation interaction reduces opposing forces slightly. We use relationScore dynamically.
        // Based on user: "Sinh - khắc - tiết - hao (relation)". To keep logic mathematical, we map global scores.
        let newScores = { ...elementScore };
        this.rules.elements.forEach(el1 => {
            if (elementScore[el1] > 0) {
                this.rules.elements.forEach(el2 => {
                    const rel = this.rules.relation[el1]?.[el2];
                    if (rel && elementScore[el2] > 0) {
                        const factor = this.rules.scoreConfig.relationScore[rel];
                        // If el1 relates to el2 with factor, applying to el1's power slightly based on el2's presence
                        newScores[el1] += factor * (elementScore[el2] / 50); // Normalized bump
                    }
                });
            }
        });
        elementScore = newScores;

        // Combine Branch relationships
        const branchList = pillars.map(p => canChi[p].zhi);
        
        // Helper to check arrays
        const hasSubset = (arr, subset) => subset.every(v => arr.includes(v));

        Object.keys(this.rules.branchRelations).forEach(relType => {
            const groups = this.rules.branchRelations[relType];
            groups.forEach(group => {
                if (hasSubset(branchList, group)) {
                    analysis.relations[relType].push(group.join('-'));
                    
                    // Adjust scores for Special
                    const points = this.rules.scoreConfig.special[relType];
                    if (points) {
                        // Tam hop -> becomes strong element. Example Thân Tý Thìn -> Thủy
                        if (relType === 'tamHop' || relType === 'banTamHop') {
                            const domElem = this.rules.branchElement[group[1]]; // Center branch element usually defines Tam hợp
                            elementScore[domElem] += points;
                        } else if (relType === 'lucXung') {
                            // Xung deducts points for both elements equally
                            group.forEach(z => {
                                const e = this.rules.branchElement[z];
                                elementScore[e] += points; // points is negative (-8)
                            });
                        } else if (relType === 'lucHop') {
                             group.forEach(z => elementScore[this.rules.branchElement[z]] += points/2);
                        } else {
                            // Hai, pha -> negative
                            group.forEach(z => elementScore[this.rules.branchElement[z]] += points/2);
                        }
                    }
                }
            });
        });

        // Hoa Hop (Stem Transform)
        const ganList = pillars.map(p => canChi[p].gan);
        for(let i=0; i<ganList.length-1; i++) {
            const pair1 = `${ganList[i]}-${ganList[i+1]}`;
            const pair2 = `${ganList[i+1]}-${ganList[i]}`;
            const transElem = this.rules.hoaHop[pair1] || this.rules.hoaHop[pair2];
            if (transElem) {
                elementScore[transElem] += 5; // Tăng cục bộ
            }
        }

        // Thổ Khô / Ứớt Tách
        let hasWet = branchList.some(z => this.rules.tho.wet.includes(z));
        let hasDry = branchList.some(z => this.rules.tho.dry.includes(z));
        if (hasWet) {
            elementScore['Kim'] += 5;
            elementScore['Hoa'] -= 5;
        }
        if (hasDry) {
            elementScore['Hoa'] += 5;
            elementScore['Thuy'] -= 5;
        }

        // Nhóm Thổ
        if (elementScore['Tho'] > 50) {
            elementScore['Moc'] -= 10;
            elementScore['Thuy'] -= 10;
        }

        // Mộ Kho
        branchList.forEach(z => {
            Object.keys(this.rules.moKho).forEach(elem => {
                if (this.rules.moKho[elem] === z) {
                    if (elementScore[elem] > 40) elementScore[elem] -= 4; // reduced if strong
                    else elementScore[elem] += 2; // protected if weak
                }
            });
        });

        // Ensure no negative scores
        for (const k in elementScore) elementScore[k] = Math.max(0, parseFloat(elementScore[k].toFixed(2)));

        // PHASE 3: Analysis
        const dmGan = canChi.day.gan;
        const dmElem = this.rules.stemElement[dmGan];
        const totalScore = Object.values(elementScore).reduce((a,b) => a+b, 0);

        // Lực Nhật chủ (bao gồm chính nó và hành Sinh nó)
        let dongDang = 0;
        let khacTiet = 0;
        
        Object.keys(elementScore).forEach(el => {
            const relation = this.rules.relation[dmElem][el];
            if (relation === 'tro' || relation === 'duoc_sinh') {
                dongDang += elementScore[el];
            } else {
                khacTiet += elementScore[el];
            }
        });

        // Tòng Cách Check
        let isTongCach = false;
        let strongestElem = "";
        let maxVal = 0;
        
        for (const [el, val] of Object.entries(elementScore)) {
            if (val > maxVal) { maxVal = val; strongestElem = el; }
        }

        if (maxVal / totalScore > 0.7) {
            isTongCach = true;
            analysis.than = "tong_cach";
            const rel = this.rules.relation[dmElem][strongestElem];
            if (rel === 'tro') analysis.tongCachType = "tòng vượng";
            else if (rel === 'khac') analysis.tongCachType = "tòng sát";
            else if (rel === 'sinh') analysis.tongCachType = "tòng nhi";
            else if (rel === 'bi_khac') analysis.tongCachType = "tòng tài";
            else analysis.tongCachType = "tòng cách đặc biệt";
        } else {
            if (dongDang > khacTiet * 1.2) analysis.than = "vuong";
            else if (khacTiet > dongDang * 1.2) analysis.than = "nhuoc";
            else analysis.than = "can_bang";
        }

        // PHASE 4: Dụng Thần & Hỷ Thần
        let dungThan = "";
        let hyThan = "";
        
        if (isTongCach) {
            // Tòng theo hành mạnh nhất
            dungThan = strongestElem;
            hyThan = Object.keys(this.rules.relation[strongestElem]).find(k => this.rules.relation[strongestElem][k] === 'duoc_sinh');
        } else {
            if (analysis.than === "vuong") {
                // Find element that Khắc or Tiết (Sinh Xuất) day master mostly
                dungThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'bi_khac'); // Thê Tài
                hyThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'khac'); // Quan Sát
            } else {
                // Nhược -> Sinh (Phụ mẫu) / Trợ (Huynh đệ)
                dungThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'duoc_sinh'); 
                hyThan = dmElem;
            }
        }

        return {
            canChi,
            nguHanh: elementScore,
            analysis,
            dungThan,
            hyThan,
            daYun: daYunData
        };
    }
}

module.exports = new BaziAnalyzer();
