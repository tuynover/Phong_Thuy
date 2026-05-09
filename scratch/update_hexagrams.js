const fs = require('fs');

const hexagramsJson = JSON.parse(fs.readFileSync('t:/Phongthuy/backend/src/data/hexagrams.json', 'utf8'));
const frontendCodePath = 't:/Phongthuy/frontend/src/data/hexagrams.js';
let frontendCode = fs.readFileSync(frontendCodePath, 'utf8');

const oldDictRegex = /export const hexagramDictionary = (\{[\s\S]*?\});/m;
const match = frontendCode.match(oldDictRegex);

let oldDict = {};
if (match) {
    try {
        oldDict = eval('(' + match[1] + ')');
    } catch(e) {
        console.error('Error parsing old dict', e);
    }
}

const newDict = {};
for (const hex of hexagramsJson) {
    const oldEntry = oldDict[hex.binary_code] || {};
    newDict[hex.binary_code] = {
        number: hex.id,
        name: hex.name,
        type: oldEntry.type || 'Bình Hòa',
        summary: oldEntry.summary || 'Chưa có thông tin',
        image: oldEntry.image || '...',
        desc: oldEntry.desc || '...'
    };
}

let newContent = 'export const hexagramDictionary = {\n';
for (const [code, data] of Object.entries(newDict)) {
    newContent += `  "${code}": {\n`;
    newContent += `    "number": ${data.number},\n`;
    newContent += `    "name": "${data.name}",\n`;
    newContent += `    "type": "${data.type}",\n`;
    newContent += `    "summary": "${data.summary}",\n`;
    newContent += `    "image": "${data.image}",\n`;
    newContent += `    "desc": ${JSON.stringify(data.desc)}\n`;
    newContent += `  },\n\n`;
}
newContent += '};\n';

fs.writeFileSync(frontendCodePath, newContent);
console.log('Successfully updated frontend hexagrams.js');
