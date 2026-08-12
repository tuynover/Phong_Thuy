require('dotenv').config();
const mongoose = require('mongoose');
const BaziRecord = require('../models/BaziRecord');

const checkNienVanTinh = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        
        // Find one record
        const record = await BaziRecord.findOne({});
        if (!record) {
            console.log('No Bazi records found!');
            process.exit(0);
        }

        console.log('Checking BaziRecord ID:', record._id);
        const daYun = record.baziData.daYun;
        if (!daYun || daYun.length === 0) {
            console.log('No daYun data found!');
            process.exit(0);
        }

        const firstYun = daYun[0];
        console.log('First Da Yun cycle:', firstYun.name);
        
        const liuNian = firstYun.liuNian;
        if (!liuNian || liuNian.length === 0) {
            console.log('No liuNian data found!');
            process.exit(0);
        }

        const firstYear = liuNian[0];
        console.log(`Lưu Niên Year ${firstYear.year} (${firstYear.gan} ${firstYear.zhi}):`);
        console.log('nienVanTinh:', firstYear.nienVanTinh);
        console.log('annualShenSha:', firstYear.annualShenSha);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkNienVanTinh();
