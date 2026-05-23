const { astro } = require('iztro');

try {
  const date = '2004-08-27';
  const hourIndex = 4; // Thìn (07:00 - 08:59)
  const gender = '男'; // Nam
  
  const astrolabe = astro.bySolar(date, hourIndex, gender, false, 'vi-VN');
  console.log("Gender:", astrolabe.gender);
  console.log("Solar Date:", astrolabe.solarDate);
  
  console.log("\nFull structure of Palace 4 (Phúc Đức):");
  console.log(JSON.stringify(astrolabe.palaces[4], null, 2));
} catch (e) {
  console.error(e);
}

