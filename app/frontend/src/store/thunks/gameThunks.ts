import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';
import { Team, MatchRequest, MatchResult } from '../slices/gameSlice';

export const fetchTeamsThunk = createAsyncThunk(
  'game/fetchTeams',
  async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/teams`);
      console.log('API Response:', response.data);
      // The API returns { teams: Team[] }, so we need to extract the teams array
      return response.data.teams || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }
);

export const createTeamThunk = createAsyncThunk(
  'game/createTeam',
  async (teamData: { name: string; region: string }) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/teams`, teamData);
      console.log('Create Team Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }
);

export const simulateMatchThunk = createAsyncThunk(
  'game/simulateMatch',
  async (matchRequest: MatchRequest, { rejectWithValue }) => {
    try {
      console.log('Starting match simulation request:', matchRequest);
      
      // Validate request data
      if (!matchRequest.team_a || !matchRequest.team_b) {
        console.error('Invalid match request: Missing team names');
        return rejectWithValue('Both teams must be selected');
      }

      if (matchRequest.team_a === matchRequest.team_b) {
        console.error('Invalid match request: Same team selected twice');
        return rejectWithValue('Cannot simulate match between the same team');
      }
      
      // Log the URL we're calling
      const url = `${config.API_URL}/api/v1/match/simulate`;
      console.log('Calling API endpoint:', url);
      
      // Make API request
      const response = await axios.post(url, matchRequest);
      
      console.log('Match simulation successful:', response.data);
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      console.error('Error simulating match:', error);
      
      // Extract the most informative error message possible
      let errorMessage = 'Failed to simulate match';
      
      if (error.response) {
        // Server responded with an error status
        console.error('Server response error:', error.response.data);
        
        if (typeof error.response.data === 'object' && error.response.data.detail) {
          if (typeof error.response.data.detail === 'object') {
            errorMessage = error.response.data.detail.message || JSON.stringify(error.response.data.detail);
          } else {
            errorMessage = error.response.data.detail;
          }
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Error in setting up the request
        console.error('Request setup error:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchRegionsThunk = createAsyncThunk(
  'game/fetchRegions',
  async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/regions`);
      console.log('Regions Response:', response.data);
      // The API returns { regions: string[] }, so we need to extract the regions array
      return response.data.regions || [];
    } catch (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
  }
); 