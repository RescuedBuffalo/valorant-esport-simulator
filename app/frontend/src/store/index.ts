import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import teamReducer from './slices/teamSlice';
import matchReducer from './slices/matchSlice';

const store = configureStore({
  reducer: {
    game: gameReducer,
    team: teamReducer,
    match: matchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 