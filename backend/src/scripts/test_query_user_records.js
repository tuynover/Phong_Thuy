require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const BaziRecord = require('../models/BaziRecord');

async function inspectUserRecords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const user = await User.findOne({ email: 'cobatuoc@gmail.com' });
        console.log('--- USER INFO ---');
        if (!user) {
            console.log('User cobatuoc@gmail.com not found!');
            // Search all users containing cobatuoc
            const users = await User.find({ email: { $regex: 'cobatuoc', $options: 'i' } });
            console.log('Matching users:', users.map(u => ({ id: u._id, email: u.email, name: u.name, ownBaziRecordId: u.baziInfo?.ownBaziRecordId })));
        } else {
            console.log('User ID:', user._id);
            console.log('Email:', user.email);
            console.log('baziInfo in User profile:', user.baziInfo);
            
            const records = await BaziRecord.find({ 
                $or: [{ userId: user._id }, { userId: String(user._id) }, { 'inputInfo.name': { $regex: 'cobatuoc', $options: 'i' } }] 
            }).sort({ createdAt: -1 });

            console.log(`\n--- FOUND ${records.length} BAZI RECORDS ---`);
            for (let i = 0; i < records.length; i++) {
                const rec = records[i];
                console.log(`\n[Record ${i+1}] ID: ${rec._id}`);
                console.log(`Created at: ${rec.createdAt}`);
                console.log(`Input Info:`, rec.inputInfo);
                console.log(`Day Can: ${rec.baziData?.canChi?.day?.gan}`);
                console.log(`Day Zhi: ${rec.baziData?.canChi?.day?.zhi}`);
                console.log(`Is Own Bazi Link:`, user.baziInfo?.ownBaziRecordId === String(rec._id));
                if (rec.aiInterpretation && rec.aiInterpretation.content) {
                    const snippet = rec.aiInterpretation.content.substring(0, 300);
                    console.log(`AI Content Snippet:\n${snippet}...`);
                } else {
                    console.log(`AI Content: NONE`);
                }
            }
        }

        // Also search for any BaziRecord with "Đinh Hỏa" in aiInterpretation.content
        const dinRecord = await BaziRecord.find({ 'aiInterpretation.content': { $regex: 'Đinh Hỏa', $options: 'i' } }).sort({ createdAt: -1 }).limit(5);
        console.log(`\n--- RECORDS WITH "Đinh Hỏa" IN AI INTERPRETATION (${dinRecord.length}) ---`);
        for (const r of dinRecord) {
            console.log(`Record ID: ${r._id}, userId: ${r.userId}, Day Can: ${r.baziData?.canChi?.day?.gan}`);
            console.log(`InputInfo:`, r.inputInfo);
            console.log(`Snippet: ${r.aiInterpretation.content.substring(0, 250)}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

inspectUserRecords();
