const { Solar } = require('lunar-javascript');

const solar = Solar.fromYmdHms(1995, 10, 14, 23, 30, 0);
const lunar = solar.getLunar();
const b1 = lunar.getEightChar();
console.log('Original Sect:', b1.getSect());
console.log('Original Day:', b1.getDayGan() + b1.getDayZhi());
console.log('Original Hour:', b1.getTimeGan() + b1.getTimeZhi());

console.log('--- Setting Sect 2 ---');
b1.setSect(2);
console.log('New Sect:', b1.getSect());
console.log('New Day:', b1.getDayGan() + b1.getDayZhi());
console.log('New Hour:', b1.getTimeGan() + b1.getTimeZhi());

console.log('--- Setting Sect 1 ---');
b1.setSect(1);
console.log('New Sect:', b1.getSect());
console.log('New Day:', b1.getDayGan() + b1.getDayZhi());
console.log('New Hour:', b1.getTimeGan() + b1.getTimeZhi());
