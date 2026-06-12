const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: fs.createReadStream('C:/Users/cobat/.gemini/antigravity/brain/6c5f952a-33d6-4b73-9062-7ab6862592ab/.system_generated/logs/transcript.jsonl'),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    try {
        const data = JSON.parse(line);
        if (JSON.stringify(data).includes('BaziBoard.jsx')) {
            // Check for tool calls or replacements
            if (data.tool_calls) {
                for (const tc of data.tool_calls) {
                    if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
                        const argsStr = JSON.stringify(tc.args);
                        if (argsStr.includes('dayMaster') || argsStr.includes('nhật') || argsStr.includes('Nhật')) {
                            console.log(`Step ${data.step_index}: Tool ${tc.name}`);
                            if (tc.args.ReplacementContent) {
                                console.log(tc.args.ReplacementContent.substring(0, 500));
                            } else if (tc.args.ReplacementChunks) {
                                console.log(JSON.stringify(tc.args.ReplacementChunks).substring(0, 500));
                            } else if (tc.args.CodeContent) {
                                console.log(tc.args.CodeContent.substring(0, 500));
                            }
                            console.log('---');
                        }
                    }
                }
            }
        }
    } catch (e) {
        // Ignore
    }
});
