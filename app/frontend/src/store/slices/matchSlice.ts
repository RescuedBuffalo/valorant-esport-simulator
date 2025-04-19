import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface PlayerState {
  id: string;
  position: Position;
  rotation: number;
  health: number;
  armor: number;
  weapon: string;
  abilities: Record<string, boolean>;
}

interface RoundState {
  roundNumber: number;
  timeRemaining: number;
  spikeState: 'carried' | 'planted' | 'defused' | 'dropped';
  spikePosition: Position | null;
  spikeTimer: number | null;
}

interface Round {
  winner: 'team_a' | 'team_b';
  economy: {
    team_a: number;
    team_b: number;
  };
  spike_planted: boolean;
  clutch_player?: string;
}

interface MatchResult {
  score: {
    team_a: number;
    team_b: number;
  };
  map: string;
  duration: number;
  rounds: Round[];
}

export interface MatchState {
  isActive: boolean;
  map: string;
  score: {
    attackers: number;
    defenders: number;
  };
  round: RoundState;
  players: Record<string, PlayerState>;
  spectatorMode: boolean;
  spectatedPlayerId: string | null;
  currentMatch: MatchResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchState = {
  isActive: false,
  map: '',
  score: {
    attackers: 0,
    defenders: 0,
  },
  round: {
    roundNumber: 0,
    timeRemaining: 100,
    spikeState: 'carried',
    spikePosition: null,
    spikeTimer: null,
  },
  players: {},
  spectatorMode: false,
  spectatedPlayerId: null,
  currentMatch: null,
  loading: false,
  error: null,
};

export const simulateMatch = createAsyncThunk(
  'match/simulate',
  async ({ teamA, teamB }: { teamA: string; teamB: string }) => {
    const response = await axios.post(`${config.API_URL}/api/v1/matches/simulate`, {
      team_a: teamA,
      team_b: teamB,
    });
    return response.data;
  }
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    startMatch: (state, action: PayloadAction<string>) => {
      state.isActive = true;
      state.map = action.payload;
    },
    endMatch: (state) => {
      state.isActive = false;
    },
    updateScore: (state, action: PayloadAction<{ attackers: number; defenders: number }>) => {
      state.score = action.payload;
    },
    updateRoundState: (state, action: PayloadAction<Partial<RoundState>>) => {
      state.round = { ...state.round, ...action.payload };
    },
    updatePlayerState: (state, action: PayloadAction<{ id: string; state: Partial<PlayerState> }>) => {
      if (state.players[action.payload.id]) {
        state.players[action.payload.id] = {
          ...state.players[action.payload.id],
          ...action.payload.state,
        };
      }
    },
    setSpectatorMode: (state, action: PayloadAction<{ enabled: boolean; playerId?: string }>) => {
      state.spectatorMode = action.payload.enabled;
      state.spectatedPlayerId = action.payload.playerId || null;
    },
    clearMatch: (state) => {
      state.currentMatch = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(simulateMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(simulateMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload;
      })
      .addCase(simulateMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to simulate match';
      });
  },
});

export const {
  startMatch,
  endMatch,
  updateScore,
  updateRoundState,
  updatePlayerState,
  setSpectatorMode,
  clearMatch,
} = matchSlice.actions;

export default matchSlice.reducer; 