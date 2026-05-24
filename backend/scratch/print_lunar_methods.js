const { Solar } = require('lunar-javascript');
const s = Solar.fromYmdHms(2026, 5, 24, 12, 0, 0);
const l = s.getLunar();
console.log('Lunar keys:');
for (let p in l) {
    if (typeof l[p] === 'function') {
        console.log('Method:', p);
    }
}
