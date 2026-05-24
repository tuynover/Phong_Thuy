const { Solar } = require('lunar-javascript');
const s = Solar.fromYmdHms(2026, 5, 24, 12, 0, 0);
console.log('Solar keys:', Object.keys(s));
console.log('Solar string representation:', s.toString());
for (let p in s) {
    if (typeof s[p] === 'function') {
        console.log('Method:', p);
    }
}
