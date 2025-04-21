import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  SelectChangeEvent,
} from '@mui/material';
import RoundPlayByPlay from '../components/RoundPlayByPlay';
import { RoundSimulationResponse } from '../services/api';
import { recordUserInteraction } from '../utils/metrics';

const RoundPlayByPlayDemo: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [teamA, setTeamA] = useState('Team Liquid');
  const [teamB, setTeamB] = useState('Sentinels');
  const [teamAId, setTeamAId] = useState('team_a_id');
  const [teamBId, setTeamBId] = useState('team_b_id');
  const [mapName, setMapName] = useState('Ascent');
  const [roundNumber, setRoundNumber] = useState(1);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [simResult, setSimResult] = useState<RoundSimulationResponse | null>(null);

  // Mock team data
  const teams = [
    { id: 'team_a_id', name: 'Team Liquid' },
    { id: 'team_b_id', name: 'Sentinels' },
    { id: 'team_c_id', name: 'Cloud9' },
    { id: 'team_d_id', name: 'Fnatic' },
    { id: 'team_e_id', name: 'G2 Esports' },
  ];

  // Mock map data
  const maps = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus'];

  const handleTeamAChange = (event: SelectChangeEvent<string>) => {
    const selectedTeamId = event.target.value;
    const selectedTeam = teams.find(team => team.id === selectedTeamId);
    if (selectedTeam) {
      setTeamAId(selectedTeamId);
      setTeamA(selectedTeam.name);
    }
  };

  const handleTeamBChange = (event: SelectChangeEvent<string>) => {
    const selectedTeamId = event.target.value;
    const selectedTeam = teams.find(team => team.id === selectedTeamId);
    if (selectedTeam) {
      setTeamBId(selectedTeamId);
      setTeamB(selectedTeam.name);
    }
  };

  const handleMapChange = (event: SelectChangeEvent<string>) => {
    setMapName(event.target.value);
  };

  const handleRoundNumberChange = (event: SelectChangeEvent<string>) => {
    setRoundNumber(parseInt(event.target.value, 10));
  };

  const handleSpeedChange = (event: SelectChangeEvent<string>) => {
    setSimulationSpeed(event.target.value as 'slow' | 'normal' | 'fast');
  };

  const handleStartSimulation = () => {
    setIsStarted(true);
    recordUserInteraction('RoundPlayByPlayDemo', 'start_simulation', {
      teamA: teamAId,
      teamB: teamBId,
      map: mapName,
      round: roundNumber,
      speed: simulationSpeed
    });
  };

  const handleSimulationComplete = (result: RoundSimulationResponse) => {
    setSimResult(result);
    recordUserInteraction('RoundPlayByPlayDemo', 'simulation_complete', {
      winner: result.round_data.winner,
      eventCount: result.round_data.events.length
    });
  };

  const handleReset = () => {
    setIsStarted(false);
    setSimResult(null);
    recordUserInteraction('RoundPlayByPlayDemo', 'reset_simulation');
  };

  if (simResult) {
    // Get team names from the response if available
    const teamAName = simResult.team_info?.team_a?.name || teamA;
    const teamBName = simResult.team_info?.team_b?.name || teamB;
    
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>Round Simulation Results</Typography>
          <Typography variant="h6">
            Winner: {simResult.round_data.winner === 'team_a' ? teamAName : teamBName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {simResult.round_data.events.length} events recorded during the round
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{teamAName}</Typography>
                  <Typography>Final Economy: ${simResult.round_data.economy.team_a}</Typography>
                  <Typography>Loss Streak: {simResult.round_data.loss_streaks.team_a}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{teamBName}</Typography>
                  <Typography>Final Economy: ${simResult.round_data.economy.team_b}</Typography>
                  <Typography>Loss Streak: {simResult.round_data.loss_streaks.team_b}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleReset} 
            sx={{ mt: 3 }}
          >
            Run Another Simulation
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!isStarted ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Round Play-by-Play Simulation</Typography>
          <Typography variant="body1" paragraph>
            Configure your round simulation settings below and click "Start Simulation" to see a detailed play-by-play breakdown of a simulated round.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="team-a-label">Team A</InputLabel>
                <Select
                  labelId="team-a-label"
                  value={teamAId}
                  label="Team A"
                  onChange={handleTeamAChange}
                >
                  {teams.map(team => (
                    <MenuItem key={`team-a-${team.id}`} value={team.id}>{team.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="team-b-label">Team B</InputLabel>
                <Select
                  labelId="team-b-label"
                  value={teamBId}
                  label="Team B"
                  onChange={handleTeamBChange}
                >
                  {teams.map(team => (
                    <MenuItem key={`team-b-${team.id}`} value={team.id}>{team.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="map-label">Map</InputLabel>
                <Select
                  labelId="map-label"
                  value={mapName}
                  label="Map"
                  onChange={handleMapChange}
                >
                  {maps.map(map => (
                    <MenuItem key={map} value={map}>{map}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="round-label">Round Number</InputLabel>
                <Select
                  labelId="round-label"
                  value={roundNumber.toString()}
                  label="Round Number"
                  onChange={handleRoundNumberChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(round => (
                    <MenuItem key={round} value={round.toString()}>{round}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="speed-label">Simulation Speed</InputLabel>
                <Select
                  labelId="speed-label"
                  value={simulationSpeed}
                  label="Simulation Speed"
                  onChange={handleSpeedChange}
                >
                  <MenuItem value="slow">Slow</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="fast">Fast</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Button 
            variant="contained" 
            size="large" 
            color="primary" 
            onClick={handleStartSimulation}
            sx={{ mt: 2 }}
          >
            Start Simulation
          </Button>
        </Paper>
      ) : (
        <RoundPlayByPlay
          teamA={teamA}
          teamB={teamB}
          teamAId={teamAId}
          teamBId={teamBId}
          mapName={mapName}
          roundNumber={roundNumber}
          onComplete={handleSimulationComplete}
          onCancel={handleReset}
          autoplay={true}
          speed={simulationSpeed}
        />
      )}
    </Container>
  );
};

export default RoundPlayByPlayDemo; 