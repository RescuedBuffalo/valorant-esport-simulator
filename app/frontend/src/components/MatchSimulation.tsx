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
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <Typography variant="h6">Round {index + 1}</Typography>
          <Typography>
            Winner: {round.winner === 'team_a' ? teamA : teamB}
          </Typography>
          <Typography>
            Economy:
            {' '}{teamA}: {round.economy.team_a}
            {' '}{teamB}: {round.economy.team_b}
          </Typography>
          {round.spike_planted && (
            <Typography color="success.main">Spike was planted!</Typography>
          )}
          {round.clutch_player && (
            <Typography color="primary">Clutch play!</Typography>
          )}
        </CardContent>
      </Card>
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
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Match Results
        </Typography>
        <Typography variant="h6" gutterBottom>
          {teamA} {result.score.team_a} - {result.score.team_b} {teamB}
        </Typography>
        <Typography gutterBottom>
          Map: {result.map}
        </Typography>
        <Typography gutterBottom>
          Duration: {result.duration} minutes
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
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
    );

    PerformanceMonitor.endMeasure('MatchResultDisplay', startTime);
    return content;
  } catch (error) {
    console.error('Error rendering MatchResultDisplay:', error);
    throw error;
  }
};

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
          <Typography>
            You need at least two teams to simulate a match. Please create more teams!
          </Typography>
        </Paper>
      );
    } else {
      content = (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Simulate Match
          </Typography>
          {!currentMatch ? (
            <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Team A</InputLabel>
                    <Select
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      label="Team A"
                    >
                      {teams.map((team) => (
                        <MenuItem
                          key={team.name}
                          value={team.name}
                          disabled={team.name === teamB}
                        >
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Team B</InputLabel>
                    <Select
                      value={teamB}
                      onChange={(e) => setTeamB(e.target.value)}
                      label="Team B"
                    >
                      {teams.map((team) => (
                        <MenuItem
                          key={team.name}
                          value={team.name}
                          disabled={team.name === teamA}
                        >
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSimulate}
                    disabled={loading || !teamA || !teamB || teamA === teamB}
                  >
                    {loading ? 'Simulating...' : 'Start Match'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Box>
              <ErrorBoundary>
                <MatchResultDisplay result={currentMatch} teamA={teamA} teamB={teamB} />
              </ErrorBoundary>
              <Button
                variant="contained"
                onClick={handleNewMatch}
                sx={{ mt: 3 }}
              >
                Simulate Another Match
              </Button>
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