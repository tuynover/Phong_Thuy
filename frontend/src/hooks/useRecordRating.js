import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook quản lý trạng thái và hành động đánh giá sao (Rating 1-5) & Feedback
 * Dùng chung cho cả 4 phân hệ: Bazi, Ziwei, Marriage, IChing.
 *
 * @param {Object} options
 * @param {string} [options.recordId] - ID của bản ghi hiện tại
 * @param {number} [options.initialRating=0] - Điểm đánh giá ban đầu nếu có
 * @param {string} [options.initialFeedback=''] - Nhận xét ban đầu nếu có
 * @param {Function} [options.onInvalidateHistory] - Callback cập nhật lại lịch sử khi vừa đánh giá
 */
export function useRecordRating({
  recordId = null,
  initialRating = 0,
  initialFeedback = '',
  onInvalidateHistory = null
} = {}) {
  const [rating, setRating] = useState(initialRating || 0);
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [justRated, setJustRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const prevRecordIdRef = useRef(null);

  useEffect(() => {
    if (recordId && recordId !== prevRecordIdRef.current) {
      setJustRated(false);
      setRating(initialRating || 0);
      setFeedback(initialFeedback || '');
      setRatingError('');
      prevRecordIdRef.current = recordId;
    }
  }, [recordId, initialRating, initialFeedback]);

  const submitRating = useCallback(async (rateApiFunc, targetRecordId = null) => {
    const id = targetRecordId || recordId;
    if (!id || typeof rateApiFunc !== 'function') return false;

    setIsSubmitting(true);
    setRatingError('');

    try {
      await rateApiFunc(id, rating, feedback);
      setJustRated(true);
      if (onInvalidateHistory) {
        onInvalidateHistory();
      }
      return true;
    } catch (err) {
      console.error('[useRecordRating] Submit rating failed:', err);
      setRatingError(err.response?.data?.error || err.message || 'Lỗi gửi đánh giá.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [recordId, rating, feedback, onInvalidateHistory]);

  const resetRating = useCallback(() => {
    setRating(0);
    setFeedback('');
    setJustRated(false);
    setRatingError('');
  }, []);

  return {
    rating,
    setRating,
    feedback,
    setFeedback,
    justRated,
    setJustRated,
    isSubmitting,
    ratingError,
    submitRating,
    resetRating
  };
}

export default useRecordRating;
