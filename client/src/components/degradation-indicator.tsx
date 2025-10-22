import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { gracefulDegradationService } from '@/services/gracefulDegradationService';
import { ServiceStatus } from '@shared/errorSchemas';

export const DegradationIndicator: React.FC = () => {
  const [degradationStatus, setDegradationStatus] = useState(() => 
    gracefulDegradationService.getDegradationStatus()
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDegradation = () => {
      const status = gracefulDegradationService.getDegradationStatus();
      setDegradationStatus(status);
      setIsVisible(status.isDegraded);
    };

    // Check immediately
    checkDegradation();

    // Check periodically
    const interval = setInterval(checkDegradation, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (degradationStatus.isDegraded) {
      setIsVisible(true);
      
      // Auto-hide after 10 seconds unless it's a critical degradation
      const timer = setTimeout(() => {
        if (degradationStatus.degradedServices.length <= 1) {
          setIsVisible(false);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [degradationStatus]);

  if (!isVisible || !degradationStatus.isDegraded) {
    return null;
  }

  const getIcon = () => {
    if (degradationStatus.degradedServices.includes('api')) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getSeverity = () => {
    if (degradationStatus.degradedServices.length >= 3) return 'destructive';
    if (degradationStatus.degradedServices.includes('api')) return 'destructive';
    return 'default';
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2">
      <Alert variant={getSeverity()} className="shadow-lg">
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm">
              {degradationStatus.message}
            </AlertDescription>
            {degradationStatus.degradedServices.length > 1 && (
              <div className="mt-2 text-xs opacity-75">
                Affected: {degradationStatus.degradedServices.join(', ')}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-current opacity-50 hover:opacity-100 ml-2"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </Alert>
    </div>
  );
};

// Service status indicator for admin/debugging
export const ServiceStatusIndicator: React.FC = () => {
  const [serviceHealth, setServiceHealth] = useState(() =>
    gracefulDegradationService.getAllServiceHealth()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceHealth(gracefulDegradationService.getAllServiceHealth());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
      <div className="font-semibold mb-1">Service Status</div>
      {serviceHealth.map(health => (
        <div key={health.service} className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              health.status === ServiceStatus.AVAILABLE ? 'bg-green-400' :
              health.status === ServiceStatus.DEGRADED ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
          />
          <span>{health.service}</span>
        </div>
      ))}
    </div>
  );
};