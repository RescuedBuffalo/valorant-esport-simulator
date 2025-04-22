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
  type: string;
  description: string;
  timestamp: number;
  player_id?: string;
  player_name?: string;
  target_id?: string;
  target_name?: string;
  location?: [number, number];
  details?: Record<string, any>;
}

export interface RoundSimulationResponse {
  round_data: {
    round_number: number;
    winner: string;
    events: RoundEvent[];
    economy: {
      team_a: number;
      team_b: number;
    };
    loss_streaks: {
      team_a: number;
      team_b: number;
    };
    map_data?: any;
  };
  team_info: {
    team_a: {
      id: string;
      name: string;
      logo?: string;
      players: Array<{
        id: string;
        firstName: string;
        lastName: string;
        gamerTag: string;
        agent: string;
      }>;
    };
    team_b: {
      id: string;
      name: string;
      logo?: string;
      players: Array<{
        id: string;
        firstName: string;
        lastName: string;
        gamerTag: string;
        agent: string;
      }>;
    };
  };
} 