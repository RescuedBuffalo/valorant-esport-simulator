import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config, debugLog } from '../config';
import { RoundSimulationRequest, RoundSimulationResponse } from '../types/api.types';

// Re-export types for convenience
export type { RoundSimulationRequest, RoundSimulationResponse, RoundEvent } from '../types/api.types';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    debugLog('API Request:', config.method?.toUpperCase(), config.url);
    debugLog('API Request URL:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    debugLog('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    debugLog('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      debugLog('API Error Response:', error.response.status, error.response.data);
      debugLog('API Error URL:', error.config?.url);
      debugLog('API Error Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    } else if (error.request) {
      debugLog('API Error Request:', error.request);
      debugLog('API Error Config:', error.config);
    } else {
      debugLog('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Generic API Service for making HTTP requests
 */
const ApiService = {
  /**
   * Makes a GET request to the API
   */
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.get<T>(url, config).then((response) => response.data);
  },

  /**
   * Makes a POST request to the API
   */
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.post<T>(url, data, config).then((response) => response.data);
  },

  /**
   * Makes a PUT request to the API
   */
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.put<T>(url, data, config).then((response) => response.data);
  },

  /**
   * Makes a DELETE request to the API
   */
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete<T>(url, config).then((response) => response.data);
  },

  /**
   * Simulates a single round with detailed events
   */
  simulateRound: (data: RoundSimulationRequest): Promise<RoundSimulationResponse> => {
    console.log('Simulating round with data:', data);
    console.log('API URL:', config.API_URL);
    return api.post<RoundSimulationResponse>('/api/v1/matches/simulate-round', data)
      .then((response) => {
        console.log('Simulation successful, response:', response.data);
        return response.data;
      })
      .catch((error) => {
        console.error('Simulation error:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
        if (error.config) {
          console.error('Full URL:', `${error.config.baseURL}${error.config.url}`);
        }
        throw error;
      });
  },
};

export default ApiService; 