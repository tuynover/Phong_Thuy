require('dotenv').config();
const mongoose = require('mongoose');
const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const cleanOldCalculations = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phongthuy';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Threshold: July 10, 2026 00:00:00 UTC
    const cutoffDate = new Date('2026-07-10T00:00:00.000Z');
    console.log(`Deleting all calculation records created before: ${cutoffDate.toISOString()}`);

    // Query for records older than cutoff date (or dateCast for hexagrams)
    const oldIChingFilter = { $or: [{ createdAt: { $lt: cutoffDate } }, { dateCast: { $lt: cutoffDate } }] };
    const oldBaziFilter = { createdAt: { $lt: cutoffDate } };
    const oldZiweiFilter = { createdAt: { $lt: cutoffDate } };
    const oldMarriageFilter = { createdAt: { $lt: cutoffDate } };

    // Get IDs to be deleted for unlinking own records & conversations
    const oldBaziRecords = await BaziRecord.find(oldBaziFilter).select('_id').lean();
    const oldZiweiRecords = await ZiweiRecord.find(oldZiweiFilter).select('_id').lean();
    
    const oldBaziIds = oldBaziRecords.map(r => r._id.toString());
    const oldZiweiIds = oldZiweiRecords.map(r => r._id.toString());

    // 1. Delete IChing records
    const resIChing = await IChingRecord.deleteMany(oldIChingFilter);
    console.log(`Deleted ${resIChing.deletedCount} IChing/Hexagram records.`);

    // 2. Delete Bazi records
    const resBazi = await BaziRecord.deleteMany(oldBaziFilter);
    console.log(`Deleted ${resBazi.deletedCount} Bazi records.`);

    // 3. Delete Ziwei records
    const resZiwei = await ZiweiRecord.deleteMany(oldZiweiFilter);
    console.log(`Deleted ${resZiwei.deletedCount} Ziwei records.`);

    // 4. Delete Marriage records
    const resMarriage = await MarriageRecord.deleteMany(oldMarriageFilter);
    console.log(`Deleted ${resMarriage.deletedCount} Marriage records.`);

    // 5. Unlink ownBaziRecordId & ownZiweiRecordId from Users if linked to deleted IDs
    if (oldBaziIds.length > 0) {
      const resUserBazi = await User.updateMany(
        { 'baziInfo.ownBaziRecordId': { $in: oldBaziIds } },
        { $set: { 'baziInfo.ownBaziRecordId': null } }
      );
      console.log(`Unlinked ownBaziRecordId for ${resUserBazi.modifiedCount} users.`);
    }

    if (oldZiweiIds.length > 0) {
      const resUserZiwei = await User.updateMany(
        { 'baziInfo.ownZiweiRecordId': { $in: oldZiweiIds } },
        { $set: { 'baziInfo.ownZiweiRecordId': null } }
      );
      console.log(`Unlinked ownZiweiRecordId for ${resUserZiwei.modifiedCount} users.`);
    }

    // 6. Delete old Conversations & Messages linked to deleted calculations
    const resConv = await Conversation.deleteMany({ createdAt: { $lt: cutoffDate } });
    const resMsg = await Message.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`Deleted ${resConv.deletedCount} old conversations and ${resMsg.deletedCount} old messages.`);

    console.log('\nSUCCESS: All calculation records created before July 10, 2026 have been permanently deleted!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanOldCalculations();
