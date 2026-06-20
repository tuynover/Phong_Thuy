const mongoose = require('mongoose');
require('dotenv').config({ path: 't:/Phongthuy/backend/.env' });


const User = require('../backend/src/models/User');
const UserStatsService = require('../backend/src/services/UserStatsService');

async function migrate() {
  console.log('=== KHỞI CHẠY MIGRATION: CẬP NHẬT THỐNG KÊ THÀNH VIÊN ===');
  console.log('Đang kết nối cơ sở dữ liệu...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✔ Kết nối thành công tới MongoDB.');

    const users = await User.find({ isDeleted: { $ne: true } });
    console.log(`Tìm thấy ${users.length} tài khoản người dùng hoạt động.`);

    let successCount = 0;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      process.stdout.write(`[${i + 1}/${users.length}] Đang xử lý: ${user.email} (${user.name})... `);
      try {
        await UserStatsService.updateUserStats(user._id);
        console.log('✔ Xong');
        successCount++;
      } catch (err) {
        console.log(`✖ Lỗi: ${err.message}`);
      }
    }

    console.log(`\n=== KẾT QUẢ MIGRATION ===`);
    console.log(`Thành công: ${successCount}/${users.length} người dùng.`);
  } catch (error) {
    console.error('Lỗi di cư dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đóng kết nối cơ sở dữ liệu.');
  }
}

migrate();
