const { Solar } = require('lunar-javascript');

const getVnParts = (date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    return {
        year: parseInt(map.year),
        month: parseInt(map.month),
        day: parseInt(map.day),
        hour: parseInt(map.hour) === 24 ? 0 : parseInt(map.hour),
        minute: parseInt(map.minute),
        second: parseInt(map.second)
    };
};

const now = new Date();
const vn = getVnParts(now);
console.log('Vietnam parts:', vn);
const solar = Solar.fromYmdHms(vn.year, vn.month, vn.day, vn.hour, vn.minute, vn.second);
const lunar = solar.getLunar();
console.log('Lunar date:', lunar.toString());
