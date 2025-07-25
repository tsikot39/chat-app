import React from "react";
import { performance } from "perf_hooks";
import { logger } from "@/lib/logger";

interface PerformanceMetrics {
  component: string;
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private timers: Map<string, number> = new Map();

  startTimer(id: string): void {
    this.timers.set(id, performance.now());
  }

  endTimer(
    id: string,
    component: string,
    operation: string,
    metadata?: Record<string, unknown>
  ): number {
    const startTime = this.timers.get(id);
    if (!startTime) {
      logger.warn(`Timer ${id} not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(id);

    const metric: PerformanceMetrics = {
      component,
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Log slow operations (> 100ms)
    if (duration > 100) {
      logger.warn("Slow operation detected", {
        component,
        operation,
        duration: `${duration.toFixed(2)}ms`,
        metadata,
      });
    }

    return duration;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getAverageTime(component: string, operation: string): number {
    const filtered = this.metrics.filter(
      (m) => m.component === component && m.operation === operation
    );

    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  // React hook for component performance monitoring
  usePerformanceMonitor(componentName: string) {
    const startRender = () => {
      const id = `${componentName}-render-${Date.now()}`;
      this.startTimer(id);
      return id;
    };

    const endRender = (id: string, metadata?: Record<string, unknown>) => {
      return this.endTimer(id, componentName, "render", metadata);
    };

    return { startRender, endRender };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// HOC for automatic component performance monitoring
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName?: string
) {
  const displayName =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    "Component";

  const WithPerformanceMonitoring = (props: T) => {
    const { startRender, endRender } =
      performanceMonitor.usePerformanceMonitor(displayName);

    React.useEffect(() => {
      const timerId = startRender();
      return () => {
        endRender(timerId);
      };
    });

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${displayName})`;

  return WithPerformanceMonitoring;
}

// Utility for measuring async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  component: string,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  const id = `${component}-${operationName}-${Date.now()}`;
  performanceMonitor.startTimer(id);

  try {
    const result = await operation();
    performanceMonitor.endTimer(id, component, operationName, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(id, component, operationName, {
      ...metadata,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
