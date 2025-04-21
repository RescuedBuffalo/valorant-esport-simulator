import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchLeaguesThunk, 
  createLeagueThunk, 
  fetchLeagueByIdThunk,
  updateLeagueThunk,
  addTeamToLeagueThunk,
  removeTeamFromLeagueThunk,
  createCircuitThunk,
  fetchCircuitsThunk
} from '../thunks/leagueThunks';
import { Team } from './gameSlice';

// Types
export interface Circuit {
  id: string;
  name: string;
  description?: string;
  league_id: string;
  season: number;
  stage: string;
  prize_pool: number;
  format?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  region: string;
  prize_pool: number;
  tier: number;
  logo_url?: string;
  max_teams: number;
  seasons_per_year: number;
  current_season: number;
  active: boolean;
  format?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  team_count: number;
  player_count: number;
  teams?: Team[];
  circuits?: Circuit[];
}

export interface LeagueState {
  leagues: League[];
  currentLeague: League | null;
  circuits: Circuit[];
  loading: boolean;
  error: string | null;
}

const initialState: LeagueState = {
  leagues: [],
  currentLeague: null,
  circuits: [],
  loading: false,
  error: null,
};

const leagueSlice = createSlice({
  name: 'league',
  initialState,
  reducers: {
    resetCurrentLeague: (state) => {
      state.currentLeague = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leagues
      .addCase(fetchLeaguesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaguesThunk.fulfilled, (state, action) => {
        state.leagues = action.payload;
        state.loading = false;
      })
      .addCase(fetchLeaguesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch leagues';
      })
      
      // Create League
      .addCase(createLeagueThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeagueThunk.fulfilled, (state, action) => {
        state.leagues.push(action.payload);
        state.currentLeague = action.payload;
        state.loading = false;
      })
      .addCase(createLeagueThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create league';
      })
      
      // Fetch League by ID
      .addCase(fetchLeagueByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagueByIdThunk.fulfilled, (state, action) => {
        state.currentLeague = action.payload;
        state.loading = false;
        
        // Update the league in the leagues array if it exists
        const index = state.leagues.findIndex(league => league.id === action.payload.id);
        if (index !== -1) {
          state.leagues[index] = action.payload;
        }
      })
      .addCase(fetchLeagueByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch league';
      })
      
      // Update League
      .addCase(updateLeagueThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeagueThunk.fulfilled, (state, action) => {
        const updatedLeague = action.payload;
        // Update in leagues array
        const index = state.leagues.findIndex(league => league.id === updatedLeague.id);
        if (index !== -1) {
          state.leagues[index] = updatedLeague;
        }
        // Update current league if it's the same ID
        if (state.currentLeague && state.currentLeague.id === updatedLeague.id) {
          state.currentLeague = updatedLeague;
        }
        state.loading = false;
      })
      .addCase(updateLeagueThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update league';
      })
      
      // Add Team to League
      .addCase(addTeamToLeagueThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTeamToLeagueThunk.fulfilled, (state, action) => {
        // We need to refresh the league data to see the updated teams
        state.loading = false;
      })
      .addCase(addTeamToLeagueThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add team to league';
      })
      
      // Remove Team from League
      .addCase(removeTeamFromLeagueThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeTeamFromLeagueThunk.fulfilled, (state, action) => {
        // We need to refresh the league data to see the updated teams
        state.loading = false;
      })
      .addCase(removeTeamFromLeagueThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove team from league';
      })
      
      // Create Circuit
      .addCase(createCircuitThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCircuitThunk.fulfilled, (state, action) => {
        state.circuits.push(action.payload);
        
        // If the current league is the parent of this circuit, add it to the circuits array
        if (state.currentLeague && state.currentLeague.id === action.payload.league_id) {
          if (!state.currentLeague.circuits) {
            state.currentLeague.circuits = [];
          }
          state.currentLeague.circuits.push(action.payload);
        }
        
        state.loading = false;
      })
      .addCase(createCircuitThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create circuit';
      })
      
      // Fetch Circuits
      .addCase(fetchCircuitsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCircuitsThunk.fulfilled, (state, action) => {
        state.circuits = action.payload;
        state.loading = false;
      })
      .addCase(fetchCircuitsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch circuits';
      })
  },
});

export const { resetCurrentLeague } = leagueSlice.actions;
export default leagueSlice.reducer; 