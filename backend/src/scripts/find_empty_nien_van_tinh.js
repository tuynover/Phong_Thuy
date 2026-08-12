require('dotenv').config();
const mongoose = require('mongoose');
const BaziRecord = require('../models/BaziRecord');

const findEmptyNienVanTinh = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        
        const records = await BaziRecord.find({});
        console.log('Total records checked:', records.length);

        let emptyCount = 0;
        for (const record of records) {
            const daYun = record.baziData?.daYun || [];
            for (const yun of daYun) {
                const liuNian = yun.liuNian || [];
                for (const ln of liuNian) {
                    if (ln.year === 2031 && (!ln.nienVanTinh || ln.nienVanTinh.length === 0)) {
                        console.log(`Record ${record._id} has empty nienVanTinh for year 2031! Input name: ${record.inputInfo.name}`);
                        emptyCount++;
                    }
                }
            }
        }

        console.log(`Found ${emptyCount} records with empty nienVanTinh for year 2031.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findEmptyNienVanTinh();
