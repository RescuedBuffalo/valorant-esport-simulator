import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';
import { Team, MatchRequest, MatchResult, Player } from '../slices/gameSlice';

export const fetchTeamsThunk = createAsyncThunk(
  'game/fetchTeams',
  async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/teams/`);
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
  async (teamData: { name: string; region: string; tag?: string; budget?: number }) => {
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

/**
 * Helper function to sanitize player data before sending to the API
 * This ensures all numeric fields are actually numbers
 */
export function sanitizePlayerData(playerData: Partial<Player>): Partial<Player> {
  console.log('Original player data to sanitize:', JSON.stringify(playerData, null, 2));
  const sanitized = { ...playerData };
  
  // Process numeric fields
  if (sanitized.age !== undefined) {
    if (typeof sanitized.age === 'string') {
      sanitized.age = parseInt(sanitized.age, 10);
    } else if (typeof sanitized.age !== 'number') {
      sanitized.age = 18; // Default age
    } else {
      // Ensure age is an integer
      sanitized.age = Math.round(sanitized.age);
    }
  }
  
  if (sanitized.salary !== undefined) {
    if (typeof sanitized.salary === 'string') {
      sanitized.salary = parseInt(sanitized.salary, 10);
    } else if (typeof sanitized.salary !== 'number') {
      sanitized.salary = 50000; // Default salary
    } else {
      // Ensure salary is an integer, not a float
      sanitized.salary = Math.round(sanitized.salary);
    }
    console.log('Sanitized salary:', sanitized.salary, typeof sanitized.salary);
  }
  
  // Handle core stats
  if (sanitized.coreStats) {
    const coreStats = { ...sanitized.coreStats } as Record<string, number>;
    let statsChanged = false;
    
    // Ensure all stats are numbers
    Object.keys(coreStats).forEach(key => {
      const value = coreStats[key];
      if (typeof value === 'string') {
        coreStats[key] = parseFloat(value);
        statsChanged = true;
      } else if (typeof value !== 'number') {
        coreStats[key] = 50; // Default value if invalid
        statsChanged = true;
      } else if (isNaN(value)) {
        coreStats[key] = 50; // Handle NaN values
        statsChanged = true;
      }
    });
    
    // Make sure we have all the required core stats
    const requiredStats = ['aim', 'gameSense', 'movement', 'utilityUsage', 'communication', 'clutch'];
    requiredStats.forEach(stat => {
      if (coreStats[stat] === undefined) {
        coreStats[stat] = 50;
        statsChanged = true;
      }
    });
    
    if (statsChanged) {
      console.log('Core stats sanitized:', coreStats);
      sanitized.coreStats = coreStats as any;
    }
  }
  
  // Handle proficiencies
  if (sanitized.roleProficiencies) {
    const roleProficiencies = { ...sanitized.roleProficiencies } as Record<string, number>;
    
    Object.keys(roleProficiencies).forEach(key => {
      const value = roleProficiencies[key];
      if (typeof value === 'string') {
        roleProficiencies[key] = parseFloat(value);
      } else if (typeof value !== 'number' || isNaN(value)) {
        roleProficiencies[key] = 50; // Default value if invalid
      }
    });
    
    sanitized.roleProficiencies = roleProficiencies as any;
  }
  
  if (sanitized.agentProficiencies) {
    const agentProficiencies = { ...sanitized.agentProficiencies } as Record<string, number>;
    
    Object.keys(agentProficiencies).forEach(key => {
      const value = agentProficiencies[key];
      if (typeof value === 'string') {
        agentProficiencies[key] = parseFloat(value);
      } else if (typeof value !== 'number' || isNaN(value)) {
        agentProficiencies[key] = 50; // Default value if invalid
      }
    });
    
    sanitized.agentProficiencies = agentProficiencies as any;
  }
  
  // Clean up any null values that might cause issues
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key as keyof Partial<Player>] === null) {
      delete sanitized[key as keyof Partial<Player>];
    }
  });
  
  console.log('Sanitized player data:', JSON.stringify(sanitized, null, 2));
  return sanitized;
}

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
      // Thoroughly sanitize the data
      const cleanedData = sanitizePlayerData(playerData);
      
      // When sending just a core stat update, format it according to the backend expectations
      // This is to handle the common case of updating just a single stat
      let requestPayload = cleanedData;
      
      // If the only property in cleanedData is coreStats, ensure it's properly structured
      if (Object.keys(cleanedData).length === 1 && cleanedData.coreStats) {
        // Make sure coreStats is properly formatted as a dictionary of numbers
        const formattedCoreStats: Record<string, number> = {};
        
        Object.entries(cleanedData.coreStats).forEach(([key, value]) => {
          if (typeof value === 'number') {
            formattedCoreStats[key] = value;
          } else if (typeof value === 'string') {
            formattedCoreStats[key] = parseFloat(value);
          }
        });
        
        // Create a valid payload that matches the PlayerUpdate model
        requestPayload = {
          coreStats: formattedCoreStats as any // Use type assertion to avoid TypeScript errors
        };
      }
      
      // Handle salary specifically - ensure it's an integer
      if (requestPayload.salary !== undefined) {
        if (typeof requestPayload.salary === 'number') {
          requestPayload.salary = Math.round(requestPayload.salary);
        } else if (typeof requestPayload.salary === 'string') {
          requestPayload.salary = parseInt(requestPayload.salary, 10);
        }
        console.log('Final salary value before API call:', requestPayload.salary, typeof requestPayload.salary);
      }
      
      console.log(`Sending update request to ${config.API_URL}/api/v1/teams/${teamId}/players/${playerId}`);
      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('JSON error response:', errorData);
          
          if (response.status === 422) {
            console.error('Validation error details:', errorData.detail);
            return rejectWithValue(`Validation error: ${JSON.stringify(errorData.detail)}`);
          }
          
          return rejectWithValue(errorData.detail || `Failed to update player: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error('Plain text error response:', errorText);
          return rejectWithValue(`Failed to update player: ${response.status} - ${errorText}`);
        }
      }

      const responseData = await response.json();
      console.log('Successful update response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error in updatePlayerThunk:', error);
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
      // Sanitize the data first to ensure proper types
      const cleanedData = sanitizePlayerData(playerData);
      
      // Ensure salary is an integer if it exists
      if (cleanedData.salary !== undefined) {
        if (typeof cleanedData.salary === 'number') {
          cleanedData.salary = Math.round(cleanedData.salary);
        } else if (typeof cleanedData.salary === 'string') {
          cleanedData.salary = parseInt(cleanedData.salary, 10);
        }
        console.log('Final salary value for new player:', cleanedData.salary, typeof cleanedData.salary);
      }
      
      console.log(`Sending add player request to ${config.API_URL}/api/v1/teams/${teamId}/players`);
      console.log('Request payload:', JSON.stringify(cleanedData, null, 2));
      
      const response = await fetch(`${config.API_URL}/api/v1/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('JSON error response:', errorData);
          
          if (response.status === 422) {
            console.error('Validation error details:', errorData.detail);
            return rejectWithValue(`Validation error: ${JSON.stringify(errorData.detail)}`);
          }
          
          return rejectWithValue(errorData.detail || 'Failed to add player to team');
        } else {
          const errorText = await response.text();
          console.error('Plain text error response:', errorText);
          return rejectWithValue(`Failed to add player to team: ${response.status} - ${errorText}`);
        }
      }

      const responseData = await response.json();
      console.log('Successful add player response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error in addPlayerToTeamThunk:', error);
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