import { useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ message, priority = 'polite', className = '' }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      // Clear and re-add content to ensure screen readers announce it
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    />
  );
}

// Hook for managing live announcements
export function useLiveAnnouncements() {
  const announceRef = useRef<(message: string, priority?: 'polite' | 'assertive') => void>();

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current(message, priority);
    }
  };

  const LiveAnnouncementsProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentPriority, setCurrentPriority] = useState<'polite' | 'assertive'>('polite');

    announceRef.current = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      setCurrentMessage(message);
      setCurrentPriority(priority);
      
      // Clear message after announcement to allow re-announcing same message
      setTimeout(() => {
        setCurrentMessage('');
      }, 2000);
    };

    return (
      <>
        {children}
        <LiveRegion message={currentMessage} priority={currentPriority} />
      </>
    );
  };

  return { announce, LiveAnnouncementsProvider };
}