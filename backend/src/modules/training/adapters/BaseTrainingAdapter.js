/**
 * BaseTrainingAdapter - Lớp cơ sở (Abstract Strategy) cho việc bóc tách
 * và chuẩn hóa dữ liệu huấn luyện AI của các bộ môn Phong Thủy.
 */
class BaseTrainingAdapter {
  constructor({ system, displayName, outputFileName, minOutputLength = 500 }) {
    this.system = system;
    this.displayName = displayName;
    this.outputFileName = outputFileName;
    this.minOutputLength = minOutputLength;
  }

  /**
   * Lấy Mongoose Model tương ứng của bộ môn
   * @abstract
   */
  getModel() {
    throw new Error(`[${this.constructor.name}] getModel() must be implemented.`);
  }

  /**
   * Lấy câu lệnh chỉ thị vai trò chuyên gia (Instruction)
   * @abstract
   */
  getInstruction() {
    throw new Error(`[${this.constructor.name}] getInstruction() must be implemented.`);
  }

  /**
   * Chuyển dữ liệu học thuật của bản ghi thành định dạng văn bản đầu vào (Input) cho AI
   * @abstract
   * @param {Object} record - Bản ghi Mongoose
   */
  buildTrainingInput(record) {
    throw new Error(`[${this.constructor.name}] buildTrainingInput() must be implemented.`);
  }

  /**
   * Khử trùng dữ liệu nhạy cảm PII (Tên người dùng, email, SĐT)
   * @param {string} content - Nội dung luận giải thô
   * @param {Object} record - Bản ghi gốc
   */
  sanitizeOutput(content, record) {
    if (!content || typeof content !== 'string') return '';
    let sanitized = content;

    const rawName = record?.inputInfo?.name || record?.name;
    if (rawName && typeof rawName === 'string' && rawName.trim().length > 1) {
      const escapedName = rawName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escapedName, 'gi'), 'Đương số');
    }

    // Ẩn số điện thoại Việt Nam nếu có
    sanitized = sanitized.replace(/(0|\+84)(3|5|7|8|9)[0-9]{8}/g, '09********');
    // Ẩn email nếu có
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@email.com');

    return sanitized.trim();
  }

  /**
   * Bóc tách toàn bộ bản ghi hợp lệ trong Database thành danh sách mẫu huấn luyện chuẩn
   */
  async extractSamples() {
    const Model = this.getModel();
    const records = await Model.find({
      'aiInterpretation.content': { $exists: true, $ne: '' },
      isDeleted: { $ne: true }
    }).lean();

    const samples = [];
    const instruction = this.getInstruction();

    for (const record of records) {
      const output = this.sanitizeOutput(record.aiInterpretation?.content, record);
      if (output.length < this.minOutputLength) continue;

      const input = this.buildTrainingInput(record);
      if (!input || input.trim().length === 0) continue;

      samples.push({
        system: this.system,
        discipline: this.displayName,
        instruction,
        input,
        output
      });
    }

    return {
      system: this.system,
      displayName: this.displayName,
      outputFileName: this.outputFileName,
      totalRaw: records.length,
      validCount: samples.length,
      samples
    };
  }
}

module.exports = BaseTrainingAdapter;
