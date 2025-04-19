import matchReducer, {
  startMatch,
  endMatch,
  updateScore,
  updateRoundState,
  updatePlayerState,
  setSpectatorMode,
} from '../matchSlice';
import type { MatchState } from '../matchSlice';

describe('matchSlice', () => {
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
      spikeState: 'carried' as const,
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

  const mockPlayerState = {
    id: 'player1',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    health: 100,
    armor: 50,
    weapon: 'Vandal',
    abilities: { flash: true, smoke: false },
  };

  it('should handle initial state', () => {
    expect(matchReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle startMatch', () => {
    const actual = matchReducer(initialState, startMatch('Haven'));
    expect(actual.isActive).toBe(true);
    expect(actual.map).toBe('Haven');
  });

  it('should handle endMatch', () => {
    const activeState = { ...initialState, isActive: true };
    const actual = matchReducer(activeState, endMatch());
    expect(actual.isActive).toBe(false);
  });

  it('should handle updateScore', () => {
    const newScore = { attackers: 5, defenders: 3 };
    const actual = matchReducer(initialState, updateScore(newScore));
    expect(actual.score).toEqual(newScore);
  });

  it('should handle updateRoundState', () => {
    const roundUpdate = {
      roundNumber: 1,
      timeRemaining: 50,
      spikeState: 'planted' as const,
      spikePosition: { x: 10, y: 0, z: 10 },
      spikeTimer: 45,
    };
    const actual = matchReducer(initialState, updateRoundState(roundUpdate));
    expect(actual.round).toEqual(roundUpdate);
  });

  it('should handle updatePlayerState', () => {
    const stateWithPlayer = {
      ...initialState,
      players: { [mockPlayerState.id]: mockPlayerState },
    };
    const update = {
      id: mockPlayerState.id,
      state: { health: 80, armor: 25 },
    };
    const actual = matchReducer(stateWithPlayer, updatePlayerState(update));
    expect(actual.players[mockPlayerState.id].health).toBe(80);
    expect(actual.players[mockPlayerState.id].armor).toBe(25);
  });

  it('should handle setSpectatorMode', () => {
    const spectatorUpdate = { enabled: true, playerId: 'player1' };
    const actual = matchReducer(initialState, setSpectatorMode(spectatorUpdate));
    expect(actual.spectatorMode).toBe(true);
    expect(actual.spectatedPlayerId).toBe('player1');
  });
}); 