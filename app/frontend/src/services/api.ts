import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config, debugLog } from '../config';

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