const { Solar } = require('lunar-javascript');

const solar = Solar.fromYmdHms(1995, 10, 15, 10, 0, 0);
const bazi = solar.getLunar().getEightChar();
const yun1 = bazi.getYun(1); // Male
const dayunList = yun1.getDaYun();

console.log('Da Yun items:');
dayunList.forEach((d, i) => {
    console.log(`Index ${i}:`);
    console.log(`- startYear:`, d.getStartYear());
    console.log(`- startAge:`, d.getStartAge());
    console.log(`- ganZhi:`, d.getGanZhi());
    console.log(`- prototype properties:`, Object.getOwnPropertyNames(Object.getPrototypeOf(d)));
});
