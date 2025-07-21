import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  responseTime: number;
  generationTime: number;
  cacheHitRate: number;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    generationTime: 0,
    cacheHitRate: 0
  });

  const trackGeneration = async (apiCall: () => Promise<any>) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        responseTime: duration,
        generationTime: duration,
        cacheHitRate: result.cached ? 100 : prev.cacheHitRate * 0.9 // Decay cache hit rate
      }));
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        responseTime: duration
      }));
      
      throw error;
    }
  };

  return {
    metrics,
    trackGeneration
  };
}

// Performance debugging component (only visible in development)
export function PerformanceDebugger({ metrics }: { metrics: PerformanceMetrics }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Response: {metrics.responseTime.toFixed(0)}ms</div>
      <div>Generation: {metrics.generationTime.toFixed(0)}ms</div>
      <div>Cache Hit: {metrics.cacheHitRate.toFixed(1)}%</div>
    </div>
  );
}