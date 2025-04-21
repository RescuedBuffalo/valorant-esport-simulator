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
 * Record MapBuilder operation performance for Prometheus metrics
 * 
 * @param operationType The type of operation being performed
 * @param durationSeconds The time taken in seconds
 */
export const recordMapBuilderPerformance = async (
  operationType: string,
  durationSeconds: number
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/map_builder_performance`, {
      operation_type: operationType,
      duration_seconds: durationSeconds
    });
  } catch (error) {
    console.error('Failed to record map builder performance metrics:', error);
  }
};

/**
 * Record MapBuilder collision detection for Prometheus metrics
 * 
 * @param result Either "hit" or "miss" to indicate collision result
 * @param count The number of collision checks
 */
export const recordMapBuilderCollision = async (
  result: 'hit' | 'miss',
  count: number = 1
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/map_builder_collision`, {
      result,
      count
    });
  } catch (error) {
    console.error('Failed to record map builder collision metrics:', error);
  }
};

/**
 * Record MapBuilder object counts for Prometheus metrics
 * 
 * @param objectCounts An object with counts of different object types
 */
export const recordMapBuilderObjectCount = async (
  objectCounts: Record<string, number>
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/map_builder_object_count`, {
      object_counts: objectCounts
    });
  } catch (error) {
    console.error('Failed to record map builder object count metrics:', error);
  }
};

/**
 * Record MapBuilder pathfinding performance for Prometheus metrics
 * 
 * @param algorithm The pathfinding algorithm used
 * @param complexity The complexity level ("low", "medium", "high")
 * @param durationSeconds The time taken in seconds
 */
export const recordMapBuilderPathfinding = async (
  algorithm: string,
  complexity: 'low' | 'medium' | 'high',
  durationSeconds: number
): Promise<void> => {
  try {
    await axios.post(`${METRICS_API_URL}/map_builder_pathfinding`, {
      algorithm,
      complexity,
      duration_seconds: durationSeconds
    });
  } catch (error) {
    console.error('Failed to record map builder pathfinding metrics:', error);
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

/**
 * Helper function to measure and record MapBuilder operation performance
 * 
 * @param callback Function to execute and measure
 * @param operationType Type of operation being performed
 * @returns Result of the callback function
 */
export const measureMapBuilderOperation = async <T>(
  callback: () => Promise<T>, 
  operationType: string
): Promise<T> => {
  const startTime = performance.now();
  const result = await callback();
  const duration = (performance.now() - startTime) / 1000; // Convert to seconds
  
  // Record the metric asynchronously
  recordMapBuilderPerformance(operationType, duration);
  
  return result;
}; 