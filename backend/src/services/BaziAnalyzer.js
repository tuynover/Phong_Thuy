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
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(han, vi + ' ');
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(han, vi);
    return result.trim();
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

    determineCachCuc(dayGan, monthZhi, canChi, elementScore) {
        const exposedGans = [canChi.year.gan, canChi.month.gan, canChi.hour.gan];
        const allStems = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        const allZhis = [canChi.year.zhi, canChi.month.zhi, canChi.day.zhi, canChi.hour.zhi];
        
        const stemToElement = {
            'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
            'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
        };
        const stemYinYang = {
            'Giáp': 'Duong', 'Ất': 'Am', 'Bính': 'Duong', 'Đinh': 'Am', 'Mậu': 'Duong',
            'Kỷ': 'Am', 'Canh': 'Duong', 'Tân': 'Am', 'Nhâm': 'Duong', 'Quý': 'Am'
        };
        const branchToElement = {
            'Tý': 'Thuy', 'Sửu': 'Tho', 'Dần': 'Moc', 'Mão': 'Moc', 'Thìn': 'Tho', 'Tỵ': 'Hoa',
            'Ngọ': 'Hoa', 'Mùi': 'Tho', 'Thân': 'Kim', 'Dậu': 'Kim', 'Tuất': 'Tho', 'Hợi': 'Thuy'
        };
        
        const dmElem = stemToElement[dayGan];
        if (!dmElem) return "Chính Quan cách";
        
        // 1. Khúc Trực cách (Mộc độc vượng)
        if ((dayGan === 'Giáp' || dayGan === 'Ất') && 
            ['Dần', 'Mão', 'Thìn'].includes(monthZhi) && 
            !allStems.includes('Canh') && !allStems.includes('Tân') && !allZhis.includes('Dậu')) {
            return "Khúc Trực cách (Mộc độc vượng)";
        }
        
        // 2. Viêm Thượng cách (Hỏa độc vượng)
        if ((dayGan === 'Bính' || dayGan === 'Đinh') && 
            ['Tỵ', 'Ngọ', 'Mùi'].includes(monthZhi) && 
            !allStems.includes('Nhâm') && !allStems.includes('Quý') && !allZhis.includes('Hợi') && !allZhis.includes('Tý')) {
            return "Viêm Thượng cách (Hỏa độc vượng)";
        }
        
        // 3. Gia Tường cách (Thổ độc vượng)
        if ((dayGan === 'Mậu' || dayGan === 'Kỷ') && 
            ['Thìn', 'Tuất', 'Sửu', 'Mùi'].includes(monthZhi) && 
            !allStems.includes('Giáp') && !allStems.includes('Ất') && !allZhis.includes('Dần') && !allZhis.includes('Mão')) {
            return "Gia Tường cách (Thổ độc vượng)";
        }
        
        // 4. Tòng Cách cách (Kim độc vượng)
        if ((dayGan === 'Canh' || dayGan === 'Tân') && 
            ['Thân', 'Dậu', 'Tuất'].includes(monthZhi) && 
            !allStems.includes('Bính') && !allStems.includes('Đinh') && !allZhis.includes('Ngọ') && !allZhis.includes('Tỵ')) {
            return "Tòng Cách cách (Kim độc vượng)";
        }
        
        // 5. Nhuận Hạ cách (Thủy độc vượng)
        if ((dayGan === 'Nhâm' || dayGan === 'Quý') && 
            ['Hợi', 'Tý', 'Thìn'].includes(monthZhi) && 
            !allStems.includes('Mậu') && !allStems.includes('Kỷ') && !allZhis.includes('Mùi') && !allZhis.includes('Tuất')) {
            return "Nhuận Hạ cách (Thủy độc vượng)";
        }
        
        // 6. Hợp hóa cách
        const checkHợpHóa = (g1, g2) => {
            const pairs = [['Giáp', 'Kỷ', 'Tho'], ['Ất', 'Canh', 'Kim'], ['Bính', 'Tân', 'Thuy'], ['Đinh', 'Nhâm', 'Moc'], ['Mậu', 'Quý', 'Hoa']];
            for (const [x, y, elem] of pairs) {
                if ((g1 === x && g2 === y) || (g1 === y && g2 === x)) return elem;
            }
            return null;
        };
        
        const mStem = canChi.month.gan;
        const hStem = canChi.hour.gan;
        let targetElem = checkHợpHóa(dayGan, mStem) || checkHợpHóa(dayGan, hStem);
        if (targetElem) {
            const mEl = branchToElement[monthZhi];
            if (mEl === targetElem || (targetElem === 'Tho' && ['Thìn', 'Tuất', 'Sửu', 'Mùi'].includes(monthZhi)) || (targetElem === 'Moc' && monthZhi === 'Hợi')) {
                const elemNames = { 'Tho': 'Thổ', 'Kim': 'Kim', 'Thuy': 'Thủy', 'Moc': 'Mộc', 'Hoa': 'Hỏa' };
                return `Hóa ${elemNames[targetElem]} cách`;
            }
        }
        
        const getRelation = (dm, other) => {
            const dmE = stemToElement[dm];
            const otherE = stemToElement[other];
            const dmYinYang = stemYinYang[dm];
            const otherYinYang = stemYinYang[other];
            
            if (dmE === otherE) {
                return dmYinYang === otherYinYang ? 'Tỷ Kiên' : 'Kiếp Tài';
            }
            
            const relMap = {
                'Kim': { 'Thuy': 'sinh', 'Moc': 'khac', 'Hoa': 'bi_khac', 'Tho': 'duoc_sinh' },
                'Moc': { 'Hoa': 'sinh', 'Tho': 'khac', 'Kim': 'bi_khac', 'Thuy': 'duoc_sinh' },
                'Thuy': { 'Moc': 'sinh', 'Hoa': 'khac', 'Tho': 'bi_khac', 'Kim': 'duoc_sinh' },
                'Hoa': { 'Tho': 'sinh', 'Kim': 'khac', 'Thuy': 'bi_khac', 'Moc': 'duoc_sinh' },
                'Tho': { 'Kim': 'sinh', 'Thuy': 'khac', 'Moc': 'bi_khac', 'Hoa': 'duoc_sinh' }
            };
            
            const rel = relMap[dmE][otherE];
            if (rel === 'duoc_sinh') return dmYinYang === otherYinYang ? 'Thiên Ấn' : 'Chính Ấn';
            if (rel === 'sinh') return dmYinYang === otherYinYang ? 'Thực Thần' : 'Thương Quan';
            if (rel === 'khac') return dmYinYang === otherYinYang ? 'Thiên Tài' : 'Chính Tài';
            if (rel === 'bi_khac') return dmYinYang === otherYinYang ? 'Thất Sát' : 'Chính Quan';
            return 'Tỷ Kiên';
        };

        // 7. Tòng Sát, Tòng Tài, Tòng Nhi
        const totalScore = Object.values(elementScore).reduce((a,b) => a+b, 0);
        const dmScore = elementScore[dmElem] || 0;
        const isVeryWeak = (dmScore / totalScore) < 0.15;
        
        if (isVeryWeak) {
            let strongest = '';
            let maxVal = 0;
            for (const [el, val] of Object.entries(elementScore)) {
                if (val > maxVal) { maxVal = val; strongest = el; }
            }
            
            const elemToStem = { 'Moc': 'Giáp', 'Hoa': 'Bính', 'Tho': 'Mậu', 'Kim': 'Canh', 'Thuy': 'Nhâm' };
            const dummyStem = elemToStem[strongest];
            const rel = getRelation(dayGan, dummyStem);
            
            if (rel === 'Thất Sát' || rel === 'Chính Quan') return "Tòng Sát cách";
            if (rel === 'Thiên Tài' || rel === 'Chính Tài') return "Tòng Tài cách";
            if (rel === 'Thực Thần' || rel === 'Thương Quan') return "Tòng Nhi cách";
        }

        // Standard Bát Cách / Kiến Lộc / Dương Nhận
        const monthHiddenStems = {
            'Tý': ['Quý'],
            'Sửu': ['Kỷ', 'Quý', 'Tân'],
            'Dần': ['Giáp', 'Bính', 'Mậu'],
            'Mão': ['Ất'],
            'Thìn': ['Mậu', 'Ất', 'Quý'],
            'Tỵ': ['Bính', 'Mậu', 'Canh'],
            'Ngọ': ['Đinh', 'Kỷ'],
            'Mùi': ['Kỷ', 'Đinh', 'Ất'],
            'Thân': ['Canh', 'Nhâm', 'Mậu'],
            'Dậu': ['Tân'],
            'Tuất': ['Mậu', 'Tân', 'Đinh'],
            'Hợi': ['Nhâm', 'Giáp']
        };

        const mtangs = monthHiddenStems[monthZhi] || [];
        for (const tang of mtangs) {
            if (exposedGans.includes(tang)) {
                const rel = getRelation(dayGan, tang);
                return `${rel} cách`;
            }
        }
        
        const mainQi = mtangs[0];
        if (mainQi) {
            const rel = getRelation(dayGan, mainQi);
            if (rel === 'Tỷ Kiên') return "Kiến Lộc cách";
            if (rel === 'Kiếp Tài') return "Dương Nhận cách";
            return `${rel} cách`;
        }
        
        return "Chính Quan cách";
    }

    analyze(dateStr, timeStr, gender = 1, dayBoundaryMode = 'midnight') { // gender: 1 (Nam), 0 (Nữ)
        // 1. Data Prep
        const [day, month, year] = dateStr.split('/').map(Number);
        const [hour, minute] = timeStr.split(':').map(Number);
        
        const genderInt = parseInt(gender) === 0 ? 0 : 1;
        const sect = dayBoundaryMode === 'zi_hour' ? 1 : 2;

        // A. local Bazi for Day and Hour
        const solarLocal = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunarLocal = solarLocal.getLunar();
        const baziLocal = lunarLocal.getEightChar();
        baziLocal.setSect(sect);

        // B. Adjusted Bazi (+1 hour for GMT+8 Beijing astronomical solar terms) for Year, Month, and Da Yun
        const solarAdjusted = solarLocal.nextHour(1);
        const lunarAdjusted = solarAdjusted.getLunar();
        const baziAdjusted = lunarAdjusted.getEightChar();
        baziAdjusted.setSect(sect);
        
        const solarTimeline = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
        const tietKhiTimeline = `${toVi(baziLocal.getTimeGan() + baziLocal.getTimeZhi())} - ${toVi(baziLocal.getDayGan() + baziLocal.getDayZhi())} - ${toVi(baziAdjusted.getMonthGan() + baziAdjusted.getMonthZhi())} - ${toVi(baziAdjusted.getYearGan() + baziAdjusted.getYearZhi())}`;

        // Standard Lunar calendar birth info (Shifts strictly at Lunar New Year Mùng 1 Tết)
        const lunarDateStr = `ngày ${lunarLocal.getDay()} tháng ${lunarLocal.getMonth()} năm ${toVi(lunarLocal.getYearInGanZhi())} Âm lịch`;
        const lunarYear = toVi(lunarLocal.getYearInGanZhi());

        // Build Da Yun
        const yun = baziAdjusted.getYun(genderInt);
        
        // rawDaYun keeps childhood cycle (Index 0) and all un-filtered items
        const rawDaYunData = yun.getDaYun().map(d => ({
            startYear: d.getStartYear(),
            startAge: d.getStartAge(),
            gan: toVi(d.getGanZhi().substring(0, 1)),
            zhi: toVi(d.getGanZhi().substring(1, 2)),
        }));

        // daYun filters out pre-Da Yun childhood cycle with empty stem-branch
        const daYunData = rawDaYunData.filter(d => d.gan && d.zhi);

        // Bóc tách Tàng can & Thập thần
        const buildPillar = (type) => {
            let gan, zhi, thapThanGan;
            let hiddenList = [];
            
            if (type === 'year') {
                gan = baziAdjusted.getYearGan();
                zhi = baziAdjusted.getYearZhi();
                thapThanGan = toThapThan(baziAdjusted.getYearShiShenGan());
                hiddenList = baziAdjusted.getYearShiShenZhi();
            }
            if (type === 'month') {
                gan = baziAdjusted.getMonthGan();
                zhi = baziAdjusted.getMonthZhi();
                thapThanGan = toThapThan(baziAdjusted.getMonthShiShenGan());
                hiddenList = baziAdjusted.getMonthShiShenZhi();
            }
            if (type === 'day') {
                gan = baziLocal.getDayGan();
                zhi = baziLocal.getDayZhi();
                thapThanGan = "Nhật Chủ";
                hiddenList = baziLocal.getDayShiShenZhi();
            }
            if (type === 'hour') {
                gan = baziLocal.getTimeGan();
                zhi = baziLocal.getTimeZhi();
                thapThanGan = toThapThan(baziLocal.getTimeShiShenGan());
                hiddenList = baziLocal.getTimeShiShenZhi();
            }

            const viZhi = toVi(zhi);
            const hiddenStemsArr = this.rules.hiddenStems[viZhi] || [];
            
            const tangCan = hiddenStemsArr.map((tGan, idx) => ({
                gan: tGan.stem || tGan,
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
                const hStem = hGan.stem || hGan;
                const hElem = this.rules.stemElement[hStem];
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
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) {
                    console.error('Invalid targetBranches:', targetBranches, 'from group:', group);
                    return;
                }
                try {
                    if (hasSubset(branchList, targetBranches)) {
                        analysis.relations[relType].push(targetBranches.join('-'));
                        
                        // Adjust scores for Special
                        const points = this.rules.scoreConfig.special[relType];
                        if (points) {
                            // Tam hop -> becomes strong element. Example Thân Tý Thìn -> Thủy
                            if (relType === 'tamHop' || relType === 'banTamHop') {
                                const domElem = this.rules.branchElement[targetBranches[1]]; // Center branch element usually defines Tam hợp
                                elementScore[domElem] += points;
                            } else if (relType === 'lucXung') {
                                // Xung deducts points for both elements equally
                                targetBranches.forEach(z => {
                                    const e = this.rules.branchElement[z];
                                    elementScore[e] += points; // points is negative (-8)
                                });
                            } else if (relType === 'lucHop') {
                                 targetBranches.forEach(z => elementScore[this.rules.branchElement[z]] += points/2);
                            } else {
                                // Hai, pha -> negative
                                targetBranches.forEach(z => elementScore[this.rules.branchElement[z]] += points/2);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error in branch relations loop:', err);
                    console.error('RelType:', relType, 'Group:', group, 'TargetBranches:', targetBranches);
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

        // Determine structure (Cách cục) based on docx rules
        analysis.cachCuc = this.determineCachCuc(dmGan, monthZhi, canChi, elementScore);

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

        // PHASE 4.5: Nguyệt Lệnh Dụng Thần
        let nguyetLenhDungThan = "";
        const mZhi = canChi.month.zhi;
        const mTangs = this.rules.hiddenStems[mZhi] || [];
        const exposedStems = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        
        const exposedTang = mTangs.filter(t => exposedStems.includes(t.stem || t));
        if (exposedTang.length > 0) {
            nguyetLenhDungThan = exposedTang[0].stem || exposedTang[0]; // Ordered by Primary first
        } else {
            if (['Tý', 'Mão', 'Dậu'].includes(mZhi)) {
                nguyetLenhDungThan = mTangs[0].stem || mTangs[0];
            } else if (mZhi === 'Ngọ') {
                if (exposedStems.includes('Kỷ')) nguyetLenhDungThan = 'Kỷ';
                else nguyetLenhDungThan = 'Đinh';
            } else {
                nguyetLenhDungThan = mTangs[0].stem || mTangs[0];
            }
        }

        return {
            solarTimeline,
            tietKhiTimeline,
            lunarDateStr,
            lunarYear,
            canChi,
            nguHanh: elementScore,
            analysis,
            dungThan,
            hyThan,
            nguyetLenhDungThan,
            daYun: daYunData, // filtered visible ones
            rawDaYun: rawDaYunData, // complete unfiltered list
            metadata: {
                timezone: "Asia/Ho_Chi_Minh",
                utcOffset: 7,
                solarTimestamp: new Date(Date.UTC(year, month - 1, day, hour, minute)).getTime()
            }
        };
    }
}

module.exports = new BaziAnalyzer();
