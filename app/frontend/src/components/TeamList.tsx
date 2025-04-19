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
        {player.gamerTag} ({player.firstName} {player.lastName})
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        {player.primaryRole} - {player.region}
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(player.coreStats).map(([stat, value]) => (
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
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {team.name}
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        Region: {team.region}
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teams
      </Typography>
      {teams.length === 0 ? (
        <Typography color="textSecondary">
          No teams available. Create some teams to get started!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} key={team.name}>
              <TeamCard team={team} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TeamList; 