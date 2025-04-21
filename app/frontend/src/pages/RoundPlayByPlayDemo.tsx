import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import RoundPlayByPlay from '../components/RoundPlayByPlay';
import ApiService from '../services/api';
import { RoundSimulationResponse, RoundEvent } from '../types/api.types';
import { recordUserInteraction } from '../utils/metrics';

interface Team {
  id: string;
  name: string;
  logo: string;
}

// Define TeamInfo interface to match the RoundPlayByPlay component props
interface TeamInfo {
  id: string;
  name: string;
  logo?: string;
  players: Array<{
    id: string;
    firstName: string;
    lastName: string;
    gamerTag: string;
    agent: string;
  }>;
}

const RoundPlayByPlayDemo: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [teamA, setTeamA] = useState('Team Liquid');
  const [teamB, setTeamB] = useState('Sentinels');
  const [teamAId, setTeamAId] = useState('550e8400-e29b-41d4-a716-446655440000');
  const [teamBId, setTeamBId] = useState('550e8400-e29b-41d4-a716-446655440001');
  const [mapName, setMapName] = useState('Ascent');
  const [roundNumber, setRoundNumber] = useState(1);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [simResult, setSimResult] = useState<RoundSimulationResponse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [roundEvents, setRoundEvents] = useState<RoundEvent[]>([]);
  const [teamInfo, setTeamInfo] = useState<{ team_a: TeamInfo; team_b: TeamInfo } | null>(null);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  // Mock team data
  const mockTeams = [
    { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Team Liquid', logo: '/assets/team-logos/liquid.png' },
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Sentinels', logo: '/assets/team-logos/sentinels.png' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Cloud9', logo: '/assets/team-logos/cloud9.png' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Fnatic', logo: '/assets/team-logos/fnatic.png' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'G2 Esports', logo: '/assets/team-logos/g2.png' },
  ];

  // Mock map data
  const maps = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus'];

  // Fetch teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Using ApiService.get to fetch teams
        const fetchedTeams = await ApiService.get<Team[]>('/api/v1/teams');
        // Ensure teams is always an array
        if (Array.isArray(fetchedTeams)) {
          setTeams(fetchedTeams);
          
          // Set default teams if available
          if (fetchedTeams.length >= 2) {
            setTeamAId(fetchedTeams[0].id);
            setTeamBId(fetchedTeams[1].id);
          }
        } else {
          console.error('API returned non-array data for teams:', fetchedTeams);
          setTeams(mockTeams);
        }
      } catch (err: any) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams. Using mock data instead.');
        // Use mock teams as fallback
        setTeams(mockTeams);
      } finally {
        setLoading(false);
      }
    };
    
    loadTeams();
  }, []);

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

  const runSimulation = async () => {
    if (!teamAId || !teamBId) {
      setSimulationError('Please select both teams first');
      return;
    }

    setSimulating(true);
    setSimulationError(null);
    setSimulationCompleted(false);
    
    try {
      console.log(`Simulating round ${roundNumber} between team ${teamAId} and team ${teamBId} on ${mapName}`);
      
      let result;
      
      try {
        // Try to use the real API
        result = await ApiService.simulateRound({
          team_a: teamAId,
          team_b: teamBId,
          round_number: roundNumber,
          map_name: mapName
        });
      } catch (apiError) {
        console.error('API error, using mock data:', apiError);
        
        // Fall back to mock data if the API fails
        result = generateMockSimulationResponse(
          teamAId, 
          teamBId, 
          roundNumber, 
          mapName,
          // Find team details from our local state
          teams.find(t => t.id === teamAId)?.name || 'Team A',
          teams.find(t => t.id === teamBId)?.name || 'Team B'
        );
      }
      
      console.log('Simulation result:', result);
      
      if (result.round_data && result.team_info) {
        setRoundEvents(result.round_data.events || []);
        setTeamInfo(result.team_info);
        setSimulationCompleted(true);
      } else {
        setSimulationError('Invalid simulation result format');
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
      
      let errorMessage = 'Failed to simulate round. ';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object' && err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        }
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setSimulationError(errorMessage);
    } finally {
      setSimulating(false);
    }
  };

  // Generate mock response data for simulation when API is unavailable
  const generateMockSimulationResponse = (
    teamAId: string, 
    teamBId: string, 
    roundNumber: number, 
    mapName: string,
    teamAName: string,
    teamBName: string
  ): RoundSimulationResponse => {
    // Set winner randomly
    const winner = Math.random() > 0.5 ? 'team_a' : 'team_b';
    const isAttackingTeamA = roundNumber <= 12;

    // Generate events
    const events: RoundEvent[] = [
      {
        type: 'round_start',
        description: `Round ${roundNumber} starts. ${isAttackingTeamA ? teamAName : teamBName} on attack.`,
        timestamp: 0,
      },
      {
        type: 'strategy',
        description: `${isAttackingTeamA ? teamAName : teamBName} decides to execute a strategy on site A.`,
        timestamp: 5,
      }
    ];

    // Add random events
    for (let i = 0; i < 5 + Math.floor(Math.random() * 10); i++) {
      const eventTypes = ['movement', 'ability', 'kill', 'plant', 'defuse'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const timestamp = 10 + i * 10 + Math.floor(Math.random() * 5);
      
      if (eventType === 'kill') {
        const isTeamAKill = Math.random() > 0.5;
        events.push({
          type: 'kill',
          description: `${isTeamAKill ? 'Player from ' + teamAName : 'Player from ' + teamBName} eliminates an opponent.`,
          timestamp,
          player_name: `Player from ${isTeamAKill ? teamAName : teamBName}`,
          target_name: `Player from ${isTeamAKill ? teamBName : teamAName}`,
        });
      } else if (eventType === 'plant' && timestamp > 30) {
        events.push({
          type: 'plant',
          description: `Spike planted by ${isAttackingTeamA ? teamAName : teamBName}.`,
          timestamp,
          player_name: `Player from ${isAttackingTeamA ? teamAName : teamBName}`,
        });
      } else if (eventType === 'defuse' && timestamp > 60 && events.some(e => e.type === 'plant')) {
        events.push({
          type: 'defuse',
          description: `Spike defused by ${isAttackingTeamA ? teamBName : teamAName}.`,
          timestamp,
          player_name: `Player from ${isAttackingTeamA ? teamBName : teamAName}`,
        });
      } else {
        events.push({
          type: eventType,
          description: `A ${eventType} action occurred.`,
          timestamp,
        });
      }
    }

    // Add round end event
    events.push({
      type: 'round_end',
      description: `Round ends. ${winner === 'team_a' ? teamAName : teamBName} wins the round.`,
      timestamp: 95,
    });

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Create a mock player
    const createMockPlayers = (team: string) => [
      {
        id: `player1-${team}`,
        firstName: 'John',
        lastName: 'Doe',
        gamerTag: 'Pro' + team.substring(0, 1).toUpperCase(),
        agent: team === 'team_a' ? 'Jett' : 'Phoenix',
      },
      {
        id: `player2-${team}`,
        firstName: 'Jane',
        lastName: 'Smith',
        gamerTag: 'Elite' + team.substring(0, 1).toUpperCase(),
        agent: team === 'team_a' ? 'Sage' : 'Omen',
      },
      {
        id: `player3-${team}`,
        firstName: 'Bob',
        lastName: 'Johnson',
        gamerTag: 'Ace' + team.substring(0, 1).toUpperCase(),
        agent: team === 'team_a' ? 'Sova' : 'Viper',
      },
      {
        id: `player4-${team}`,
        firstName: 'Alice',
        lastName: 'Brown',
        gamerTag: 'Top' + team.substring(0, 1).toUpperCase(),
        agent: team === 'team_a' ? 'Reyna' : 'Killjoy',
      },
      {
        id: `player5-${team}`,
        firstName: 'Charlie',
        lastName: 'Wilson',
        gamerTag: 'Beast' + team.substring(0, 1).toUpperCase(),
        agent: team === 'team_a' ? 'Brimstone' : 'Cypher',
      },
    ];

    return {
      round_data: {
        round_number: roundNumber,
        winner: winner,
        events: events,
        economy: {
          team_a: 4000 - Math.floor(Math.random() * 2000),
          team_b: 4000 - Math.floor(Math.random() * 2000),
        },
        loss_streaks: {
          team_a: winner === 'team_a' ? 0 : 1,
          team_b: winner === 'team_b' ? 0 : 1,
        },
      },
      team_info: {
        team_a: {
          id: teamAId,
          name: teamAName,
          logo: '/assets/team-logos/liquid.png',
          players: createMockPlayers('team_a'),
        },
        team_b: {
          id: teamBId,
          name: teamBName,
          logo: '/assets/team-logos/sentinels.png',
          players: createMockPlayers('team_b'),
        },
      },
    };
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
      <Typography variant="h4" gutterBottom>
        Round Play-by-Play Simulation Demo
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Simulation Configuration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Team A</InputLabel>
                <Select
                  value={teamAId}
                  label="Team A"
                  onChange={handleTeamAChange}
                  disabled={teams.length === 0}
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Team B</InputLabel>
                <Select
                  value={teamBId}
                  label="Team B"
                  onChange={handleTeamBChange}
                  disabled={teams.length === 0}
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Round Number</InputLabel>
                <Select
                  value={roundNumber.toString()}
                  label="Round Number"
                  onChange={handleRoundNumberChange}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((round) => (
                    <MenuItem key={round} value={round.toString()}>
                      Round {round}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Map</InputLabel>
                <Select
                  value={mapName}
                  label="Map"
                  onChange={handleMapChange}
                >
                  {maps.map((map) => (
                    <MenuItem key={map} value={map}>
                      {map}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={runSimulation}
                disabled={simulating || !teamAId || !teamBId}
                sx={{ mt: 2 }}
              >
                {simulating ? 'Simulating...' : 'Run Simulation'}
              </Button>
              {simulating && (
                <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />
              )}
            </Grid>
            {simulationError && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {simulationError}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {simulationCompleted && teamInfo && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Round {roundNumber} Simulation Results
          </Typography>
          <Typography variant="h6" gutterBottom>
            {teamInfo.team_a.name} vs {teamInfo.team_b.name} on {mapName}
          </Typography>
          
          <RoundPlayByPlay
            teamA={teamInfo.team_a.name}
            teamB={teamInfo.team_b.name}
            teamAId={teamAId}
            teamBId={teamBId}
            mapName={mapName}
            roundNumber={roundNumber.toString()}
            autoplay={true}
            speed="normal"
          />
        </Paper>
      )}
    </Container>
  );
};

export default RoundPlayByPlayDemo; 