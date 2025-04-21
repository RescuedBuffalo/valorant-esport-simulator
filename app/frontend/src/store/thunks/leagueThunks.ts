import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';
import { League, Circuit } from '../slices/leagueSlice';

/**
 * Fetch all leagues
 */
export const fetchLeaguesThunk = createAsyncThunk(
  'league/fetchLeagues',
  async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/leagues`);
      return response.data.leagues || [];
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  }
);

/**
 * Create a new league
 */
export const createLeagueThunk = createAsyncThunk(
  'league/createLeague',
  async (leagueData: {
    name: string;
    description?: string;
    region: string;
    prize_pool?: number;
    tier?: number;
    logo_url?: string;
    max_teams?: number;
    seasons_per_year?: number;
    format?: Record<string, any>;
  }) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/leagues`, leagueData);
      return response.data;
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  }
);

/**
 * Fetch a league by ID
 */
export const fetchLeagueByIdThunk = createAsyncThunk(
  'league/fetchLeagueById',
  async ({ 
    leagueId, 
    includeTeams = false, 
    includeCircuits = false 
  }: { 
    leagueId: string; 
    includeTeams?: boolean; 
    includeCircuits?: boolean;
  }) => {
    try {
      const response = await axios.get(
        `${config.API_URL}/api/v1/leagues/${leagueId}?include_teams=${includeTeams}&include_circuits=${includeCircuits}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching league with ID ${leagueId}:`, error);
      throw error;
    }
  }
);

/**
 * Update a league
 */
export const updateLeagueThunk = createAsyncThunk(
  'league/updateLeague',
  async ({
    leagueId,
    leagueData
  }: {
    leagueId: string;
    leagueData: Partial<League>;
  }) => {
    try {
      const response = await axios.put(`${config.API_URL}/api/v1/leagues/${leagueId}`, leagueData);
      return response.data;
    } catch (error) {
      console.error(`Error updating league with ID ${leagueId}:`, error);
      throw error;
    }
  }
);

/**
 * Add a team to a league
 */
export const addTeamToLeagueThunk = createAsyncThunk(
  'league/addTeamToLeague',
  async ({
    leagueId,
    teamId
  }: {
    leagueId: string;
    teamId: string;
  }) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/leagues/${leagueId}/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding team to league:`, error);
      throw error;
    }
  }
);

/**
 * Remove a team from a league
 */
export const removeTeamFromLeagueThunk = createAsyncThunk(
  'league/removeTeamFromLeague',
  async ({
    leagueId,
    teamId
  }: {
    leagueId: string;
    teamId: string;
  }) => {
    try {
      const response = await axios.delete(`${config.API_URL}/api/v1/leagues/${leagueId}/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing team from league:`, error);
      throw error;
    }
  }
);

/**
 * Create a new circuit within a league
 */
export const createCircuitThunk = createAsyncThunk(
  'league/createCircuit',
  async (circuitData: {
    name: string;
    description?: string;
    league_id: string;
    season?: number;
    stage: string;
    prize_pool?: number;
    format?: Record<string, any>;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/circuits`, circuitData);
      return response.data;
    } catch (error) {
      console.error('Error creating circuit:', error);
      throw error;
    }
  }
);

/**
 * Fetch all circuits, optionally filtered by league
 */
export const fetchCircuitsThunk = createAsyncThunk(
  'league/fetchCircuits',
  async (leagueId?: string) => {
    try {
      const url = leagueId 
        ? `${config.API_URL}/api/v1/circuits?league_id=${leagueId}` 
        : `${config.API_URL}/api/v1/circuits`;
      const response = await axios.get(url);
      return response.data.circuits || [];
    } catch (error) {
      console.error('Error fetching circuits:', error);
      throw error;
    }
  }
); 