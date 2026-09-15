import { useState, useEffect } from 'react';

/**
 * Custom hook phát hiện trạng thái mạng online / offline của trình duyệt
 * @returns {{ isOnline: boolean, wasOffline: boolean, resetWasOffline: () => void }}
 */
export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetWasOffline = () => setWasOffline(false);

  return { isOnline, wasOffline, resetWasOffline };
}
