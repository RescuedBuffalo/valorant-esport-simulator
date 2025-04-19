import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  money: number;
  reputation: number;
  currentDate: string;
  facilityLevel: number;
}

const initialState: GameState = {
  money: 100000,
  reputation: 50,
  currentDate: '2025-01-01T00:00:00.000Z',
  facilityLevel: 1,
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
  },
});

export const { updateMoney, updateReputation, advanceTime, upgradeFacility } = gameSlice.actions;
export default gameSlice.reducer; 