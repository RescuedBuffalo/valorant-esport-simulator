import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { fetchTeams } from '../store/slices/gameSlice';
import type { Team, Player } from '../store/slices/gameSlice';
import ErrorBoundary from './ErrorBoundary';
import PerformanceMonitor from '../utils/performance';

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
  const startTime = PerformanceMonitor.startMeasure('PlayerCard');
  
  try {
    const content = (
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <Typography variant="h6">
            {player.firstName} "{player.lastName}"
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {player.role} • {player.nationality} • Age: {player.age}
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(player.stats).map(([stat, value]) => (
              <Grid item xs={6} key={stat}>
                <Typography variant="body2">
                  {stat}: {value.toFixed(1)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );

    PerformanceMonitor.endMeasure('PlayerCard', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering PlayerCard:', error);
    throw error;
  }
};

const TeamCard: React.FC<{ team: Team }> = ({ team }) => {
  const startTime = PerformanceMonitor.startMeasure('TeamCard');
  
  try {
    const content = (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {team.name}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Region: {team.region} • Reputation: {team.reputation}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Record: {team.stats.wins}W - {team.stats.losses}L
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Tournaments Won: {team.stats.tournaments_won}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <ErrorBoundary>
              {team.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </ErrorBoundary>
          </Box>
        </CardContent>
      </Card>
    );

    PerformanceMonitor.endMeasure('TeamCard', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering TeamCard:', error);
    throw error;
  }
};

const TeamList: React.FC = () => {
  const startTime = PerformanceMonitor.startMeasure('TeamList');
  const dispatch = useDispatch<AppDispatch>();
  const teams = useSelector((state: RootState) => state.game.teams);
  const loading = useSelector((state: RootState) => state.game.loading);

  useEffect(() => {
    try {
      dispatch(fetchTeams());
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [dispatch]);

  try {
    let content;

    if (loading) {
      content = (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      );
    } else if (teams.length === 0) {
      content = (
        <Box sx={{ p: 3 }}>
          <Typography>No teams created yet. Create your first team!</Typography>
        </Box>
      );
    } else {
      content = (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Teams
          </Typography>
          {teams.map((team) => (
            <ErrorBoundary key={team.id}>
              <TeamCard team={team} />
            </ErrorBoundary>
          ))}
        </Box>
      );
    }

    PerformanceMonitor.endMeasure('TeamList', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering TeamList:', error);
    throw error;
  }
};

export default () => (
  <ErrorBoundary>
    <TeamList />
  </ErrorBoundary>
); 