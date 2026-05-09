const { Lunar } = require('lunar-javascript');
const now = new Date();
const lunar = Lunar.fromDate(now);

console.log('Available methods:');
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(lunar));
console.log(methods.filter(m => m.includes('InGanZhi')));

try {
    console.log('Year:', lunar.getYearInGanZhi());
    console.log('Month:', lunar.getMonthInGanZhi());
    console.log('Day:', lunar.getDayInGanZhi());
} catch (e) {
    console.log('Error with basic GanZhi:', e.message);
}

try {
    console.log('Year Exact:', lunar.getYearInGanZhiExact());
    console.log('Month Exact:', lunar.getMonthInGanZhiExact());
    console.log('Day Exact:', lunar.getDayInGanZhiExact());
} catch (e) {
    console.log('Error with Exact GanZhi:', e.message);
}

const eightChar = lunar.getEightChar();
console.log('EightChar Time:', eightChar.getTime());
