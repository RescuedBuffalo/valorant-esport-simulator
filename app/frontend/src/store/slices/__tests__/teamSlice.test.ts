import teamReducer, {
  addPlayer,
  removePlayer,
  updateTeamName,
  updateChemistry,
  setTrainingSchedule,
} from '../teamSlice';

describe('teamSlice', () => {
  const mockPlayer = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    age: 22,
    nationality: 'USA',
    primaryRole: 'Entry',
    salary: 50000,
    coreStats: {
      aim: 80,
      gameSense: 75,
      movement: 85,
      utilityUsage: 70,
      communication: 80,
      clutch: 75,
    },
    roleProficiencies: {
      Entry: 90,
      Duelist: 85,
    },
    agentProficiencies: {
      Jett: 90,
      Raze: 85,
    },
    careerStats: {
      matchesPlayed: 100,
      kills: 2000,
      deaths: 1500,
      assists: 500,
      firstBloods: 300,
      clutches: 50,
      winRate: 0.6,
      kdRatio: 1.33,
      kdaRatio: 1.67,
      firstBloodRate: 0.3,
      clutchRate: 0.5,
    },
  };

  const initialState = {
    roster: [],
    teamName: 'New Team',
    chemistry: 50,
    trainingSchedule: {},
  };

  it('should handle initial state', () => {
    expect(teamReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addPlayer', () => {
    const actual = teamReducer(initialState, addPlayer(mockPlayer));
    expect(actual.roster).toHaveLength(1);
    expect(actual.roster[0]).toEqual(mockPlayer);
  });

  it('should handle removePlayer', () => {
    const stateWithPlayer = teamReducer(initialState, addPlayer(mockPlayer));
    const actual = teamReducer(stateWithPlayer, removePlayer(mockPlayer.id));
    expect(actual.roster).toHaveLength(0);
  });

  it('should handle updateTeamName', () => {
    const newName = 'Test Team';
    const actual = teamReducer(initialState, updateTeamName(newName));
    expect(actual.teamName).toEqual(newName);
  });

  it('should handle updateChemistry', () => {
    const newChemistry = 75;
    const actual = teamReducer(initialState, updateChemistry(newChemistry));
    expect(actual.chemistry).toEqual(newChemistry);
  });

  it('should handle setTrainingSchedule', () => {
    const schedule = {
      Monday: 'Aim Training',
      Tuesday: 'Strategy Review',
    };
    const actual = teamReducer(initialState, setTrainingSchedule(schedule));
    expect(actual.trainingSchedule).toEqual(schedule);
  });
}); 