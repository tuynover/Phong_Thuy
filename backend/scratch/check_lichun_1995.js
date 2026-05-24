const { Lunar } = require('lunar-javascript');

// In 1995, Li Chun is inside February 1995. Let's list solar terms.
const l = Lunar.fromYmd(1995, 1, 1);
const jieQiTable = l.getJieQiTable();
console.log('Jie Qi Table 1995:');
for (let name in jieQiTable) {
    console.log(`${name}: ${jieQiTable[name].toFullString()}`);
}
