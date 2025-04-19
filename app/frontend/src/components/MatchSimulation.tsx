import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Fade,
  Grow,
  LinearProgress,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { simulateMatch, clearMatch } from '../store/slices/gameSlice';
import type { MatchResult } from '../store/slices/gameSlice';
import ErrorBoundary from './ErrorBoundary';
import PerformanceMonitor from '../utils/performance';

type Round = MatchResult['rounds'][0];

const RoundSummary: React.FC<{ round: Round; index: number; teamA: string; teamB: string }> = ({
  round,
  index,
  teamA,
  teamB,
}) => {
  const startTime = PerformanceMonitor.startMeasure('RoundSummary');
  
  try {
    const content = (
      <Grow in timeout={300 + index * 100}>
        <Card variant="outlined" sx={{ mb: 1, position: 'relative', overflow: 'visible' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={`Round ${index + 1}`}
                color="primary"
                size="small"
                sx={{ position: 'absolute', top: -12, left: 16 }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6" color={round.winner === 'team_a' ? 'primary' : 'text.secondary'}>
                {teamA}
              </Typography>
              <Typography variant="body2" color="text.secondary">VS</Typography>
              <Typography variant="h6" color={round.winner === 'team_b' ? 'primary' : 'text.secondary'}>
                {teamB}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Economy</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(round.economy.team_a / 50000) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">${round.economy.team_a}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(round.economy.team_b / 50000) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">${round.economy.team_b}</Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              {round.spike_planted && (
                <Chip 
                  label="Spike Planted" 
                  color="success" 
                  size="small" 
                  sx={{ borderRadius: 1 }}
                />
              )}
              {round.clutch_player && (
                <Chip 
                  label="Clutch Play!" 
                  color="primary" 
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grow>
    );

    PerformanceMonitor.endMeasure('RoundSummary', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering RoundSummary:', error);
    throw error;
  }
};

const MatchResultDisplay: React.FC<{
  result: MatchResult;
  teamA: string;
  teamB: string;
}> = ({ result, teamA, teamB }) => {
  const startTime = PerformanceMonitor.startMeasure('MatchResultDisplay');
  
  try {
    const content = (
      <Fade in timeout={500}>
        <Box sx={{ mt: 3 }}>
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
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mb: 1,
                    bgcolor: result.score.team_a > result.score.team_b ? 'primary.main' : 'grey.300'
                  }}
                >
                  {teamA[0]}
                </Avatar>
                <Typography variant="h6">{teamA}</Typography>
                <Typography variant="h3" color="primary">
                  {result.score.team_a}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.secondary">VS</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {result.map}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {result.duration} minutes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mb: 1,
                    bgcolor: result.score.team_b > result.score.team_a ? 'primary.main' : 'grey.300'
                  }}
                >
                  {teamB[0]}
                </Avatar>
                <Typography variant="h6">{teamB}</Typography>
                <Typography variant="h3" color="primary">
                  {result.score.team_b}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Typography variant="h6" gutterBottom sx={{ pl: 2 }}>
            Round Summary
          </Typography>
          {result.rounds.map((round, index) => (
            <ErrorBoundary key={index}>
              <RoundSummary
                round={round}
                index={index}
                teamA={teamA}
                teamB={teamB}
              />
            </ErrorBoundary>
          ))}
        </Box>
      </Fade>
    );

    PerformanceMonitor.endMeasure('MatchResultDisplay', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering MatchResultDisplay:', error);
    throw error;
  }
};

const TeamSelector: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  otherTeam: string;
  teams: any[];
}> = ({ label, value, onChange, otherTeam, teams }) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label={label}
    >
      {teams.map((team) => (
        <MenuItem
          key={team.name}
          value={team.name}
          disabled={team.name === otherTeam}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>{team.name[0]}</Avatar>
            <Box>
              <Typography variant="body1">{team.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Region: {team.region} • Rating: {team.reputation}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const MatchSimulation: React.FC = () => {
  const startTime = PerformanceMonitor.startMeasure('MatchSimulation');
  const dispatch = useDispatch<AppDispatch>();
  const teams = useSelector((state: RootState) => state.game.teams);
  const currentMatch = useSelector((state: RootState) => state.game.currentMatch);
  const loading = useSelector((state: RootState) => state.game.loading);

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const handleSimulate = async () => {
    try {
      if (teamA && teamB && teamA !== teamB) {
        await dispatch(simulateMatch({ team_a: teamA, team_b: teamB }));
      }
    } catch (error) {
      console.error('Error simulating match:', error);
    }
  };

  const handleNewMatch = () => {
    try {
      dispatch(clearMatch());
      setTeamA('');
      setTeamB('');
    } catch (error) {
      console.error('Error clearing match:', error);
    }
  };

  try {
    let content;

    if (teams.length < 2) {
      content = (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
          <Typography align="center" color="text.secondary">
            You need at least two teams to simulate a match
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {/* Navigate to team creation */}}
          >
            Create New Team
          </Button>
        </Paper>
      );
    } else {
      content = (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            Simulate Match
          </Typography>
          {!currentMatch ? (
            <Grow in timeout={500}>
              <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TeamSelector
                      label="Team A"
                      value={teamA}
                      onChange={setTeamA}
                      otherTeam={teamB}
                      teams={teams}
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
                      teams={teams}
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
            </Grow>
          ) : (
            <Box>
              <ErrorBoundary>
                <MatchResultDisplay result={currentMatch} teamA={teamA} teamB={teamB} />
              </ErrorBoundary>
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNewMatch}
                  size="large"
                >
                  Simulate Another Match
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    PerformanceMonitor.endMeasure('MatchSimulation', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering MatchSimulation:', error);
    throw error;
  }
};

export default () => (
  <ErrorBoundary>
    <MatchSimulation />
  </ErrorBoundary>
); 