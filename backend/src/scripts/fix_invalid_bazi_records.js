require('dotenv').config();
const mongoose = require('mongoose');
const BaziRecord = require('../models/BaziRecord');
const BaziPrompts = require('../services/BaziPrompts');
const AiService = require('../services/AiService');
const { stemElementMap } = require('../shared/utils/astrologyHelpers');
const { BAZI_PROMPT_VERSION, ACTIVE_MODEL } = require('../config/ai');

async function fixInvalidRecords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected.');

        const records = await BaziRecord.find({ 'aiInterpretation.content': { $exists: true, $ne: null } });
        console.log(`Found ${records.length} records with existing AI interpretations.`);

        let fixedCount = 0;
        const stemNameMap = {
            "Giáp": ["Giáp Mộc", "Giáp Thổ", "Giáp Hỏa", "Giáp Kim", "Giáp Thủy"],
            "Ất": ["Ất Mộc"],
            "Bính": ["Bính Hỏa"],
            "Đinh": ["Đinh Hỏa"],
            "Mậu": ["Mậu Thổ"],
            "Kỷ": ["Kỷ Thổ"],
            "Canh": ["Canh Kim"],
            "Tân": ["Tân Kim"],
            "Nhâm": ["Nhâm Thủy"],
            "Quý": ["Quý Thủy"]
        };

        const allDayMasters = ["Giáp Mộc", "Ất Mộc", "Bính Hỏa", "Đinh Hỏa", "Mậu Thổ", "Kỷ Thổ", "Canh Kim", "Tân Kim", "Nhâm Thủy", "Quý Thủy"];

        for (const rec of records) {
            const dayCan = rec.baziData?.canChi?.day?.gan;
            if (!dayCan) continue;

            const expectedElement = stemElementMap(dayCan);
            const expectedFull = `${dayCan} ${expectedElement}`;
            const content = rec.aiInterpretation.content;

            // Check if Step 1 contains a WRONG Day Master (e.g. mentions "Đinh Hỏa" when dayCan is "Ất")
            const step1Match = content.match(/## BƯỚC 1[^\n]*\n+([^\n]+)/i);
            if (step1Match) {
                const firstLine = step1Match[1];
                let isMismatch = false;

                for (const dm of allDayMasters) {
                    if (dm !== expectedFull && firstLine.includes(dm)) {
                        console.log(`\n[MISMATCH DETECTED] Record ID: ${rec._id}`);
                        console.log(`- Day Can in BaziData: ${dayCan} (${expectedFull})`);
                        console.log(`- Step 1 first line generated: "${firstLine.trim()}"`);
                        isMismatch = true;
                        break;
                    }
                }

                if (isMismatch) {
                    // Clear broken interpretation
                    rec.aiInterpretation = undefined;
                    await rec.save();
                    fixedCount++;
                    console.log(`=> Cleared broken aiInterpretation for Record ${rec._id}`);
                }
            }
        }

        console.log(`\nScan complete. Cleared ${fixedCount} invalid records.`);

        // Now fix the user's specific record 01a0556e-ce45-78f7-a755-ed1286664479
        const targetRecord = await BaziRecord.findById('01a0556e-ce45-78f7-a755-ed1286664479');
        if (targetRecord) {
            console.log('\n--- RE-GENERATING INTERPRETATION FOR TARGET RECORD (01a0556e-ce45-78f7-a755-ed1286664479) ---');
            const prompt = BaziPrompts.getInterpretationPrompt(targetRecord.toObject());
            console.log('Sending newly guarded prompt to AI...');

            const streamResult = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            for await (const chunk of streamResult.stream) {
                accumulatedText += chunk.text();
            }

            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            targetRecord.aiInterpretation = {
                content: cleanedContent,
                generatedAt: new Date(),
                model: ACTIVE_MODEL,
                promptVersion: BAZI_PROMPT_VERSION,
                promptTokens: Math.ceil(prompt.length / 4),
                completionTokens: Math.ceil(cleanedContent.length / 4),
                tokensUsed: Math.ceil((prompt.length + cleanedContent.length) / 4)
            };
            await targetRecord.save();
            console.log('Successfully saved regenerated interpretation to target record!');
            console.log('\n--- FIRST 400 CHARS OF REGENERATED CONTENT ---');
            console.log(cleanedContent.substring(0, 400));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error fixing records:', err);
    }
}

fixInvalidRecords();
