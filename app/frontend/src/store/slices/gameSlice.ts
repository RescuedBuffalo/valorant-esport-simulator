import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTeamsThunk, createTeamThunk, fetchRegionsThunk, simulateMatchThunk, fetchTeamByIdThunk } from '../thunks/gameThunks';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  gamerTag: string;
  age: number;
  nationality: string;
  region: string;
  primaryRole: string;
  salary: number;
  coreStats: {
    aim: number;
    gameSense: number;
    movement: number;
    utilityUsage: number;
    communication: number;
    clutch: number;
  };
  roleProficiencies: Record<string, number>;
  agentProficiencies: Record<string, number>;
  careerStats: {
    matchesPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    firstBloods: number;
    clutches: number;
    winRate: number;
    kdRatio: number;
    kdaRatio: number;
    firstBloodRate: number;
    clutchRate: number;
  };
  form?: number;
  fatigue?: number;
  morale?: number;
  isStarter?: boolean;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  region: string;
  reputation: number;
  players: Player[];
  stats: {
    wins: number;
    losses: number;
    tournaments_won: number;
    prize_money: number;
  };
}

export interface MatchResult {
  score: {
    team_a: number;
    team_b: number;
  };
  rounds: any[];
  duration: number;
  map: string;
  mvp: string;
  player_agents?: Record<string, string>;
  economy_logs?: any[];
}

export interface MatchRequest {
  team_a: string;
  team_b: string;
}

interface GameState {
  teams: Team[];
  regions: string[];
  currentTeam: Team | null;
  matchResult: MatchResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  teams: [],
  regions: [],
  currentTeam: null,
  matchResult: null,
  loading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetMatchResult: (state) => {
      state.matchResult = null;
    },
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Teams
      .addCase(fetchTeamsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsThunk.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch teams';
      })
      // Create Team
      .addCase(createTeamThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeamThunk.fulfilled, (state, action) => {
        state.teams.push(action.payload);
        state.currentTeam = action.payload;
        state.loading = false;
      })
      .addCase(createTeamThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create team';
      })
      // Fetch Regions
      .addCase(fetchRegionsThunk.fulfilled, (state, action) => {
        state.regions = action.payload;
      })
      // Simulate Match
      .addCase(simulateMatchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.matchResult = null;
      })
      .addCase(simulateMatchThunk.fulfilled, (state, action) => {
        state.matchResult = action.payload;
        state.loading = false;
      })
      .addCase(simulateMatchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to simulate match';
      })
      // Fetch Team by ID
      .addCase(fetchTeamByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamByIdThunk.fulfilled, (state, action) => {
        state.currentTeam = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch team';
      });
  },
});

export const { resetMatchResult, setCurrentTeam } = gameSlice.actions;

export default gameSlice.reducer; 