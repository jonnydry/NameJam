import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-900/90 text-yellow-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <WifiOff className="w-5 h-5" />
      <div>
        <p className="font-medium">You're offline</p>
        <p className="text-sm text-yellow-200">Some features may not work properly</p>
      </div>
    </div>
  );
};