const { Solar } = require('lunar-javascript');

const analyzeHybrid = (year, month, day, hour, minute, gender = 1) => {
    // 1. Local Bazi for Day and Hour
    const solarLocal = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunarLocal = solarLocal.getLunar();
    const baziLocal = lunarLocal.getEightChar();
    
    // 2. Adjusted Bazi (+1 hour for GMT+8 Beijing time) for Year, Month, and Da Yun
    const dateAdjusted = new Date(Date.UTC(year, month - 1, day, hour, minute));
    dateAdjusted.setUTCHours(dateAdjusted.getUTCHours() + 1); // Add 1 hour to shift from GMT+7 to GMT+8
    
    const solarAdjusted = Solar.fromYmdHms(
        dateAdjusted.getUTCFullYear(),
        dateAdjusted.getUTCMonth() + 1,
        dateAdjusted.getUTCDate(),
        dateAdjusted.getUTCHours(),
        dateAdjusted.getUTCMinutes(),
        0
    );
    const lunarAdjusted = solarAdjusted.getLunar();
    const baziAdjusted = lunarAdjusted.getEightChar();
    
    const yearGan = baziAdjusted.getYearGan();
    const yearZhi = baziAdjusted.getYearZhi();
    const monthGan = baziAdjusted.getMonthGan();
    const monthZhi = baziAdjusted.getMonthZhi();
    
    const dayGan = baziLocal.getDayGan();
    const dayZhi = baziLocal.getDayZhi();
    const timeGan = baziLocal.getTimeGan();
    const timeZhi = baziLocal.getTimeZhi();
    
    const yun = baziAdjusted.getYun(gender);
    
    console.log(`Input Local Time: ${year}-${month}-${day} ${hour}:${minute}`);
    console.log(`Year: ${yearGan}${yearZhi}, Month: ${monthGan}${monthZhi}, Day: ${dayGan}${dayZhi}, Hour: ${timeGan}${timeZhi}`);
    console.log(`Da Yun starting age (First cycle):`, yun.getStartYear());
    console.log('---');
};

console.log('--- Test Transition near Li Chun 1995 (Li Chun is 14:24 VN / 15:24 BJ) ---');
// Born at 14:15 VN time (before Li Chun)
analyzeHybrid(1995, 2, 4, 14, 15);
// Born at 14:30 VN time (after Li Chun)
analyzeHybrid(1995, 2, 4, 14, 30);

console.log('--- Test Midnight Transition on Oct 14, 1995 ---');
// Born at 23:30 VN time (Day should still be Oct 14 in local clock, but in BJ it is Oct 15 00:30)
analyzeHybrid(1995, 10, 14, 23, 30);
