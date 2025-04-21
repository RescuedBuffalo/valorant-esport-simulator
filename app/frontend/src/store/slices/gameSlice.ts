import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTeamsThunk, createTeamThunk, fetchRegionsThunk, simulateMatchThunk, fetchTeamByIdThunk, updateTeamThunk, updatePlayerThunk, addPlayerToTeamThunk, removePlayerFromTeamThunk } from '../thunks/gameThunks';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  gamerTag: string;
  age: number;
  nationality: string;
  region: string;
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
  form?: number;
  fatigue?: number;
  morale?: number;
  isStarter?: boolean;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  region: string;
  reputation: number;
  players: Player[];
  stats: {
    wins: number;
    losses: number;
    tournaments_won: number;
    prize_money: number;
  };
}

export interface MatchResult {
  score: {
    team_a: number;
    team_b: number;
  };
  rounds: any[];
  duration: number;
  map: string;
  mvp: string;
  player_agents?: Record<string, string>;
  economy_logs?: any[];
}

export interface MatchRequest {
  team_a: string;
  team_b: string;
  map_name?: string;
  agent_selections?: Record<string, string>;
}

interface GameState {
  teams: Team[];
  regions: string[];
  currentTeam: Team | null;
  matchResult: MatchResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  teams: [],
  regions: [],
  currentTeam: null,
  matchResult: null,
  loading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetMatchResult: (state) => {
      state.matchResult = null;
    },
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Teams
      .addCase(fetchTeamsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsThunk.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch teams';
      })
      // Create Team
      .addCase(createTeamThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeamThunk.fulfilled, (state, action) => {
        state.teams.push(action.payload);
        state.currentTeam = action.payload;
        state.loading = false;
      })
      .addCase(createTeamThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create team';
      })
      // Fetch Regions
      .addCase(fetchRegionsThunk.fulfilled, (state, action) => {
        state.regions = action.payload;
      })
      // Simulate Match
      .addCase(simulateMatchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.matchResult = null;
      })
      .addCase(simulateMatchThunk.fulfilled, (state, action) => {
        state.matchResult = action.payload;
        state.loading = false;
      })
      .addCase(simulateMatchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to simulate match';
      })
      // Fetch Team by ID
      .addCase(fetchTeamByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamByIdThunk.fulfilled, (state, action) => {
        state.currentTeam = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch team';
      })
      // Handle team updates
      .addCase(updateTeamThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeamThunk.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the team in the teams array
        const updatedTeam = action.payload;
        const index = state.teams.findIndex(team => team.id === updatedTeam.id);
        
        if (index !== -1) {
          state.teams[index] = updatedTeam;
        }
        
        // If this is the current team, update it too
        if (state.currentTeam && state.currentTeam.id === updatedTeam.id) {
          state.currentTeam = updatedTeam;
        }
      })
      .addCase(updateTeamThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle player updates
      .addCase(updatePlayerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlayerThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPlayer = action.payload;
        const teamId = updatedPlayer.teamId;
        
        // Update player in team's player list
        const teamIndex = state.teams.findIndex(team => team.id === teamId);
        if (teamIndex !== -1) {
          const playerIndex = state.teams[teamIndex].players.findIndex(
            player => player.id === updatedPlayer.id
          );
          
          if (playerIndex !== -1) {
            state.teams[teamIndex].players[playerIndex] = updatedPlayer;
          }
        }
        
        // Update in currentTeam if it's the same team
        if (state.currentTeam && state.currentTeam.id === teamId) {
          const playerIndex = state.currentTeam.players.findIndex(
            player => player.id === updatedPlayer.id
          );
          
          if (playerIndex !== -1) {
            state.currentTeam.players[playerIndex] = updatedPlayer;
          }
        }
      })
      .addCase(updatePlayerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle adding a player to a team
      .addCase(addPlayerToTeamThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPlayerToTeamThunk.fulfilled, (state, action) => {
        state.loading = false;
        const newPlayer = action.payload;
        const teamId = newPlayer.teamId;
        
        // Add player to team's player list
        const teamIndex = state.teams.findIndex(team => team.id === teamId);
        if (teamIndex !== -1) {
          state.teams[teamIndex].players.push(newPlayer);
        }
        
        // Add to currentTeam if it's the same team
        if (state.currentTeam && state.currentTeam.id === teamId) {
          state.currentTeam.players.push(newPlayer);
        }
      })
      .addCase(addPlayerToTeamThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle removing a player from a team
      .addCase(removePlayerFromTeamThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePlayerFromTeamThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { teamId, playerId } = action.meta.arg;
        
        // Remove player from team's player list
        const teamIndex = state.teams.findIndex(team => team.id === teamId);
        if (teamIndex !== -1) {
          state.teams[teamIndex].players = state.teams[teamIndex].players.filter(
            player => player.id !== playerId
          );
        }
        
        // Remove from currentTeam if it's the same team
        if (state.currentTeam && state.currentTeam.id === teamId) {
          state.currentTeam.players = state.currentTeam.players.filter(
            player => player.id !== playerId
          );
        }
      })
      .addCase(removePlayerFromTeamThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetMatchResult, setCurrentTeam } = gameSlice.actions;

export default gameSlice.reducer; 