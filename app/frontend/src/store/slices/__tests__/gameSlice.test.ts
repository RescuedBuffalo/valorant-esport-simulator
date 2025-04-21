import gameReducer, {
  resetMatchResult,
  setCurrentTeam,
} from '../gameSlice';

describe('gameSlice', () => {
  const initialState = {
    teams: [],
    regions: [],
    currentTeam: null,
    matchResult: null,
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(gameReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle resetMatchResult', () => {
    const stateWithMatchResult = {
      ...initialState,
      matchResult: {
        score: { team_a: 13, team_b: 8 },
        rounds: [],
        duration: 45,
        map: 'Haven',
        mvp: 'player1',
      }
    };
    const actual = gameReducer(stateWithMatchResult, resetMatchResult());
    expect(actual.matchResult).toBeNull();
  });

  it('should handle setCurrentTeam', () => {
    const mockTeam = {
      id: '123',
      name: 'Test Team',
      region: 'NA',
      reputation: 75,
      players: [],
      stats: {
        wins: 0,
        losses: 0,
        tournaments_won: 0,
        prize_money: 0
      }
    };
    const actual = gameReducer(initialState, setCurrentTeam(mockTeam));
    expect(actual.currentTeam).toEqual(mockTeam);
  });
}); 