import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
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
}

interface TeamState {
  roster: Player[];
  teamName: string;
  chemistry: number;
  trainingSchedule: Record<string, string>;
}

const initialState: TeamState = {
  roster: [],
  teamName: 'New Team',
  chemistry: 50,
  trainingSchedule: {},
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<Player>) => {
      state.roster.push(action.payload);
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.roster = state.roster.filter(player => player.id !== action.payload);
    },
    updateTeamName: (state, action: PayloadAction<string>) => {
      state.teamName = action.payload;
    },
    updateChemistry: (state, action: PayloadAction<number>) => {
      state.chemistry = action.payload;
    },
    setTrainingSchedule: (state, action: PayloadAction<Record<string, string>>) => {
      state.trainingSchedule = action.payload;
    },
  },
});

export const { addPlayer, removePlayer, updateTeamName, updateChemistry, setTrainingSchedule } = teamSlice.actions;
export default teamSlice.reducer; 