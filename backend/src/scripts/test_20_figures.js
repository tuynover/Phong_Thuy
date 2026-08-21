const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');

const figures = [
    { name: 'Steve Jobs', date: '24/02/1955', time: '19:15', gender: 1 },
    { name: 'Bill Gates', date: '28/10/1955', time: '21:07', gender: 1 },
    { name: 'Elon Musk', date: '28/06/1971', time: '07:30', gender: 1 },
    { name: 'Albert Einstein', date: '14/03/1879', time: '11:30', gender: 1 },
    { name: 'Marilyn Monroe', date: '01/06/1926', time: '09:30', gender: 0 },
    { name: 'Donald Trump', date: '14/06/1946', time: '10:54', gender: 1 },
    { name: 'Barack Obama', date: '04/08/1961', time: '19:24', gender: 1 },
    { name: 'Michael Jackson', date: '29/08/1958', time: '23:45', gender: 1 },
    { name: 'Bruce Lee', date: '27/11/1940', time: '07:12', gender: 1 },
    { name: 'Queen Elizabeth II', date: '21/04/1926', time: '02:40', gender: 0 },
    { name: 'Princess Diana', date: '01/07/1961', time: '19:45', gender: 0 },
    { name: 'Warren Buffett', date: '30/08/1930', time: '15:00', gender: 1 },
    { name: 'Adolf Hitler', date: '20/04/1889', time: '18:30', gender: 1 },
    { name: 'Winston Churchill', date: '30/11/1874', time: '01:30', gender: 1 },
    { name: 'Marie Curie', date: '07/11/1867', time: '12:00', gender: 0 },
    { name: 'Coco Chanel', date: '19/08/1883', time: '16:00', gender: 0 },
    { name: 'Vincent van Gogh', date: '30/03/1853', time: '11:00', gender: 1 },
    { name: 'Charlie Chaplin', date: '16/04/1889', time: '20:00', gender: 1 },
    { name: 'Mao Zedong', date: '26/12/1893', time: '08:30', gender: 1 },
    { name: 'Walt Disney', date: '05/12/1901', time: '00:35', gender: 1 }
];

console.log('--- RUNNING 20 FIGURES ANALYSIS ---');
figures.forEach((f, idx) => {
    try {
        const res = BaziAnalyzer.analyze(f.date, f.time, f.gender);
        const cc = res.canChi;
        const pYear = `${cc.year.gan} ${cc.year.zhi}`;
        const pMonth = `${cc.month.gan} ${cc.month.zhi}`;
        const pDay = `${cc.day.gan} ${cc.day.zhi}`;
        const pHour = `${cc.hour.gan} ${cc.hour.zhi}`;
        console.log(`[${idx+1}] ${f.name} (${f.date} ${f.time}) -> ${pYear} | ${pMonth} | ${pDay} | ${pHour} || Thân: ${res.analysis?.than || 'N/A'} || Cách: ${res.analysis?.cachCuc || 'N/A'}`);
    } catch (e) {
        console.error(`Error analyzing ${f.name}:`, e.message);
    }
});
