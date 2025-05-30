import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapBuilder from './MapBuilder';
import '@testing-library/jest-dom';

// Mock the fetch function
global.fetch = jest.fn();

// Mock utility functions
jest.mock('../utils/metrics', () => ({
  recordMapBuilderMetric: jest.fn(),
  recordUserInteraction: jest.fn(),
  recordError: jest.fn(),
  recordMapBuilderObjectCount: jest.fn(),
  measureMapBuilderOperation: jest.fn((fn) => fn()),
}));

describe('MapBuilder Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock fetch to return a successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, map_id: 'test_map' }),
    });
  });

  test('renders the MapBuilder component', () => {
    render(<MapBuilder />);
    expect(screen.getByText('Map Name')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
    expect(screen.getByText('Map Data')).toBeInTheDocument();
  });

  test('allows changing map name', () => {
    render(<MapBuilder />);
    const mapNameInput = screen.getByLabelText('Map Name');
    fireEvent.change(mapNameInput, { target: { value: 'Test Map' } });
    expect(mapNameInput).toHaveValue('Test Map');
  });

  test('calls saveMapToBackend when save button is clicked', async () => {
    const onSaveCompleteMock = jest.fn();
    render(<MapBuilder onSaveComplete={onSaveCompleteMock} />);
    
    // Find and click the Save to Server button
    const saveButton = screen.getByText('Save to Server');
    fireEvent.click(saveButton);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/maps/', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }));
    });
    
    // The success message should appear
    await waitFor(() => {
      expect(screen.getByText('Map saved successfully!')).toBeInTheDocument();
    });
    
    // onSaveComplete should be called
    expect(onSaveCompleteMock).toHaveBeenCalled();
  });

  test('shows error message when save fails', async () => {
    // Mock fetch to return an error response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to save map' }),
    });
    
    render(<MapBuilder />);
    
    // Find and click the Save to Server button
    const saveButton = screen.getByText('Save to Server');
    fireEvent.click(saveButton);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // The error message should appear
    await waitFor(() => {
      expect(screen.getByText('Failed to save map. Please try again.')).toBeInTheDocument();
    });
  });
}); 