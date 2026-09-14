import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook managing user rating and feedback submission for divination records.
 */
export function useRecordRating({
    recordId,
    initialRating = 0,
    initialFeedback = '',
    rateApiFn,
    onSuccess
}) {
    const [rating, setRating] = useState(initialRating || 0);
    const [feedback, setFeedback] = useState(initialFeedback || '');
    const [justRated, setJustRated] = useState(false);
    const prevIdRef = useRef(null);

    useEffect(() => {
        if (recordId !== prevIdRef.current) {
            setJustRated(false);
            prevIdRef.current = recordId;
        }
        setRating(initialRating || 0);
        setFeedback(initialFeedback || '');
    }, [recordId, initialRating, initialFeedback]);

    const handleRatingSubmit = useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!recordId || !rateApiFn) return;
        try {
            await rateApiFn(recordId, rating, feedback);
            setJustRated(true);
            if (onSuccess) {
                onSuccess(rating, feedback);
            }
        } catch (err) {
            console.error('Lỗi khi gửi đánh giá:', err);
        }
    }, [recordId, rateApiFn, rating, feedback, onSuccess]);

    return {
        rating,
        setRating,
        feedback,
        setFeedback,
        justRated,
        setJustRated,
        handleRatingSubmit
    };
}

export default useRecordRating;
