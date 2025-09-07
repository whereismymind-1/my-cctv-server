import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  commentCount: number;
}

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: undefined,
    commentCount: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>();

  const updateMetrics = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;

    // Update FPS every second
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      const frameTime = deltaTime / frameCountRef.current;
      
      // Keep history for smoothing
      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 5) {
        fpsHistoryRef.current.shift();
      }
      
      // Calculate average FPS
      const avgFps = Math.round(
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
      );

      // Get memory usage if available
      let memoryUsage: number | undefined;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
      }

      setMetrics({
        fps: avgFps,
        frameTime: Math.round(frameTime * 100) / 100,
        memoryUsage,
        commentCount: document.querySelectorAll('[data-comment]').length,
      });

      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }

    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, updateMetrics]);

  return metrics;
};

// Performance monitor component
export const PerformanceMonitor: React.FC<{ show?: boolean }> = ({ show = true }) => {
  const metrics = usePerformanceMonitor(show);

  if (!show) return null;

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg font-mono text-xs z-50">
      <div className="space-y-1">
        <div className={`${getFpsColor(metrics.fps)} font-bold`}>
          FPS: {metrics.fps}
        </div>
        <div className="text-gray-300">
          Frame: {metrics.frameTime}ms
        </div>
        {metrics.memoryUsage !== undefined && (
          <div className="text-gray-300">
            Memory: {metrics.memoryUsage}MB
          </div>
        )}
        <div className="text-gray-300">
          Comments: {metrics.commentCount}
        </div>
      </div>
    </div>
  );
};