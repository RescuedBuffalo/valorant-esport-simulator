import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
  Paper,
  Fade,
  Grow,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Button,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchTeamsThunk } from '../store/thunks/gameThunks';
import { Player, Team } from '../store/slices/gameSlice';
import ErrorBoundary from './ErrorBoundary';
import PerformanceMonitor from '../utils/performance';

const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" color="text.primary">
        {value}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{
        height: 6,
        borderRadius: 3,
        backgroundColor: 'grey.200',
        '& .MuiLinearProgress-bar': {
          borderRadius: 3,
        },
      }}
    />
  </Box>
);

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
  const startTime = PerformanceMonitor.startMeasure('PlayerCard');
  
  try {
    const content = (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              {player.gamerTag[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                "{player.gamerTag}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {player.firstName} {player.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={player.primaryRole}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={player.nationality}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  label={`Age: ${player.age}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {Object.entries(player.coreStats).map(([stat, value]) => (
              <Grid item xs={6} key={stat}>
                <StatBar 
                  label={stat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
                  value={Math.round(value)} 
                />
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
  const navigate = useNavigate();
  const startTime = PerformanceMonitor.startMeasure('TeamCard');
  
  try {
    const content = (
      <Grow in timeout={300}>
        <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                  {team.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5">{team.name}</Typography>
                  <Typography variant="subtitle1">
                    {team.region} • {team.reputation.toFixed(1)} Rating
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6">
                  {team.stats.wins}W - {team.stats.losses}L
                </Typography>
                <Typography variant="body2">
                  Tournaments Won: {team.stats.tournaments_won}
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/teams/${team.id}/edit`)}
                  sx={{ mt: 1 }}
                >
                  Edit Team
                </Button>
              </Box>
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Roster
            </Typography>
            <ErrorBoundary>
              {team.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </ErrorBoundary>
          </Box>
        </Paper>
      </Grow>
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
  const teams = useSelector((state: RootState) => state.game.teams || []);
  const loading = useSelector((state: RootState) => state.game.loading);

  useEffect(() => {
    try {
      dispatch(fetchTeamsThunk());
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [dispatch]);

  try {
    let content;

    if (loading) {
      content = (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
          <CircularProgress size={48} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Loading Teams...
          </Typography>
        </Box>
      );
    } else if (!Array.isArray(teams) || teams.length === 0) {
      content = (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            maxWidth: 400,
            mx: 'auto',
            mt: 4,
          }}
        >
          <Typography variant="h5" gutterBottom>
            No Teams Yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Start by creating your first team to begin your journey!
          </Typography>
        </Paper>
      );
    } else {
      content = (
        <Box sx={{ p: 3 }}>
          <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4 }}>
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