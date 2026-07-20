const mongoose = require('mongoose');

/**
 * Execute work inside a Mongoose ACID Transaction session.
 * Automatically handles commit and abort on error.
 * Includes fallback for standalone local MongoDB instances and disconnected test environments.
 * 
 * @param {Function} workFn - Async function (session) => Promise<any>
 * @returns {Promise<any>} Result of workFn
 */
const runInTransaction = async (workFn) => {
  // Fallback immediately if MongoDB is not connected (e.g. unit tests or offline)
  if (mongoose.connection.readyState !== 1) {
    return await workFn(null);
  }

  let session;
  try {
    session = await mongoose.startSession();
  } catch (sessionErr) {
    // If startSession fails (e.g. standalone server without replica set), fallback gracefully
    return await workFn(null);
  }

  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      // Ignore abort errors if transaction was never started or already aborted
    }

    // Fallback for standalone single-node local MongoDB (development)
    const errStr = error.message || '';
    if (
      errStr.includes('Transaction numbers are only allowed') ||
      errStr.includes('replica set') ||
      errStr.includes('standalone')
    ) {
      return await workFn(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = { runInTransaction };
