const SystemLog = require('../../src/modules/admin/models/SystemLog');
const AdminNotification = require('../../src/modules/admin/models/AdminNotification');
const Notification = require('../../src/modules/notification/models/Notification');

describe('MongoDB TTL Indexes for Data Retention', () => {
  test('SystemLog should define a 30-day TTL index on timestamp', () => {
    const indexes = SystemLog.schema.indexes();
    const ttlIndex = indexes.find(
      ([fields, options]) => fields.timestamp === 1 && options && options.expireAfterSeconds === 30 * 24 * 3600
    );
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1].expireAfterSeconds).toBe(2592000); // 30 days in seconds
  });

  test('AdminNotification should define a 60-day TTL index on createdAt', () => {
    const indexes = AdminNotification.schema.indexes();
    const ttlIndex = indexes.find(
      ([fields, options]) => fields.createdAt === 1 && options && options.expireAfterSeconds === 60 * 24 * 3600
    );
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1].expireAfterSeconds).toBe(5184000); // 60 days in seconds
  });

  test('Notification should define a 90-day TTL index on createdAt', () => {
    const indexes = Notification.schema.indexes();
    const ttlIndex = indexes.find(
      ([fields, options]) => fields.createdAt === 1 && options && options.expireAfterSeconds === 90 * 24 * 3600
    );
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1].expireAfterSeconds).toBe(7776000); // 90 days in seconds
  });
});
