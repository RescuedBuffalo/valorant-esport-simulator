import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FranchiseDashboard from './FranchiseDashboard';
import { MetricsService } from '../services/metrics';
import axios from 'axios';

// Mock the metrics service
jest.mock('../services/metrics', () => ({
  MetricsService: {
    getInstance: jest.fn().mockReturnValue({
      trackInteraction: jest.fn(),
      trackApiCall: jest.fn(),
      trackError: jest.fn()
    })
  }
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FranchiseDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the performance API if needed
    if (!window.performance) {
      Object.defineProperty(window, 'performance', {
        value: {
          now: jest.fn().mockReturnValue(0)
        }
      });
    }
    
    // Ensure post returns a resolved promise
    mockedAxios.post.mockResolvedValue({ data: { status: 'ok' } });
  });
  
  it('renders loading state initially', () => {
    render(<FranchiseDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('renders dashboard content after loading', async () => {
    render(<FranchiseDashboard />);
    
    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Franchise Dashboard')).toBeInTheDocument();
    });
    
    // Check that dashboard sections are rendered
    expect(screen.getByText('Key Statistics')).toBeInTheDocument();
    expect(screen.getByText('Popular Maps')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    
    // Check that metrics were tracked
    const metrics = MetricsService.getInstance();
    expect(metrics.trackInteraction).toHaveBeenCalledWith('FranchiseDashboard', 'mount');
    expect(metrics.trackApiCall).toHaveBeenCalledWith(
      '/api/v1/franchise/stats',
      'GET',
      expect.any(Number),
      200
    );
  });
  
  it('handles errors correctly', async () => {
    // Override the setTimeout to execute immediately
    jest.useFakeTimers();
    
    // Force the component to error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'API error';
    
    // Mock Promise.resolve to throw an error after the timeout
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = jest.fn((cb) => {
      const error = new Error(errorMessage);
      cb(); // Execute the callback
      throw error; // Then throw the error
    }) as any;
    
    render(<FranchiseDashboard />);
    
    // Fast-forward timers
    jest.runAllTimers();
    
    // Wait for error state to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    // Verify error tracking
    const metrics = MetricsService.getInstance();
    expect(metrics.trackError).toHaveBeenCalledWith(
      'api_failure',
      expect.any(String),
      'FranchiseDashboard'
    );
    
    // Cleanup
    consoleErrorSpy.mockRestore();
    window.setTimeout = originalSetTimeout;
    jest.useRealTimers();
  });
}); 