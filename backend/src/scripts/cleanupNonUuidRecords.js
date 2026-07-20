require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const UUIDV7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GENERAL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (idStr) => {
    if (typeof idStr !== 'string') return false;
    return GENERAL_UUID_REGEX.test(idStr);
};

const cleanupNonUuidRecords = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/phongthuy';
        console.log(`[Database Cleanup] Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);
        console.log(`[Database Cleanup] Connected successfully.`);

        const collections = await mongoose.connection.db.collections();
        let totalDeleted = 0;

        for (const collection of collections) {
            const collectionName = collection.collectionName;
            console.log(`[Database Cleanup] Scanning collection: ${collectionName}...`);

            const docs = await collection.find({}, { projection: { _id: 1 } }).toArray();
            const nonUuidIds = docs
                .map(doc => doc._id)
                .filter(id => !isUuid(String(id)));

            if (nonUuidIds.length > 0) {
                const deleteResult = await collection.deleteMany({ _id: { $in: nonUuidIds } });
                console.log(`[Database Cleanup] ❌ Removed ${deleteResult.deletedCount} legacy non-UUID records from '${collectionName}'.`);
                totalDeleted += deleteResult.deletedCount;
            } else {
                console.log(`[Database Cleanup] ✅ Collection '${collectionName}' is 100% clean (all records use valid UUIDs).`);
            }
        }

        console.log(`[Database Cleanup] Finished! Total legacy non-UUID records removed: ${totalDeleted}`);
    } catch (err) {
        console.error('[Database Cleanup] Error during cleanup:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

if (require.main === module) {
    cleanupNonUuidRecords();
}

module.exports = cleanupNonUuidRecords;
