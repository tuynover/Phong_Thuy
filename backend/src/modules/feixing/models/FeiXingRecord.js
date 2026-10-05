const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const feiXingCellSchema = new mongoose.Schema({
  palaceKey: { type: String, required: true }, // e.g., 'KHAM', 'KHON', 'CHAN', 'TON', 'TRUNG', 'CAN', 'DOAI', 'CAN_NE', 'LY'
  palaceName: { type: String, required: true }, // 'Khảm', 'Khôn', 'Chấn', 'Tốn', 'Trung Cung', 'Càn', 'Đoài', 'Cấn', 'Ly'
  directionName: { type: String, required: true }, // 'Bắc', 'Tây Nam', 'Đông', 'Đông Nam', 'Trung Cung', 'Tây Bắc', 'Tây', 'Đông Bắc', 'Nam'
  baseStar: { type: Number, required: true }, // Sao Nguyên Đán Bàn (Lạc Thư gốc: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  periodStar: { type: Number, required: true }, // Sao Vận
  mountainStar: { type: Number, required: true }, // Sao Tọa (Sơn tinh)
  waterStar: { type: Number, required: true }, // Sao Hướng (Hướng tinh / Thủy tinh)
  mountainFlight: { type: String, enum: ['FORWARD', 'REVERSE'], default: 'FORWARD' },
  waterFlight: { type: String, enum: ['FORWARD', 'REVERSE'], default: 'FORWARD' },
  elementRelation: { type: String, default: '' }, // Tương sinh, Tương khắc, Tỷ hòa...
  auspiciousLevel: { 
    type: String, 
    enum: ['DAI_CAT', 'CAT', 'BINH', 'HUNG', 'DAI_HUNG'], 
    default: 'BINH' 
  },
  starPairMeaning: { type: String, default: '' }, // Ý nghĩa cặp Sơn - Hướng
  recommendedRooms: [{ type: String }], // 'Cửa chính', 'Phòng thờ', 'Phòng ngủ', 'Bếp', 'Vệ sinh'...
  curesAndActivators: { type: String, default: '' }, // Vật phẩm hoặc biện pháp phong thủy
  batTrachStar: { type: String, default: '' }, // Sao Bát Trạch của gia chủ tại cung này (Sinh Khí, Diên Niên, Tuyệt Mệnh...)
  batTrachType: { type: String, default: '' }, // 'CAT', 'HUNG', 'TRUNG_TINH'
  batTrachDesc: { type: String, default: '' } // Luận giải sao Bát Trạch
}, { _id: false });

const feiXingRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7
  },
  userId: {
    type: String,
    required: true,
    default: 'guest',
    index: true
  },
  ownerName: {
    type: String,
    required: true,
    default: 'Gia Chủ'
  },
  ownerBirthInfo: {
    birthDate: { type: String, default: '' },
    birthHour: { type: Number, default: null },
    gender: { type: Number, default: 1 },
    genderLabel: { type: String, default: 'Nam' },
    solarYear: { type: Number, default: null },
    cungPhi: { type: String, default: '' },
    menhNguHanh: { type: String, default: '' },
    menhTrachGroup: { type: String, default: '' },
    houseTrachGroup: { type: String, default: '' },
    isMenhTrachMatch: { type: Boolean, default: true },
    menhTrachSummary: { type: String, default: '' }
  },
  title: {
    type: String,
    default: 'Lá Số Huyền Không Phi Tinh'
  },
  buildingYear: {
    type: Number,
    default: null
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 9,
    default: 9
  },
  facingDegree: {
    type: Number,
    required: true,
    min: 0,
    max: 359.99
  },
  sittingDegree: {
    type: Number,
    required: true,
    min: 0,
    max: 359.99
  },
  facingMountain: {
    type: String,
    required: true // Ví dụ: 'Ngọ'
  },
  sittingMountain: {
    type: String,
    required: true // Ví dụ: 'Tý'
  },
  facingPalace: {
    type: String,
    required: true // 'Ly'
  },
  sittingPalace: {
    type: String,
    required: true // 'Khảm'
  },
  chartType: {
    type: String,
    enum: ['CHINH_HUONG', 'KIEM_HUONG', 'TIEU_KHONG_VONG', 'DAI_KHONG_VONG'],
    default: 'CHINH_HUONG'
  },
  isSubstitution: {
    type: Boolean,
    default: false
  },
  substitutionInfo: {
    type: String,
    default: ''
  },
  deviationDegree: {
    type: Number,
    default: 0
  },
  analysisSnapshot: {
    majorPattern: {
      type: String,
      enum: ['VUONG_SON_VUONG_HUONG', 'SONG_TINH_DAO_HUONG', 'SONG_TINH_DAO_TOA', 'THUONG_SON_HA_THUY', 'BINH_HOA'],
      default: 'BINH_HOA'
    },
    majorPatternName: { type: String, default: '' },
    majorPatternDescription: { type: String, default: '' },
    specialFormations: [{ type: String }],
    castleGate: {
      left: { palace: String, mountain: String, degree: Number, usable: Boolean, description: String },
      right: { palace: String, mountain: String, degree: Number, usable: Boolean, description: String }
    },
    grid: [feiXingCellSchema],
    sittingStarAtSitting: Number,
    waterStarAtFacing: Number,
    summaryAdvice: { type: String, default: '' }
  },
  aiInterpretation: {
    content: { type: String, default: "" },
    mode: { type: String, enum: ['standard', 'vip'], default: 'standard' },
    generatedAt: { type: Date, default: null },
    model: { type: String, default: "" },
    promptVersion: { type: String, default: "" },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 }
  },
  isGeneratingInterpretation: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: ['Huyền Không']
  }
}, {
  timestamps: true,
  versionKey: false
});

feiXingRecordSchema.index({ userId: 1, isDeleted: 1, isPinned: -1, createdAt: -1 });
feiXingRecordSchema.index({ userId: 1, tags: 1 });
feiXingRecordSchema.index({ userId: 1, "aiInterpretation.tokensUsed": 1 });
feiXingRecordSchema.index({ createdAt: 1 });
feiXingRecordSchema.index({ isDeleted: 1, status: 1, userId: 1, _id: -1 });
feiXingRecordSchema.index({ isDeleted: 1, status: 1, _id: -1 });
feiXingRecordSchema.index({ isPublic: 1, isDeleted: 1 });

module.exports = mongoose.model('FeiXingRecord', feiXingRecordSchema);
