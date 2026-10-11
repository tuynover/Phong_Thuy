const fs = require('fs');
const path = require('path');

class SyncStateService {
  static getStateFilePath() {
    return path.join(__dirname, '../../../../data/dataset_train/sync_state_all.json');
  }

  static getAllState() {
    const filePath = this.getStateFilePath();
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  static getSystemState(system) {
    const allState = this.getAllState();
    return allState[system] || { lastSyncedCount: 0, lastSyncedAt: null };
  }

  static saveSystemState(system, count) {
    const filePath = this.getStateFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const allState = this.getAllState();
    allState[system] = {
      lastSyncedCount: count,
      lastSyncedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(allState, null, 2), 'utf8');
  }

  /**
   * Kiểm tra xem một phân hệ đã đến hạn đồng bộ 3 ngày hay chưa
   * @param {string} system - Tên phân hệ
   * @param {number} currentCount - Số lượng bản ghi hợp lệ hiện tại
   * @param {number} intervalDays - Số ngày giữa các chu kỳ (mặc định 3)
   */
  static isDue(system, currentCount, intervalDays = 3) {
    if (!currentCount || currentCount === 0) {
      return { isDue: false, reason: 'no_records' };
    }

    const state = this.getSystemState(system);
    if (!state.lastSyncedAt) {
      return { isDue: true, reason: 'first_run', elapsedDays: 0 };
    }

    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const lastSyncTime = new Date(state.lastSyncedAt).getTime();
    const elapsedMs = Date.now() - lastSyncTime;
    const elapsedDays = (elapsedMs / (1000 * 60 * 60 * 24)).toFixed(1);

    const isTimeExpired = elapsedMs >= intervalMs;
    const hasNewData = currentCount !== state.lastSyncedCount;

    return {
      isDue: isTimeExpired && hasNewData,
      elapsedDays,
      isTimeExpired,
      hasNewData,
      lastSyncedCount: state.lastSyncedCount,
      lastSyncedAt: state.lastSyncedAt
    };
  }
}

module.exports = SyncStateService;
