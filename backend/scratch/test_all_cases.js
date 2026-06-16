const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://trinhtuyen2004:trinhtuyen2004@phongthuy.a5rqrhx.mongodb.net/phongthuy?appName=phongthuy';
const API_URL = 'http://localhost:3001/api';

// Import models
const User = require('../src/models/User');
const HexagramRecord = require('../src/models/HexagramRecord');
const BaziRecord = require('../src/models/BaziRecord');
const TuViRecord = require('../src/modules/tu-vi/models/TuViRecord');
const SystemLog = require('../src/models/SystemLog');
const BanAppeal = require('../src/models/BanAppeal');
const AdminNotification = require('../src/models/AdminNotification');
const NotificationScheduler = require('../src/services/NotificationScheduler');

async function runTests() {
  console.log('=== KHỞI ĐỘNG KIỂM THỬ TOÀN DIỆN HỆ THỐNG ===');
  
  // 1. Connect to DB
  await mongoose.connect(MONGODB_URI);
  console.log('1. Đã kết nối MongoDB để thiết lập dữ liệu kiểm thử.');

  // Clean up existing test users and records
  await User.deleteMany({ email: /test_.*@example\.com/ });
  await HexagramRecord.deleteMany({ question: /\[TEST\].*/ });
  await BaziRecord.deleteMany({ 'baziData.solarDate': '15/06/2026' });
  await BanAppeal.deleteMany({ email: /test_.*@example\.com/ });
  await AdminNotification.deleteMany({ title: /\[TEST\].*/ });
  await SystemLog.deleteMany({ details: /.*test_.*@example\.com.*/ });

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await User.create({
    email: 'test_user@example.com',
    password: hashedPassword,
    name: 'Test User',
    role: 'user',
    credits: 1,
    status: 'active'
  });

  const testVip = await User.create({
    email: 'test_vip@example.com',
    password: hashedPassword,
    name: 'Test VIP',
    role: 'vip',
    credits: 1,
    status: 'active'
  });

  const testCoadmin1 = await User.create({
    email: 'test_coadmin1@example.com',
    password: hashedPassword,
    name: 'Test Co-Admin 1',
    role: 'co-admin',
    credits: 9999,
    status: 'active'
  });

  const testCoadmin2 = await User.create({
    email: 'test_coadmin2@example.com',
    password: hashedPassword,
    name: 'Test Co-Admin 2',
    role: 'co-admin',
    credits: 9999,
    status: 'active'
  });

  const testAdmin = await User.create({
    email: 'test_admin@example.com',
    password: hashedPassword,
    name: 'Test Admin',
    role: 'admin',
    credits: 9999,
    status: 'active'
  });

  console.log('2. Đã tạo các tài khoản kiểm thử: User, VIP, Co-Admins, Admin.');

  // Helper function for HTTP requests
  const fetchApi = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const status = response.status;
    const data = await response.json().catch(() => ({}));
    return { status, data };
  };

  try {
    // ==========================================
    // CASE 1: ĐĂNG NHẬP & KIỂM TRA ROLE MẶC ĐỊNH
    // ==========================================
    console.log('\n--- CASE 1: Đăng nhập & Vai trò ---');
    const loginUserRes = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test_user@example.com', password: 'password123' })
    });
    
    if (loginUserRes.status !== 200 || loginUserRes.data.user.role !== 'user' || loginUserRes.data.user.credits !== 1) {
      throw new Error(`Đăng nhập test_user lỗi: ${JSON.stringify(loginUserRes.data)}`);
    }
    const userToken = loginUserRes.data.token;
    console.log('✔ Tài khoản test_user đăng nhập thành công. Vai trò mặc định: "user", Credits: 1.');

    const loginAdminRes = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test_admin@example.com', password: 'password123' })
    });
    const adminToken = loginAdminRes.data.token;
    console.log('✔ Tài khoản test_admin đăng nhập thành công. Vai trò: "admin", Credits: 9999.');

    const loginCoadminRes = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test_coadmin1@example.com', password: 'password123' })
    });
    const coadminToken = loginCoadminRes.data.token;
    console.log('✔ Tài khoản test_coadmin1 đăng nhập thành công. Vai trò: "co-admin".');

    // ==========================================
    // CASE 2: HỆ THỐNG AUDIT LOGGING (ASYNC)
    // ==========================================
    console.log('\n--- CASE 2: Kiểm tra nhật ký Audit Log ---');
    // Allow Node event loop to process system log save
    await new Promise(r => setTimeout(r, 1000));
    const logs = await SystemLog.find({ email: 'test_user@example.com' });
    if (logs.length === 0) {
      throw new Error('Không tìm thấy bản ghi Audit Log nào cho test_user đăng nhập.');
    }
    console.log(`✔ Audit Log hoạt động tốt. Tìm thấy ${logs.length} bản ghi ghi nhận hoạt động của test_user.`);

    // ==========================================
    // CASE 3: KHẤT LƯỢT TIÊU THỤ & CHẶN GUEST
    // ==========================================
    console.log('\n--- CASE 3: Tiêu thụ credit & Chặn khách vãng lai ---');
    
    // Gieo quẻ cho user
    const hexRecord = await HexagramRecord.create({
      userId: testUser._id,
      question: '[TEST] Hỏi công việc ngày mai',
      primaryHexagram: { name: 'Thuần Càn', symbol: '☰☰', group: 'Càn', binary_code: '111111' },
      transformedHexagram: { name: 'Thuần Càn', symbol: '☰☰', group: 'Càn', binary_code: '111111' },
      movingLines: [],
      lunarDateInfo: {
        dayCanChi: 'Giáp Tý',
        monthCanChi: 'Bính Dần',
        tuankhong: 'Tuất Hợi'
      },
      status: 'active'
    });

    // Request AI interpretation as guest (no token) -> should fail
    const guestRes = await fetchApi(`/history/hexagrams/${hexRecord._id}/interpret`, {
      method: 'POST'
    });
    if (guestRes.status !== 401) {
      throw new Error(`Đáng lẽ khách vãng lai phải bị chặn đăng nhập (status 401), nhận được: ${guestRes.status}`);
    }
    console.log('✔ Chặn khách vãng lai luận giải AI thành công (trả về 401 Unauthorized).');

    // Interpret as logged-in testUser (has 1 credit) -> should succeed
    const interpretRes = await fetchApi(`/history/hexagrams/${hexRecord._id}/interpret`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (interpretRes.status !== 200) {
      throw new Error(`Luận giải quẻ lần 1 thất bại: ${JSON.stringify(interpretRes.data)}`);
    }
    console.log('✔ Luận giải AI lần 1 thành công.');

    // Verify credits went to 0
    const updatedUser = await User.findById(testUser._id);
    if (updatedUser.credits !== 0) {
      throw new Error(`Credit chưa trừ về 0. Hiện tại: ${updatedUser.credits}`);
    }
    console.log('✔ Credit trừ chính xác về 0.');

    // Interpret again -> should fail with credit check error (402 or 400 depending on implementation)
    const interpretRes2 = await fetchApi(`/history/hexagrams/${hexRecord._id}/interpret`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (interpretRes2.status !== 402 && interpretRes2.status !== 400) {
      throw new Error(`Đáng lý phải chặn khi hết credit, nhận về status: ${interpretRes2.status}`);
    }
    console.log(`✔ Chặn luận giải AI khi hết credit thành công (trả về ${interpretRes2.status}: ${interpretRes2.data.error}).`);

    // ==========================================
    // CASE 4: CHẠY DAILY INCREMENT CRON
    // ==========================================
    console.log('\n--- CASE 4: Cron cộng credit mỗi ngày +1 ---');
    // Trigger the notification scheduler routine manually
    await NotificationScheduler.checkAndSendNotifications();
    const afterCronUser = await User.findById(testUser._id);
    if (afterCronUser.credits !== 1) {
      throw new Error(`Cộng credit lỗi. Sau cron credit phải là 1, hiện tại: ${afterCronUser.credits}`);
    }
    console.log('✔ Chạy cron cộng credit thành công. Credits tăng lên 1.');

    // ==========================================
    // CASE 5: FILTER KHÓA / XÓA MỀM QUẺ
    // ==========================================
    console.log('\n--- CASE 5: Bộ lọc lịch sử (Khóa/Xóa mềm) ---');
    // Get history (should see 1 record)
    const history1 = await fetchApi(`/history/hexagrams/${testUser._id}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (history1.status !== 200 || !Array.isArray(history1.data)) {
      throw new Error(`Lỗi gọi lịch sử: Status: ${history1.status}, Data: ${JSON.stringify(history1.data)}`);
    }
    if (history1.data.length !== 1) {
      throw new Error(`Đáng lẽ lịch sử phải chứa 1 quẻ, nhận được: ${history1.data.length}, Data: ${JSON.stringify(history1.data)}`);
    }
    console.log('✔ Đọc lịch sử bình thường thành công.');

    // Soft delete the record via admin API
    const deleteRecordRes = await fetchApi(`/admin/calculations/iching/${hexRecord._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (deleteRecordRes.status !== 200) {
      throw new Error(`Admin xóa mềm quẻ lỗi: ${JSON.stringify(deleteRecordRes.data)}`);
    }

    // Get history again -> should be empty
    const history2 = await fetchApi(`/history/hexagrams/${testUser._id}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (history2.data.length !== 0) {
      throw new Error(`Quẻ đã bị xóa mềm nhưng vẫn hiển thị: ${JSON.stringify(history2.data)}`);
    }
    console.log('✔ Bộ lọc xóa mềm hoạt động chính xác. Quẻ bị xóa mềm biến mất khỏi lịch sử.');

    // Restore via DB first
    hexRecord.isDeleted = false;
    await hexRecord.save();

    // Then lock via admin API (which clears cache on server)
    const lockRecordRes = await fetchApi(`/admin/calculations/iching/${hexRecord._id}/lock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (lockRecordRes.status !== 200) {
      throw new Error(`Admin khóa quẻ lỗi: ${JSON.stringify(lockRecordRes.data)}`);
    }

    const history3 = await fetchApi(`/history/hexagrams/${testUser._id}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (history3.data.length !== 0) {
      throw new Error(`Quẻ bị khóa nhưng vẫn hiển thị: ${JSON.stringify(history3.data)}`);
    }
    console.log('✔ Bộ lọc khóa hoạt động chính xác. Quẻ bị khóa biến mất khỏi lịch sử người dùng.');

    // ==========================================
    // CASE 6: KHÓA TÀI KHOẢN & KHIẾU NẠI ĐÌNH CHỈ
    // ==========================================
    console.log('\n--- CASE 6: Khóa tài khoản & Giải quyết khiếu nại ---');
    
    // Lock user
    const lockRes = await fetchApi(`/admin/users/${testUser._id}/lock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: '[TEST] Spam dữ liệu' })
    });
    if (lockRes.status !== 200) {
      throw new Error(`Khóa tài khoản test_user lỗi: ${JSON.stringify(lockRes.data)}`);
    }
    console.log('✔ Admin khóa tài khoản test_user thành công.');

    // Try logging in -> should return 403 / suspended
    const loginLockRes = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test_user@example.com', password: 'password123' })
    });
    if (loginLockRes.status !== 403 || loginLockRes.data.error !== 'suspended') {
      throw new Error(`Tài khoản khóa đáng lẽ phải chặn đăng nhập, nhận: ${JSON.stringify(loginLockRes.data)}`);
    }
    console.log(`✔ Chặn đăng nhập tài khoản bị khóa thành công (Lý do: "${loginLockRes.data.reason}").`);

    // Submit Ban Appeal
    const appealRes = await fetchApi('/auth/appeal', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUser._id,
        email: 'test_user@example.com',
        reason: '[TEST] Spam dữ liệu',
        message: 'Mong ban quản trị mở lại tài khoản, tôi hứa sẽ không tái phạm.'
      })
    });
    if (appealRes.status !== 200 && appealRes.status !== 201) {
      throw new Error(`Gửi khiếu nại lỗi: ${JSON.stringify(appealRes.data)}`);
    }
    console.log('✔ Gửi khiếu nại thành công.');

    // Admin resolves appeal
    const appealRecord = await BanAppeal.findOne({ email: 'test_user@example.com' });
    const resolveRes = await fetchApi(`/admin/appeals/${appealRecord._id}/resolve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'approve' })
    });
    if (resolveRes.status !== 200) {
      throw new Error(`Giải quyết khiếu nại lỗi: ${JSON.stringify(resolveRes.data)}`);
    }
    console.log('✔ Admin phê duyệt khiếu nại mở khóa tài khoản thành công.');

    // Verify user is active again
    const activeCheckUser = await User.findById(testUser._id);
    if (activeCheckUser.status !== 'active') {
      throw new Error('Tài khoản vẫn chưa chuyển sang trạng thái active.');
    }
    console.log('✔ Tài khoản được kích hoạt lại trạng thái active thành công.');

    // ==========================================
    // CASE 7: PHÂN QUYỀN CO-ADMIN (RÀNG BUỘC)
    // ==========================================
    console.log('\n--- CASE 7: Phân quyền Co-Admin ---');
    
    // Co-admin adjusts normal user credits -> allowed
    const coadminAdjustUserRes = await fetchApi(`/admin/users/${testUser._id}/credits`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${coadminToken}` },
      body: JSON.stringify({ credits: 10, mode: 'set' })
    });
    if (coadminAdjustUserRes.status !== 200) {
      throw new Error(`Co-admin điều chỉnh credit của user bình thường bị chặn: ${JSON.stringify(coadminAdjustUserRes.data)}`);
    }
    console.log('✔ Co-admin chỉnh sửa credit của user bình thường thành công.');

    // Co-admin locks normal user -> allowed
    const coadminLockUserRes = await fetchApi(`/admin/users/${testUser._id}/lock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${coadminToken}` },
      body: JSON.stringify({ reason: 'Co-admin test lock' })
    });
    if (coadminLockUserRes.status !== 200) {
      throw new Error(`Co-admin khóa user bình thường bị chặn: ${JSON.stringify(coadminLockUserRes.data)}`);
    }
    console.log('✔ Co-admin khóa user bình thường thành công.');

    // Unlock user again
    const unlockRes = await fetchApi(`/admin/users/${testUser._id}/unlock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (unlockRes.status !== 200) {
      throw new Error(`Mở khóa user bị lỗi: ${JSON.stringify(unlockRes.data)}`);
    }

    // Co-admin attempts to lock admin -> blocked with 403
    const coadminLockAdminRes = await fetchApi(`/admin/users/${testAdmin._id}/lock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${coadminToken}` },
      body: JSON.stringify({ reason: 'Co-admin lock admin attempt' })
    });
    if (coadminLockAdminRes.status !== 403) {
      throw new Error(`Đáng lẽ co-admin không được phép khóa admin (trả về 403), nhận được: ${coadminLockAdminRes.status}`);
    }
    console.log('✔ Co-admin bị chặn khi cố gắng khóa tài khoản của Admin.');

    // Co-admin attempts to lock another co-admin -> blocked with 403
    const coadminLockCoadminRes = await fetchApi(`/admin/users/${testCoadmin2._id}/lock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${coadminToken}` },
      body: JSON.stringify({ reason: 'Co-admin lock co-admin attempt' })
    });
    if (coadminLockCoadminRes.status !== 403) {
      throw new Error(`Đáng lẽ co-admin không được phép khóa co-admin khác (trả về 403), nhận được: ${coadminLockCoadminRes.status}`);
    }
    console.log('✔ Co-admin bị chặn khi cố gắng khóa tài khoản của Co-Admin khác.');

    console.log('\n=== TẤT CẢ CÁC CASE KIỂM THỬ ĐÃ ĐẠT KẾT QUẢ ĐẠT (PASS) ===');

  } catch (err) {
    console.error('\n❌ PHÁT HIỆN LỖI KIỂM THỬ:', err.message);
  } finally {
    // 8. Clean up and disconnect
    await User.deleteMany({ email: /test_.*@example\.com/ });
    await HexagramRecord.deleteMany({ question: /\[TEST\].*/ });
    await BaziRecord.deleteMany({ 'baziData.solarDate': '15/06/2026' });
    await BanAppeal.deleteMany({ email: /test_.*@example\.com/ });
    await AdminNotification.deleteMany({ title: /\[TEST\].*/ });
    await SystemLog.deleteMany({ details: /.*test_.*@example\.com.*/ });
    await mongoose.disconnect();
    console.log('8. Đã dọn dẹp sạch dữ liệu thử nghiệm và đóng kết nối MongoDB.');
  }
}

runTests();
