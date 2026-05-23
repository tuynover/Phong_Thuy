const AstrologyJob = require('../models/AstrologyJob');

const jobHandlers = {};
let isWorkerRunning = false;

class JobQueueService {
  /**
   * Đăng ký handler xử lý cho từng phân hệ học thuật
   * @param {string} system 'tu_vi' | 'bat_tu' | 'kinh_dich'
   * @param {Function} handlerAsyncFn (params, updateProgress) => Promise<Object>
   */
  static registerHandler(system, handlerAsyncFn) {
    jobHandlers[system] = handlerAsyncFn;
  }

  /**
   * Tạo một công việc mới đưa vào hàng đợi
   * @param {string} system 'tu_vi' | 'bat_tu' | 'kinh_dich'
   * @param {Object} params 
   * @returns {Promise<Object>} Bản ghi Job được tạo
   */
  static async enqueue(system, params) {
    const job = await AstrologyJob.create({
      system,
      params,
      status: 'queued',
      progress: 0
    });
    
    // Kích hoạt worker xử lý ngầm (không chặn luồng request của client)
    this.startWorker();

    return job;
  }

  /**
   * Trích xuất trạng thái công việc
   * @param {string} jobId 
   * @returns {Promise<Object|null>}
   */
  static async getJobStatus(jobId) {
    return await AstrologyJob.findById(jobId).lean();
  }

  /**
   * Khởi động tiến trình xử lý ngầm tuần tự (Worker Loop)
   */
  static startWorker() {
    if (isWorkerRunning) return;
    
    isWorkerRunning = true;
    
    // Chạy ngầm lập tức
    this.workLoop().catch(err => {
      console.error("[JobQueueWorker] Fatal Error in loop:", err);
      isWorkerRunning = false;
    });
  }

  static async workLoop() {
    while (true) {
      // 1. Tìm công việc tiếp theo trong hàng đợi và khóa nguyên tử (Atomic Lock)
      // Để tránh race conditions giữa các node khi scale ngầm
      const job = await AstrologyJob.findOneAndUpdate(
        { status: 'queued' },
        { status: 'processing', progress: 5 },
        { sort: { createdAt: 1 }, new: true }
      );

      // Nếu hàng đợi rỗng, dừng worker ngầm
      if (!job) {
        isWorkerRunning = false;
        break;
      }

      console.log(`[JobQueueWorker] Bắt đầu xử lý Job: ${job._id} | Hệ thống: ${job.system}`);

      try {
        const handler = jobHandlers[job.system];
        if (!handler) {
          throw new Error(`Chưa đăng ký bộ xử lý học thuật cho hệ thống '${job.system}'`);
        }

        // Định nghĩa hàm cập nhật tiến độ ngầm
        const updateProgress = async (progressPct) => {
          await AstrologyJob.findByIdAndUpdate(job._id, { progress: progressPct });
        };

        // Thực thi handler xử lý chính (tính toán + gọi AI)
        const result = await handler(job.params, updateProgress);

        // Lưu kết quả hoàn tất thành công
        await AstrologyJob.findByIdAndUpdate(job._id, {
          status: 'completed',
          progress: 100,
          result
        });
        
        console.log(`[JobQueueWorker] Xử lý Job thành công: ${job._id}`);

      } catch (error) {
        console.error(`[JobQueueWorker] Xử lý Job thất bại: ${job._id} | Lỗi:`, error.message);
        
        // Cập nhật trạng thái thất bại
        await AstrologyJob.findByIdAndUpdate(job._id, {
          status: 'failed',
          error: error.message || 'Lỗi xử lý ngầm'
        });
      }
    }
  }
}

module.exports = JobQueueService;
