const { Solar } = require('lunar-javascript');
const s = Solar.fromYmdHms(2026, 5, 24, 12, 0, 0);
const ec = s.getLunar().getEightChar();
console.log('EightChar keys:');
for (let p in ec) {
    if (typeof ec[p] === 'function') {
        console.log('Method:', p);
    }
}
