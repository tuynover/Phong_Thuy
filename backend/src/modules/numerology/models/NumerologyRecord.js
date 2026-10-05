const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

/**
 * NumerologyRecord - Bản ghi Phong Thủy Số (Sim, Biển Số Xe, Tài Khoản Ngân Hàng)
 * Khóa chính UUIDv7, tuân thủ nghiêm ngặt chuẩn kiến trúc AGENTS.md
 */
const NumerologyRecordSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv7
    },
    userId: {
      type: String,
      default: 'guest',
      index: true
    },
    // Loại đối tượng số học: 'sim' (Điện thoại), 'plate' (Biển số xe), 'bank' (Tài khoản ngân hàng)
    type: {
      type: String,
      enum: ['sim', 'plate', 'bank'],
      required: true,
      index: true
    },
    // Chuỗi số đã chuẩn hóa chỉ giữ số hoặc ký tự liền mạch (ví dụ: '0988199199', '30A91649', '1903686888')
    targetNumber: {
      type: String,
      required: true,
      trim: true
    },
    // Chuỗi số hiển thị đẹp có định dạng phân cách (ví dụ: '0988.199.199', '30A-916.49', '1903 6868 8888')
    displayNumber: {
      type: String,
      required: true,
      trim: true
    },
    // Tên ngân hàng (nếu type === 'bank')
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    // Chế độ xem: 'quick' (Chỉ xem số) hoặc 'bazi' (Xem phối Bát tự)
    mode: {
      type: String,
      enum: ['quick', 'bazi'],
      default: 'quick',
      index: true
    },
    // Chu kỳ Tam Nguyên Cửu Vận tại thời điểm tính toán (ví dụ: 9)
    period: {
      type: Number,
      required: true
    },
    // Tên gia chủ
    ownerName: {
      type: String,
      default: 'Gia Chủ',
      trim: true
    },
    // Thông tin sinh thần (dùng khi mode === 'bazi')
    ownerBirthInfo: {
      birthDate: { type: String, default: '' },
      birthHour: { type: String, default: '' },
      gender: { type: Number, enum: [0, 1], default: 1 }, // 1: Nam, 0: Nữ
      calendarType: { type: String, default: 'solar' }
    },
    // Snapshot kết quả tính toán học thuật tĩnh đầy đủ (Rule Engine)
    analysisSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Kết quả luận giải AI chuyên sâu (nếu có)
    aiInterpretation: {
      content: { type: String, default: '' },
      sections: { type: Array, default: [] },
      generatedAt: { type: Date }
    },
    // Chia sẻ công khai (mặc định false)
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    // Xóa mềm vĩnh viễn (mặc định false)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

NumerologyRecordSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('NumerologyRecord', NumerologyRecordSchema);
