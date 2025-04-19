type PerformanceMetric = {
  componentName: string;
  startTime: number;
  endTime: number;
  duration: number;
};

class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static MAX_METRICS = 100;

  static startMeasure(componentName: string): number {
    return performance.now();
  }

  static endMeasure(componentName: string, startTime: number) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      componentName,
      startTime,
      endTime,
      duration,
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    console.log(
      `%cPerformance: ${componentName}`,
      'color: #9C27B0; font-weight: bold;',
      `took ${duration.toFixed(2)}ms to render`
    );

    if (duration > 16.67) { // Longer than one frame (60fps)
      console.warn(
        `%cSlow render detected in ${componentName}`,
        'color: #FFC107; font-weight: bold;',
        `(${duration.toFixed(2)}ms)`
      );
    }
  }

  static getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  static clearMetrics(): void {
    this.metrics = [];
  }

  static getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.metrics.filter(
      (metric) => metric.componentName === componentName
    );
    if (componentMetrics.length === 0) return 0;

    const totalDuration = componentMetrics.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    return totalDuration / componentMetrics.length;
  }
}

export default PerformanceMonitor; 