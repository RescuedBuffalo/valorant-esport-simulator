import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import teamReducer from './slices/teamSlice';
import matchReducer from './slices/matchSlice';
import leagueReducer from './slices/leagueSlice';
import logger from './middleware/logger';

const isDevelopment = process.env.NODE_ENV === 'development';

const store = configureStore({
  reducer: {
    game: gameReducer,
    team: teamReducer,
    match: matchReducer,
    league: leagueReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware();
    if (isDevelopment) {
      return middleware.concat(logger);
    }
    return middleware;
  },
  devTools: isDevelopment,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 