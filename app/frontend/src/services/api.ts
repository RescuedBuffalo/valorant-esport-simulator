import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import config, { debugLog } from '../config';

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
    } else if (error.request) {
      debugLog('API Error Request:', error.request);
    } else {
      debugLog('API Error Message:', error.message);
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