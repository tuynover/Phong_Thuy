const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://trinhtuyen2004:trinhtuyen2004@phongthuy.a5rqrhx.mongodb.net/phongthuy?appName=phongthuy';

// Import models
const User = require('../src/models/User');
const HexagramRecord = require('../src/models/HexagramRecord');
const BaziRecord = require('../src/models/BaziRecord');
const TuViRecord = require('../src/modules/tu-vi/models/TuViRecord');
const HexagramConversation = require('../src/models/HexagramConversation');
const BaziConversation = require('../src/models/BaziConversation');
const TuViConversation = require('../src/modules/tu-vi/models/TuViConversation');

async function debugAnalytics() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Let's mimic what getAnalytics does
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. '2026-06-16'
  console.log('Today string:', todayStr);

  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const endDefault = new Date(); // now

  // If parsed from query parameters:
  const queryStartDate = todayStr; // e.g. today
  const queryEndDate = todayStr; // e.g. today

  const parsedStart = new Date(queryStartDate);
  const parsedEnd = new Date(queryEndDate);

  console.log('Parsed start date:', parsedStart.toISOString());
  console.log('Parsed end date (default parsing):', parsedEnd.toISOString());

  // Let's count records created today
  const matchRangeDefault = { createdAt: { $gte: parsedStart, $lte: parsedEnd } };
  const recordsCountDefault = await HexagramRecord.countDocuments(matchRangeDefault);
  console.log('Hexagram records found with default end date (<= parsedEnd):', recordsCountDefault);

  // Let's parse with 24 hours added
  const parsedEndCorrected = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
  console.log('Corrected end date (parsedEndCorrected):', parsedEndCorrected.toISOString());

  const matchRangeCorrected = { createdAt: { $gte: parsedStart, $lte: parsedEndCorrected } };
  const recordsCountCorrected = await HexagramRecord.countDocuments(matchRangeCorrected);
  console.log('Hexagram records found with corrected end date (<= parsedEndCorrected):', recordsCountCorrected);

  // Let's find some records created today to see their timestamps
  const recentRecords = await HexagramRecord.find({ createdAt: { $gte: parsedStart } }).limit(5).lean();
  console.log('Recent records created after parsedStart:');
  for (const r of recentRecords) {
    console.log(`- ID: ${r._id}, userId: ${r.userId}, createdAt: ${r.createdAt.toISOString()}`);
  }

  await mongoose.disconnect();
}

debugAnalytics();
