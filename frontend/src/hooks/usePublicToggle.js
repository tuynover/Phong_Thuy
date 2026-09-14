import { useState, useEffect, useCallback } from 'react';
import { togglePublicCalculation } from '@/services/api';

/**
 * Custom hook managing the public/private sharing toggle and toast notifications.
 */
export function usePublicToggle({
    moduleType,
    moduleLabel = '',
    recordId,
    initialIsPublic = false,
    onSuccess,
    onInvalidateHistory
}) {
    const [isPublic, setIsPublic] = useState(!!initialIsPublic);
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        setIsPublic(!!initialIsPublic);
    }, [initialIsPublic, recordId]);

    const handleTogglePublic = useCallback(async () => {
        if (!recordId) return;
        try {
            const newStatus = !isPublic;
            await togglePublicCalculation(moduleType, recordId, newStatus);
            setIsPublic(newStatus);
            setToastMsg(`Đã ${newStatus ? 'bật' : 'tắt'} chia sẻ công khai ${moduleLabel || 'bản ghi'}!`);
            if (onInvalidateHistory) onInvalidateHistory();
            if (onSuccess) onSuccess(newStatus);
        } catch (err) {
            console.error(`Lỗi khi đổi trạng thái công khai ${moduleType}:`, err);
            setToastMsg('Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại sau.');
        }
    }, [moduleType, moduleLabel, recordId, isPublic, onSuccess, onInvalidateHistory]);

    return {
        isPublic,
        setIsPublic,
        toastMsg,
        setToastMsg,
        handleTogglePublic
    };
}

export default usePublicToggle;
