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

type Round = MatchResult['rounds'][0];

const RoundSummary: React.FC<{ round: Round; index: number; teamA: string; teamB: string }> = ({
  round,
  index,
  teamA,
  teamB,
}) => (
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

const MatchResultDisplay: React.FC<{
  result: MatchResult;
  teamA: string;
  teamB: string;
}> = ({ result, teamA, teamB }) => (
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
      <RoundSummary
        key={index}
        round={round}
        index={index}
        teamA={teamA}
        teamB={teamB}
      />
    ))}
  </Box>
);

const MatchSimulation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const teams = useSelector((state: RootState) => state.game.teams);
  const currentMatch = useSelector((state: RootState) => state.game.currentMatch);
  const loading = useSelector((state: RootState) => state.game.loading);

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const handleSimulate = async () => {
    if (teamA && teamB && teamA !== teamB) {
      await dispatch(simulateMatch({ team_a: teamA, team_b: teamB }));
    }
  };

  const handleNewMatch = () => {
    dispatch(clearMatch());
    setTeamA('');
    setTeamB('');
  };

  if (teams.length < 2) {
    return (
      <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Typography>
          You need at least two teams to simulate a match. Please create more teams!
        </Typography>
      </Paper>
    );
  }

  return (
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
          <MatchResultDisplay result={currentMatch} teamA={teamA} teamB={teamB} />
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
};

export default MatchSimulation; 