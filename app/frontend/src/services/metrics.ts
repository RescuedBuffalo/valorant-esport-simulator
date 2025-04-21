import axios from 'axios';
import { config } from '../config';

/**
 * Metrics Service for tracking frontend performance and user interactions
 */
export class MetricsService {
  private static instance: MetricsService;
  private routeStartTime: Record<string, number> = {};
  private navigationStartTime: number = 0;
  
  private constructor() {
    // Initialize navigation timing
    this.resetNavigationTiming();
    
    // Listen for route changes with History API
    const originalPushState = window.history.pushState;
    window.history.pushState = (...args) => {
      const result = originalPushState.apply(window.history, args);
      this.handleRouteChange();
      return result;
    };
    
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', () => this.handleRouteChange());
    
    // Track errors
    window.addEventListener('error', (e) => {
      this.trackError('unhandled_error', e.message, e.filename);
    });
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackError('unhandled_promise', e.reason?.message || 'Promise rejected', 'promise');
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }
  
  /**
   * Reset navigation timing on page load
   */
  private resetNavigationTiming(): void {
    this.navigationStartTime = performance.now();
  }
  
  /**
   * Handle route changes
   */
  private handleRouteChange(): void {
    this.resetNavigationTiming();
    const path = window.location.pathname;
    this.startPageViewTiming(path);
  }
  
  /**
   * Start timing a page view
   */
  public startPageViewTiming(route: string): void {
    this.routeStartTime[route] = performance.now();
  }
  
  /**
   * End timing a page view and report the metric
   */
  public endPageViewTiming(route: string): void {
    if (this.routeStartTime[route]) {
      const duration = (performance.now() - this.routeStartTime[route]) / 1000; // Convert to seconds
      this.trackPageLoadTime(route, duration);
      delete this.routeStartTime[route];
    }
  }
  
  /**
   * Track API call duration
   */
  public trackApiCall(endpoint: string, method: string, durationMs: number, status: number): void {
    this.sendMetric('api_call', {
      endpoint,
      method,
      duration_seconds: durationMs / 1000,
      status
    });
  }
  
  /**
   * Track page load time
   */
  public trackPageLoadTime(page: string, durationSeconds: number): void {
    this.sendMetric('page_load_time', {
      page,
      duration_seconds: durationSeconds
    });
  }
  
  /**
   * Track errors
   */
  public trackError(errorType: string, message: string, location: string): void {
    this.sendMetric('error', {
      error_type: errorType,
      message,
      location
    });
  }
  
  /**
   * Track user interactions
   */
  public trackInteraction(component: string, action: string, details?: Record<string, any>): void {
    this.sendMetric('user_interaction', {
      component,
      action,
      ...details
    });
  }
  
  /**
   * Send metric to backend
   */
  private sendMetric(type: string, data: Record<string, any>): void {
    // Don't send metrics in development unless explicitly enabled
    if (!config.DEBUG || config.ENABLE_DEV_METRICS) {
      axios.post(`${config.API_URL}/api/v1/metrics/${type}`, data)
        .catch(error => {
          // Silently fail on metrics errors to avoid impacting user experience
          if (config.DEBUG) {
            console.warn('Failed to send metric:', error);
          }
        });
    }
  }
} 