import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';
import { Team, MatchRequest, MatchResult, Player } from '../slices/gameSlice';

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

export const fetchRegionsThunk = createAsyncThunk(
  'game/fetchRegions', 
  async () => {
    // This could be fetched from an API endpoint in the future
    return ['NA', 'EU', 'APAC', 'BR', 'LATAM'];
  }
);

export const simulateMatchThunk = createAsyncThunk(
  'game/simulateMatch',
  async (matchRequest: MatchRequest) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/matches/simulate`, matchRequest);
      console.log('Simulate Match Response:', response.data);
      return response.data as MatchResult;
    } catch (error) {
      console.error('Error simulating match:', error);
      throw error;
    }
  }
);

export const fetchTeamByIdThunk = createAsyncThunk(
  'game/fetchTeamById',
  async (teamId: string) => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/teams/${teamId}`);
      console.log('Fetch Team Response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching team with ID ${teamId}:`, error);
      throw error;
    }
  }
);

// Add thunks for team and player updates
export const updateTeamThunk = createAsyncThunk(
  'game/updateTeam',
  async ({ 
    teamId, 
    teamData 
  }: { 
    teamId: string; 
    teamData: Partial<Team> 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.detail || 'Failed to update team');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to update team: ' + error);
    }
  }
);

export const updatePlayerThunk = createAsyncThunk(
  'game/updatePlayer',
  async ({ 
    teamId, 
    playerId, 
    playerData 
  }: { 
    teamId: string; 
    playerId: string; 
    playerData: Partial<Player> 
  }, { rejectWithValue }) => {
    try {
      // Clean up the playerData object to ensure proper formatting
      // Convert numeric string values to actual numbers
      const cleanedData = { ...playerData };
      
      // Handle potential string-to-number conversions
      if (typeof cleanedData.age === 'string') {
        cleanedData.age = parseInt(cleanedData.age as string, 10);
      }
      
      if (typeof cleanedData.salary === 'string') {
        cleanedData.salary = parseInt(cleanedData.salary as string, 10);
      }
      
      // Handle core stats numeric conversions
      if (cleanedData.coreStats) {
        const coreStats = cleanedData.coreStats as Record<string, any>;
        Object.keys(coreStats).forEach(key => {
          const value = coreStats[key];
          if (typeof value === 'string') {
            coreStats[key] = parseFloat(value);
          }
        });
      }
      
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          return rejectWithValue(errorData.detail || `Failed to update player: ${response.status}`);
        } else {
          const errorText = await response.text();
          return rejectWithValue(`Failed to update player: ${response.status} - ${errorText}`);
        }
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to update player: ' + error);
    }
  }
);

export const addPlayerToTeamThunk = createAsyncThunk(
  'game/addPlayerToTeam',
  async ({ 
    teamId, 
    playerData 
  }: { 
    teamId: string; 
    playerData: Partial<Player> 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.detail || 'Failed to add player to team');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to add player to team: ' + error);
    }
  }
);

export const removePlayerFromTeamThunk = createAsyncThunk(
  'game/removePlayerFromTeam',
  async ({ 
    teamId, 
    playerId 
  }: { 
    teamId: string; 
    playerId: string; 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.detail || 'Failed to remove player from team');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to remove player from team: ' + error);
    }
  }
); 