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

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => (
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

const TeamCard: React.FC<{ team: Team }> = ({ team }) => (
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
        {team.players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </Box>
    </CardContent>
  </Card>
);

const TeamList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const teams = useSelector((state: RootState) => state.game.teams);
  const loading = useSelector((state: RootState) => state.game.loading);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (teams.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No teams created yet. Create your first team!</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teams
      </Typography>
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </Box>
  );
};

export default TeamList; 