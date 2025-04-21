import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config, debugLog } from '../config';

// Get the singleton metrics service instance
import { MetricsService } from './metrics';
const metrics = MetricsService.getInstance();

// Types for round simulation
export interface RoundSimulationRequest {
  team_a: string;
  team_b: string;
  map_name: string;
  round_number: number;
  economy?: {
    team_a: number;
    team_b: number;
  };
  loss_streaks?: {
    team_a: number;
    team_b: number;
  };
  agent_selections?: {
    team_a: Record<string, string>;
    team_b: Record<string, string>;
  };
}

export interface RoundEvent {
  type: string;
  description: string;
  timestamp: number;
  player_id?: string;
  player_name?: string;
  target_id?: string;
  target_name?: string;
  location?: [number, number];
  details?: Record<string, any>;
}

export interface RoundSimulationResponse {
  round_data: {
    round_number: number;
    winner: string;
    events: RoundEvent[];
    economy: {
      team_a: number;
      team_b: number;
    };
    loss_streaks: {
      team_a: number;
      team_b: number;
    };
    map_data?: any;
  };
  team_info: {
    team_a: {
      id: string;
      name: string;
      logo?: string;
      players: Array<{
        id: string;
        firstName: string;
        lastName: string;
        gamerTag: string;
        agent: string;
      }>;
    };
    team_b: {
      id: string;
      name: string;
      logo?: string;
      players: Array<{
        id: string;
        firstName: string;
        lastName: string;
        gamerTag: string;
        agent: string;
      }>;
    };
  };
}

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
    return api.post<RoundSimulationResponse>('/api/v1/matches/simulate-round', data).then((response) => response.data);
  },
};

export default ApiService; 