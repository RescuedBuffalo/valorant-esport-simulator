import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import config, { debugLog } from '../config';
import { MetricsService } from './metrics';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get metrics service instance
const metrics = MetricsService.getInstance();

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Add request start time for measuring duration
    config.metadata = { startTime: Date.now() };
    debugLog('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    debugLog('API Request Error:', error);
    // Track API request errors
    metrics.trackError('api_request', error.message, 'request_interceptor');
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    debugLog('API Response:', response.status, response.config.url);
    
    // Calculate request duration
    const requestDuration = Date.now() - (response.config.metadata?.startTime || Date.now());
    
    // Track API call
    if (response.config.url) {
      metrics.trackApiCall(
        response.config.url,
        response.config.method?.toUpperCase() || 'UNKNOWN',
        requestDuration,
        response.status
      );
    }
    
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      debugLog('API Error Response:', error.response.status, error.response.data);
      
      // Calculate request duration
      const requestDuration = Date.now() - (error.config?.metadata?.startTime || Date.now());
      
      // Track API error
      if (error.config?.url) {
        metrics.trackApiCall(
          error.config.url,
          error.config.method?.toUpperCase() || 'UNKNOWN', 
          requestDuration,
          error.response.status
        );
        
        metrics.trackError(
          'api_response', 
          `${error.response.status}: ${error.message}`,
          error.config.url
        );
      }
    } else if (error.request) {
      debugLog('API Error Request:', error.request);
      metrics.trackError('api_no_response', error.message, error.config?.url || 'unknown');
    } else {
      debugLog('API Error Message:', error.message);
      metrics.trackError('api_config', error.message, 'config_error');
    }
    return Promise.reject(error);
  }
);

/**
 * Generic API Service for making HTTP requests
 */
export const ApiService = {
  /**
   * Makes a GET request to the API
   * @param url - The URL to make the request to
   * @param config - Optional axios config
   * @returns A promise that resolves to the response data
   */
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.get<T>(url, config).then((response) => response.data);
  },

  /**
   * Makes a POST request to the API
   * @param url - The URL to make the request to
   * @param data - The data to send in the request body
   * @param config - Optional axios config
   * @returns A promise that resolves to the response data
   */
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.post<T>(url, data, config).then((response) => response.data);
  },

  /**
   * Makes a PUT request to the API
   * @param url - The URL to make the request to
   * @param data - The data to send in the request body
   * @param config - Optional axios config
   * @returns A promise that resolves to the response data
   */
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.put<T>(url, data, config).then((response) => response.data);
  },

  /**
   * Makes a DELETE request to the API
   * @param url - The URL to make the request to
   * @param config - Optional axios config
   * @returns A promise that resolves to the response data
   */
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete<T>(url, config).then((response) => response.data);
  },
};

export default ApiService; 