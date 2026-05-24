const { Lunar, Solar } = require('lunar-javascript');

const testTransit = (y, m, d, h, min) => {
    const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    console.log(`Input Time: ${h}:${min}`);
    console.log(`Day Can Chi: ${bazi.getDayGan()}${bazi.getDayZhi()}`);
    console.log(`Hour Can Chi: ${bazi.getTimeGan()}${bazi.getTimeZhi()}`);
    console.log('---');
};

console.log('--- Transitions on Oct 14-15, 1995 ---');
testTransit(1995, 10, 14, 22, 59);
testTransit(1995, 10, 14, 23, 01);
testTransit(1995, 10, 15, 0, 01);
testTransit(1995, 10, 15, 1, 01);
