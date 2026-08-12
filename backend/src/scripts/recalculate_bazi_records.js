require('dotenv').config();
const mongoose = require('mongoose');
const BaziRecord = require('../models/BaziRecord');
const MarriageRecord = require('../models/MarriageRecord');
const BaziAnalyzer = require('../services/BaziAnalyzer');

const GUA_MAP = {
    1: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
    2: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
    3: { cung: 'Chấn', element: 'Mộc', group: 'Đông tứ mệnh' },
    4: { cung: 'Tốn', element: 'Mộc', group: 'Đông tứ mệnh' },
    5: { 
        male: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
        female: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' }
    },
    6: { cung: 'Càn', element: 'Kim', group: 'Tây tứ mệnh' },
    7: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
    8: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' },
    9: { cung: 'Ly', element: 'Hỏa', group: 'Đông tứ mệnh' }
};

const calculateMenhQuai = (solarYear, gender) => {
    let tempYear = parseInt(solarYear);
    if (isNaN(tempYear)) return null;
    
    let sum = tempYear;
    while (sum >= 10) {
        sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    
    let guaNum;
    const genderVal = parseInt(gender) === 0 ? 0 : 1;
    if (genderVal === 1) { // Male
        guaNum = 11 - sum;
        if (guaNum <= 0) guaNum += 9;
    } else { // Female
        guaNum = 4 + sum;
        while (guaNum > 9) guaNum -= 9;
    }
    
    const gua = GUA_MAP[guaNum];
    if (guaNum === 5) {
        return genderVal === 1 ? gua.male : gua.female;
    }
    return gua;
};

const getYearFromDateStr = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
        return parseInt(dateStr.split('/')[2]);
    } else if (dateStr.includes('-')) {
        return parseInt(dateStr.split('-')[0]);
    }
    return null;
};

const recalculateAllRecords = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phongthuy';
        console.log(`Connecting to MongoDB at: ${mongoUri}`);
        await mongoose.connect(mongoUri);

        // 1. Recalculate ALL BaziRecord documents (including soft-deleted ones)
        const baziRecords = await BaziRecord.find({});
        console.log(`\nFound ${baziRecords.length} BaziRecord documents in total.`);

        let baziCount = 0;
        for (const record of baziRecords) {
            const { date, time, gender, dayBoundaryMode } = record.inputInfo;
            try {
                const result = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
                const yearVal = getYearFromDateStr(date);
                result.menhQuai = calculateMenhQuai(yearVal, parseInt(gender));

                record.baziData = result;
                if (record.analysisSnapshot) {
                    record.analysisSnapshot = result;
                }

                record.markModified('baziData');
                if (record.analysisSnapshot) {
                    record.markModified('analysisSnapshot');
                }

                await record.save();
                baziCount++;
            } catch (err) {
                console.error(`Failed to recalculate BaziRecord ${record._id}:`, err);
            }
        }
        console.log(`SUCCESS: Successfully updated ${baziCount}/${baziRecords.length} BaziRecord documents!`);

        // 2. Recalculate ALL MarriageRecord documents (both male and female Bazi analysis)
        const marriageRecords = await MarriageRecord.find({});
        console.log(`\nFound ${marriageRecords.length} MarriageRecord documents in total.`);

        let marriageCount = 0;
        for (const mRecord of marriageRecords) {
            try {
                // Male Bazi
                const maleInput = mRecord.inputInfo.male;
                const maleResult = BaziAnalyzer.analyze(maleInput.date, maleInput.time, 1, 'midnight');
                const maleYearVal = getYearFromDateStr(maleInput.date);
                maleResult.menhQuai = calculateMenhQuai(maleYearVal, 1);
                mRecord.maleBaziData = maleResult;

                // Female Bazi
                const femaleInput = mRecord.inputInfo.female;
                const femaleResult = BaziAnalyzer.analyze(femaleInput.date, femaleInput.time, 0, 'midnight');
                const femaleYearVal = getYearFromDateStr(femaleInput.date);
                femaleResult.menhQuai = calculateMenhQuai(femaleYearVal, 0);
                mRecord.femaleBaziData = femaleResult;

                mRecord.markModified('maleBaziData');
                mRecord.markModified('femaleBaziData');

                await mRecord.save();
                marriageCount++;
            } catch (err) {
                console.error(`Failed to recalculate MarriageRecord ${mRecord._id}:`, err);
            }
        }
        console.log(`SUCCESS: Successfully updated ${marriageCount}/${marriageRecords.length} MarriageRecord documents!`);

        console.log('\nSUCCESS: Database recalculation migration completed successfully for all documents!');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error during database migration recalculation:', error);
        process.exit(1);
    }
};

recalculateAllRecords();
