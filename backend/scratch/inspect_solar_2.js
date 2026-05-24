const { Solar } = require('lunar-javascript');
const s = Solar.fromYmdHms(2026, 5, 24, 12, 0, 0);
console.log('Solar instance methods:');
let proto = Object.getPrototypeOf(s);
console.log(Object.getOwnPropertyNames(proto));
if (Object.getPrototypeOf(proto)) {
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(proto)));
}
