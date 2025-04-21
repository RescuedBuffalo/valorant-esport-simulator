import axios from 'axios';

// Define the base URL for metrics API
const METRICS_API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1/metrics'
  : 'http://localhost:8000/api/v1/metrics';

/**
 * Record page load time for Prometheus metrics
 * 
 * @param page The page/route name
 * @param duration The load time in seconds
 */
export const recordPageLoadTime = async (page: string, duration: number): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/page_load`, {
      page,
      duration_seconds: duration
    });
  } catch (error) {
    console.error('Failed to record page load metrics:', error);
  }
};

/**
 * Record component render time for Prometheus metrics
 * 
 * @param component The component name
 * @param duration The render time in seconds
 */
export const recordComponentRender = async (component: string, duration: number): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/component_render`, {
      component,
      duration_seconds: duration
    });
  } catch (error) {
    console.error('Failed to record component render metrics:', error);
  }
};

/**
 * Record a user interaction for Prometheus metrics
 * 
 * @param component The component where the interaction occurred
 * @param action The action the user performed
 * @param data Optional additional data about the interaction
 */
export const recordUserInteraction = async (
  component: string, 
  action: string, 
  data?: Record<string, any>
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/user_interaction`, {
      component,
      action,
      data: data || {}
    });
  } catch (error) {
    console.error('Failed to record user interaction metrics:', error);
  }
};

/**
 * Record a MapBuilder specific metric for Prometheus
 * 
 * @param action The action performed (create, edit, save, etc.)
 * @param entityType The type of entity (area, node, boundary, etc.)
 * @param count The number of entities affected
 */
export const recordMapBuilderMetric = async (
  action: string,
  entityType: string,
  count: number = 1
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/map_builder_action`, {
      action,
      entity_type: entityType,
      count
    });
  } catch (error) {
    console.error('Failed to record map builder metrics:', error);
  }
};

/**
 * Record a frontend error for Prometheus metrics
 * 
 * @param errorType The type/category of error
 * @param location Where the error occurred
 * @param message The error message
 */
export const recordError = async (
  errorType: string,
  location: string,
  message: string
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/frontend_error`, {
      error_type: errorType,
      location,
      message
    });
  } catch (error) {
    console.error('Failed to record error metrics:', error);
  }
};

/**
 * Helper function to measure and record component rendering time
 * 
 * @param callback Function to execute and measure
 * @param componentName Name of the component being measured
 * @returns Result of the callback function
 */
export const measureComponentRender = <T>(callback: () => T, componentName: string): T => {
  const startTime = performance.now();
  const result = callback();
  const duration = (performance.now() - startTime) / 1000; // Convert to seconds
  
  // Record the metric asynchronously
  recordComponentRender(componentName, duration);
  
  return result;
}; 