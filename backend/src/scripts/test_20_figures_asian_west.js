const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');
const BaziPrompts_vNext = require('../services/BaziPrompts_vNext');

const dataset = [
    // 70% Eastern (14 figures)
    { id: 1, region: 'Asia', nation: 'Singapore', name: 'Lý Quang Diệu (Lee Kuan Yew)', date: '16/09/1923', time: '08:30', gender: 1 },
    { id: 2, region: 'Asia', nation: 'Trung Quốc', name: 'Jack Ma (Mã Vân)', date: '10/09/1964', time: '09:15', gender: 1 },
    { id: 3, region: 'Asia', nation: 'Hong Kong', name: 'Lý Gia Thành (Li Ka-shing)', date: '29/07/1928', time: '21:30', gender: 1 },
    { id: 4, region: 'Asia', nation: 'Hong Kong', name: 'Châu Nhuận Phát (Chow Yun-fat)', date: '18/05/1955', time: '06:15', gender: 1 },
    { id: 5, region: 'Asia', nation: 'Đài Loan', name: 'Đặng Lệ Quân (Teresa Teng)', date: '29/01/1953', time: '06:15', gender: 0 },
    { id: 6, region: 'Asia', nation: 'Hong Kong', name: 'Lưu Gia Linh (Carina Lau)', date: '08/12/1965', time: '18:30', gender: 0 },
    { id: 7, region: 'Asia', nation: 'Hong Kong', name: 'Trương Quốc Vinh (Leslie Cheung)', date: '12/09/1956', time: '16:30', gender: 1 },
    { id: 8, region: 'Asia', nation: 'Trung Quốc', name: 'Đặng Tiểu Bình (Deng Xiaoping)', date: '22/08/1904', time: '00:30', gender: 1 },
    { id: 9, region: 'Asia', nation: 'Trung Quốc', name: 'Tôn Trung Sơn (Sun Yat-sen)', date: '12/11/1866', time: '08:30', gender: 1 },
    { id: 10, region: 'Asia', nation: 'Trung Quốc', name: 'Từ Hi Thái Hậu (Empress Dowager Cixi)', date: '29/11/1835', time: '14:00', gender: 0 },
    { id: 11, region: 'Asia', nation: 'Trung Quốc', name: 'Càn Long Hoàng Đế (Qianlong)', date: '25/09/1711', time: '20:10', gender: 1 },
    { id: 12, region: 'Asia', nation: 'Việt Nam', name: 'Trịnh Công Sơn (Nhạc sĩ)', date: '28/02/1939', time: '15:30', gender: 1 },
    { id: 13, region: 'Asia', nation: 'Việt Nam', name: 'Nguyễn Du (Đại thi hào)', date: '03/01/1766', time: '08:30', gender: 1 },
    { id: 14, region: 'Asia', nation: 'Việt Nam', name: 'Phan Bội Châu (Chí sĩ cách mạng)', date: '26/12/1867', time: '06:30', gender: 1 },

    // 30% Western (6 figures)
    { id: 15, region: 'West', nation: 'Mỹ', name: 'Steve Jobs', date: '24/02/1955', time: '19:15', gender: 1 },
    { id: 16, region: 'West', nation: 'Mỹ', name: 'Bill Gates', date: '28/10/1955', time: '21:07', gender: 1 },
    { id: 17, region: 'West', nation: 'Mỹ/Nam Phi', name: 'Elon Musk', date: '28/06/1971', time: '07:30', gender: 1 },
    { id: 18, region: 'West', nation: 'Đức/Mỹ', name: 'Albert Einstein', date: '14/03/1879', time: '11:30', gender: 1 },
    { id: 19, region: 'West', nation: 'Anh', name: 'Princess Diana', date: '01/07/1961', time: '19:45', gender: 0 },
    { id: 20, region: 'West', nation: 'Ba Lan/Pháp', name: 'Marie Curie', date: '07/11/1867', time: '12:00', gender: 0 }
];

console.log('=== TEST 20 FIGURES (70% EASTERN / 30% WESTERN) ===\n');
dataset.forEach(item => {
    try {
        const baziData = BaziAnalyzer.analyze(item.date, item.time, item.gender);
        const cc = baziData.canChi;
        const pYear = `${cc.year.gan} ${cc.year.zhi}`;
        const pMonth = `${cc.month.gan} ${cc.month.zhi}`;
        const pDay = `${cc.day.gan} ${cc.day.zhi}`;
        const pHour = `${cc.hour.gan} ${cc.hour.zhi}`;
        console.log(`[${item.id}] [${item.region} - ${item.nation}] ${item.name} (${item.date} ${item.time})`);
        console.log(`    Tứ Trụ: ${pYear} | ${pMonth} | ${pDay} | ${pHour}`);
        console.log(`    Thân: ${baziData.analysis?.thanDegree || baziData.analysis?.than} | Cách Cục: ${baziData.analysis?.cachCuc || 'N/A'}`);
        console.log(`    Quan hệ Chi: Xung: ${baziData.analysis?.relations?.lucXung?.join(', ') || 'Không'} | Hợp: ${baziData.analysis?.relations?.lucHop?.join(', ') || 'Không'} | Tam Hợp: ${baziData.analysis?.relations?.tamHop?.join(', ') || 'Không'}`);
        console.log('------------------------------------------------------------');
    } catch (e) {
        console.error(`Error with ${item.name}:`, e.message);
    }
});
