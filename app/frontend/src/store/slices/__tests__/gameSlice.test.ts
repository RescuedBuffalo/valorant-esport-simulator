import gameReducer, {
  updateMoney,
  updateReputation,
  advanceTime,
  upgradeFacility,
} from '../gameSlice';

describe('gameSlice', () => {
  const mockDate = '2025-01-01T00:00:00.000Z';
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockDate));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const initialState = {
    money: 100000,
    reputation: 50,
    currentDate: mockDate,
    facilityLevel: 1,
  };

  it('should handle initial state', () => {
    expect(gameReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle updateMoney', () => {
    const actual = gameReducer(initialState, updateMoney(200000));
    expect(actual.money).toEqual(200000);
  });

  it('should handle updateReputation', () => {
    const actual = gameReducer(initialState, updateReputation(75));
    expect(actual.reputation).toEqual(75);
  });

  it('should handle advanceTime', () => {
    const newDate = new Date().toISOString();
    const actual = gameReducer(initialState, advanceTime(newDate));
    expect(actual.currentDate).toEqual(newDate);
  });

  it('should handle upgradeFacility', () => {
    const actual = gameReducer(initialState, upgradeFacility());
    expect(actual.facilityLevel).toEqual(2);
  });
}); 