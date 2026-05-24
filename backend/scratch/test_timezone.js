const { Lunar, Solar, EightChar } = require('lunar-javascript');

// Let's test a date and time near a Solar Term boundary (Li Chun - Lập Xuân)
// For example, 1995 Li Chun is on Feb 4 at around 15:13 (or 14:13 in GMT+7)
// Let's print out what lunar-javascript calculates for Year/Month pillars
// at different hours on Feb 4, 1995.

const testBazi = (y, m, d, h, min) => {
    const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    console.log(`Solar: ${y}-${m}-${d} ${h}:${min}`);
    console.log(`Lunar: ${lunar.getYear()}-${lunar.getMonth()}-${lunar.getDay()}`);
    console.log(`Bazi Pillars: Year=${bazi.getYearGan()}${bazi.getYearZhi()} Month=${bazi.getMonthGan()}${bazi.getMonthZhi()} Day=${bazi.getDayGan()}${bazi.getDayZhi()} Hour=${bazi.getTimeGan()}${bazi.getTimeZhi()}`);
    console.log('---');
};

console.log('--- Transition around Li Chun 1995 ---');
testBazi(1995, 2, 4, 13, 0);
testBazi(1995, 2, 4, 14, 0);
testBazi(1995, 2, 4, 15, 0);
testBazi(1995, 2, 4, 16, 0);
