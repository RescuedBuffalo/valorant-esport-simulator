import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { config } from '../../config';
import { Team, MatchRequest, MatchResult } from '../slices/gameSlice';

export const fetchTeamsThunk = createAsyncThunk(
  'game/fetchTeams',
  async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/teams`);
      console.log('API Response:', response.data);
      // The API returns { teams: Team[] }, so we need to extract the teams array
      return response.data.teams || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }
);

export const createTeamThunk = createAsyncThunk(
  'game/createTeam',
  async (teamData: { name: string; region: string }) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/teams`, teamData);
      console.log('Create Team Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }
);

export const fetchRegionsThunk = createAsyncThunk(
  'game/fetchRegions', 
  async () => {
    // This could be fetched from an API endpoint in the future
    return ['NA', 'EU', 'APAC', 'BR', 'LATAM'];
  }
);

export const simulateMatchThunk = createAsyncThunk(
  'game/simulateMatch',
  async (matchRequest: MatchRequest) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/v1/matches/simulate`, matchRequest);
      console.log('Simulate Match Response:', response.data);
      return response.data as MatchResult;
    } catch (error) {
      console.error('Error simulating match:', error);
      throw error;
    }
  }
);

export const fetchTeamByIdThunk = createAsyncThunk(
  'game/fetchTeamById',
  async (teamId: string) => {
    try {
      const response = await axios.get(`${config.API_URL}/api/v1/teams/${teamId}`);
      console.log('Fetch Team Response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching team with ID ${teamId}:`, error);
      throw error;
    }
  }
); 