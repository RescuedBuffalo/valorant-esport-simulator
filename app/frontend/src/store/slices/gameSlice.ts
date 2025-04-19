import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTeamsThunk, createTeamThunk, fetchRegionsThunk, simulateMatchThunk } from '../thunks/gameThunks';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  role: string;
  stats: {
    aim: number;
    game_sense: number;
    utility: number;
    leadership: number;
    clutch: number;
    [key: string]: number;
  };
  salary: number;
  form: number;
  fatigue: number;
  agent_proficiencies: {
    [key: string]: number;
  };
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
  winner: string;
  score: {
    team_a: number;
    team_b: number;
  };
  map: string;
  duration: number;
  rounds: Array<{
    winner: string;
    score: number;
    economy: {
      team_a: number;
      team_b: number;
    };
    spike_planted?: boolean;
    clutch_player?: string;
    player_credits?: Record<string, number>;
    player_loadouts?: {
      team_a: Record<string, {
        weapon: string;
        armor: boolean;
        total_spend: number;
        agent?: string;
      }>;
      team_b: Record<string, {
        weapon: string;
        armor: boolean;
        total_spend: number;
        agent?: string;
      }>;
    };
    player_agents?: Record<string, string>;
    is_pistol_round?: boolean;
    economy_log?: {
      round_number: number;
      team_a_start: number;
      team_b_start: number;
      team_a_end: number;
      team_b_end: number;
      team_a_spend: number;
      team_b_spend: number;
      team_a_reward: number;
      team_b_reward: number;
      winner: string;
      spike_planted: boolean;
      notes: string;
    };
  }>;
  mvp: {
    name: string;
    stats: {
      kills: number;
      deaths: number;
      assists: number;
    };
  };
  economy_logs?: Array<{
    round_number: number;
    team_a_start: number;
    team_b_start: number;
    team_a_end: number;
    team_b_end: number;
    team_a_spend: number;
    team_b_spend: number;
    team_a_reward: number;
    team_b_reward: number;
    winner: string;
    spike_planted: boolean;
    notes: string;
  }>;
  player_agents?: Record<string, string>;
  match_id?: string;
}

export interface MatchRequest {
  team_a: string;
  team_b: string;
}

interface GameState {
  money: number;
  reputation: number;
  currentDate: string;
  facilityLevel: number;
  regions: string[];
  teams: Team[];
  currentMatch: MatchResult | null;
  loading: boolean;
}

const initialState: GameState = {
  money: 100000,
  reputation: 50,
  currentDate: '2025-01-01T00:00:00.000Z',
  facilityLevel: 1,
  regions: [],
  teams: [],
  currentMatch: null,
  loading: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    updateMoney: (state, action: PayloadAction<number>) => {
      state.money = action.payload;
    },
    updateReputation: (state, action: PayloadAction<number>) => {
      state.reputation = action.payload;
    },
    advanceTime: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
    upgradeFacility: (state) => {
      state.facilityLevel += 1;
    },
    fetchRegions: {
      prepare: () => ({ payload: [] as string[] }),
      reducer: (state, action: PayloadAction<string[]>) => {
        state.regions = action.payload;
      },
    },
    fetchTeams: {
      prepare: () => ({ payload: [] as Team[] }),
      reducer: (state, action: PayloadAction<Team[]>) => {
        state.teams = action.payload;
      },
    },
    createTeam: (state, action: PayloadAction<Team>) => {
      // Team creation logic will be handled by thunk
    },
    clearMatch: (state) => {
      state.currentMatch = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Teams
      .addCase(fetchTeamsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeamsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload;
      })
      .addCase(fetchTeamsThunk.rejected, (state) => {
        state.loading = false;
      })
      // Create Team
      .addCase(createTeamThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTeamThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.teams.push(action.payload);
      })
      .addCase(createTeamThunk.rejected, (state) => {
        state.loading = false;
      })
      // Fetch Regions
      .addCase(fetchRegionsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRegionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload;
      })
      .addCase(fetchRegionsThunk.rejected, (state) => {
        state.loading = false;
      })
      // Simulate Match
      .addCase(simulateMatchThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(simulateMatchThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload;
      })
      .addCase(simulateMatchThunk.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { 
  updateMoney, 
  updateReputation, 
  advanceTime, 
  upgradeFacility,
  fetchRegions,
  fetchTeams,
  createTeam,
  clearMatch,
  setLoading,
} = gameSlice.actions;

export default gameSlice.reducer; 