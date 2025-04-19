import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  }>;
  mvp: {
    name: string;
    stats: {
      kills: number;
      deaths: number;
      assists: number;
    };
  };
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
    simulateMatch: {
      prepare: (request: MatchRequest) => ({ payload: request }),
      reducer: (state, action: PayloadAction<MatchRequest | MatchResult>) => {
        if ('winner' in action.payload) {
          state.currentMatch = action.payload as MatchResult;
        }
        // If it's a MatchRequest, the thunk will handle it
      },
    },
    clearMatch: (state) => {
      state.currentMatch = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
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
  simulateMatch,
  clearMatch,
  setLoading,
} = gameSlice.actions;

export default gameSlice.reducer; 