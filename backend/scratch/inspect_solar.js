const { Solar, Lunar } = require('lunar-javascript');

console.log('Solar methods:');
console.log(Object.getOwnPropertyNames(Solar));
console.log(Object.getOwnPropertyNames(Solar.prototype));

console.log('\nLunar methods:');
console.log(Object.getOwnPropertyNames(Lunar));
console.log(Object.getOwnPropertyNames(Lunar.prototype));
