import { resetMatchResult, setCurrentTeam } from '../gameSlice';
import reducer from '../gameSlice';

describe('gameSlice', () => {
  const initialState = {
    teams: [],
    regions: [],
    currentTeam: null,
    matchResult: null,
    loading: false,
    error: null
  };

  test('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle resetMatchResult', () => {
    const previousState = {
      ...initialState,
      matchResult: {
        score: { team_a: 13, team_b: 7 },
        rounds: [],
        duration: 0,
        map: 'Haven',
        mvp: '123'
      }
    };

    expect(reducer(previousState, resetMatchResult())).toEqual({
      ...previousState,
      matchResult: null
    });
  });

  test('should handle setCurrentTeam', () => {
    const team = {
      id: '123',
      name: 'Test Team',
      region: 'NA',
      reputation: 50,
      players: [],
      stats: {
        wins: 0,
        losses: 0,
        tournaments_won: 0,
        prize_money: 0
      }
    };

    expect(reducer(initialState, setCurrentTeam(team))).toEqual({
      ...initialState,
      currentTeam: team
    });
  });
}); 