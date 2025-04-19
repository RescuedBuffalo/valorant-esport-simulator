import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { simulateMatch } from '../store/slices/matchSlice';
import TeamSelector from '../components/TeamSelector';
import { useDispatch } from 'react-redux';

// Create a typed dispatch hook
const useAppDispatch = () => useDispatch<AppDispatch>();

const MatchSimulation: React.FC = () => {
  const dispatch = useAppDispatch();
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const { currentMatch, loading } = useSelector((state: RootState) => state.match);

  const handleSimulate = () => {
    if (teamA && teamB && teamA !== teamB) {
      dispatch(simulateMatch({ teamA, teamB }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Match Simulation
      </Typography>

      {!currentMatch ? (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TeamSelector
                label="Team A"
                value={teamA}
                onChange={setTeamA}
                otherTeam={teamB}
              />
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">VS</Typography>
            </Grid>
            <Grid item xs={12}>
              <TeamSelector
                label="Team B"
                value={teamB}
                onChange={setTeamB}
                otherTeam={teamA}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSimulate}
                disabled={loading || !teamA || !teamB || teamA === teamB}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Simulating Match...
                  </Box>
                ) : (
                  'Start Match'
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Box>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom align="center">
              Match Results
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              my: 3,
              px: 4
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{teamA}</Typography>
                <Typography variant="h3" color="primary">
                  {currentMatch.score.team_a}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.secondary">VS</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {currentMatch.map}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{teamB}</Typography>
                <Typography variant="h3" color="primary">
                  {currentMatch.score.team_b}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Typography variant="h6" gutterBottom>
            Round Summary
          </Typography>
          {currentMatch.rounds.map((round, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Round {index + 1}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    {teamA}: ${round.economy.team_a}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    {teamB}: ${round.economy.team_b}
                  </Typography>
                </Grid>
              </Grid>
              {round.spike_planted && (
                <Typography color="success.main" sx={{ mt: 1 }}>
                  Spike Planted!
                </Typography>
              )}
              {round.clutch_player && (
                <Typography color="primary" sx={{ mt: 1 }}>
                  Clutch Play!
                </Typography>
              )}
            </Paper>
          ))}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              size="large"
            >
              Simulate Another Match
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MatchSimulation; 