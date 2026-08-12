require('dotenv').config();
const mongoose = require('mongoose');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const IChingRecord = require('../models/IChingRecord');
const User = require('../models/User');

const clearAllRecords = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI env variable is missing!');
            process.exit(1);
        }

        console.log(`Connecting to MongoDB to clear all records...`);
        await mongoose.connect(mongoUri);

        // 1. Delete all Bazi records
        const resBazi = await BaziRecord.deleteMany({});
        console.log(`Deleted ${resBazi.deletedCount} Bazi records.`);

        // 2. Delete all Ziwei records
        const resZiwei = await ZiweiRecord.deleteMany({});
        console.log(`Deleted ${resZiwei.deletedCount} Ziwei records.`);

        // 3. Delete all Marriage records
        const resMarriage = await MarriageRecord.deleteMany({});
        console.log(`Deleted ${resMarriage.deletedCount} Marriage records.`);

        // 4. Delete all IChing records
        const resIChing = await IChingRecord.deleteMany({});
        console.log(`Deleted ${resIChing.deletedCount} IChing records.`);

        // 5. Reset all user ownBaziRecordId and ownZiweiRecordId linkage to null
        const resUser = await User.updateMany(
            {},
            { 
                $set: { 
                    'baziInfo.ownBaziRecordId': null, 
                    'baziInfo.ownZiweiRecordId': null 
                } 
            }
        );
        console.log(`Reset own chart linkages for ${resUser.modifiedCount} users.`);

        console.log('\nSUCCESS: Database successfully cleared of all calculation records!');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database records:', err);
        process.exit(1);
    }
};

clearAllRecords();
