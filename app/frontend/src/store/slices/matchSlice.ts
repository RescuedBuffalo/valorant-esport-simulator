import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
};

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
  },
});

export const {
  startMatch,
  endMatch,
  updateScore,
  updateRoundState,
  updatePlayerState,
  setSpectatorMode,
} = matchSlice.actions;

export default matchSlice.reducer; 