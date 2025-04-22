// Types for round simulation
export interface RoundSimulationRequest {
  team_a: string;
  team_b: string;
  map_name: string;
  round_number: number;
  economy?: {
    team_a: number;
    team_b: number;
  };
  loss_streaks?: {
    team_a: number;
    team_b: number;
  };
  agent_selections?: {
    team_a: Record<string, string>;
    team_b: Record<string, string>;
  };
}

export interface RoundEvent {
  event_type: string;
  timestamp: number;
  position: [number, number];
  player_id: string;
  target_id?: string;
  details: {
    [key: string]: any;
  };
}

export interface RoundData {
  round_number: number;
  winner: string;
  events?: RoundEvent[];
  economy: { 
    team_a: number; 
    team_b: number;
  };
  loss_streaks: { 
    team_a: number; 
    team_b: number;
  };
  map_data?: any;
  summary?: string;
  notes?: string[];
  spike_planted?: boolean;
  att_strategy?: string;
  def_strategy?: string;
  player_loadouts?: {
    [playerId: string]: {
      weapon: string;
      armor: boolean;
      ability_used: boolean;
      ability_impact: string;
    }
  };
}

export interface TeamPlayerInfo {
  id: string;
  firstName: string;
  lastName: string;
  gamerTag: string;
  agent: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  logo?: string;
  players: TeamPlayerInfo[];
}

export interface RoundSimulationResponse {
  round_data: RoundData;
  team_info?: {
    team_a: TeamInfo;
    team_b: TeamInfo;
  };
}

export interface MatchResult {
  match_id: string;
  score: {
    team_a: number;
    team_b: number;
  };
  duration: string;
  map: string;
  mvp: {
    player_id: string;
    kills: number;
    deaths: number;
    assists: number;
  };
  rounds: RoundData[];
  team_a_name?: string;
  team_b_name?: string;
  economy_logs?: any[];
} 