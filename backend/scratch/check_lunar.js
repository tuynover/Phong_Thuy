const { Lunar, Solar } = require('lunar-javascript');

// Born on 15 Oct 1995 (Year Stem: Ất - Yin)
// For Yin Year:
// - Male (Yin Male): Backward (Nghịch)
// - Female (Yin Female): Forward (Thuận)
const solar = Solar.fromYmdHms(1995, 10, 15, 10, 0, 0);
const bazi = solar.getLunar().getEightChar();

console.log('Year Stem (Can Năm):', bazi.getYearGan()); // Should be '乙' (Ất) which is Yin

console.log('--- Test with gender = 1 (Male) ---');
const yun1 = bazi.getYun(1);
console.log('gender 1 - isForward:', yun1.isForward()); // Should be false (Backward)
console.log('gender 1 - Start Year:', yun1.getStartYear());

console.log('--- Test with gender = 0 (Female) ---');
const yun0 = bazi.getYun(0);
console.log('gender 0 - isForward:', yun0.isForward()); // Should be true (Forward)
console.log('gender 0 - Start Year:', yun0.getStartYear());

console.log('--- Test with gender = true (Male) ---');
const yunTrue = bazi.getYun(true);
console.log('gender true - isForward:', yunTrue.isForward());
console.log('gender true - Start Year:', yunTrue.getStartYear());

console.log('--- Test with gender = false (Female) ---');
const yunFalse = bazi.getYun(false);
console.log('gender false - isForward:', yunFalse.isForward());
console.log('gender false - Start Year:', yunFalse.getStartYear());
