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
  Divider,
  Chip,
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

// Define a response type for the API call
interface ApiResponse {
  teams?: Team[];
  [key: string]: any;
}

const RoundPlayByPlayDemo: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
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
  const [showStrategyDetails, setShowStrategyDetails] = useState(false);

  // Map data
  const maps = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus'];

  // Fetch teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Using ApiService.get to fetch teams
        const response = await ApiService.get<ApiResponse | Team[]>('/api/v1/teams');
        
        // Check if response has teams property or is an array directly
        let fetchedTeams: Team[] = [];
        
        if (Array.isArray(response)) {
          fetchedTeams = response;
        } else if (response && typeof response === 'object' && 'teams' in response) {
          fetchedTeams = response.teams as Team[];
        }
        
        // Ensure teams is always an array
        if (Array.isArray(fetchedTeams) && fetchedTeams.length > 0) {
          setTeams(fetchedTeams);
          
          // Set default teams if available
          if (fetchedTeams.length >= 2) {
            setTeamAId(fetchedTeams[0].id);
            setTeamA(fetchedTeams[0].name);
            setTeamBId(fetchedTeams[1].id);
            setTeamB(fetchedTeams[1].name);
          }
        } else {
          console.error('API returned empty or invalid teams data:', fetchedTeams);
          setError('No teams found in the database. Please create teams first.');
        }
      } catch (err: any) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams from database. Please check the API connection.');
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
      eventCount: result.round_data.events ? result.round_data.events.length : 0
    });
  };

  const handleReset = () => {
    setIsStarted(false);
    setSimResult(null);
    setSimulationCompleted(false);
    setShowStrategyDetails(false);
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
      
      // Use the API to simulate a round
      const result = await ApiService.simulateRound({
        team_a: teamAId,
        team_b: teamBId,
        round_number: roundNumber,
        map_name: mapName
      });
      
      console.log('Simulation result:', result);
      
      if (result.round_data) {
        setSimResult(result);
        if (result.round_data.events) {
          setRoundEvents(result.round_data.events);
        }
        if (result.team_info) {
          setTeamInfo(result.team_info);
        }
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

  const renderStrategyDetails = () => {
    if (!simResult || !simResult.round_data) return null;
    
    // Extract strategies and notes from round data
    const { att_strategy, def_strategy, notes } = simResult.round_data;
    
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">Round Strategy Details</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Attacker Strategy:</Typography>
              <Chip 
                label={att_strategy || "Unknown"} 
                color="primary" 
                sx={{ my: 1 }} 
              />
              <Typography variant="body2">
                {getStrategyDescription(att_strategy || "")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Defender Strategy:</Typography>
              <Chip 
                label={def_strategy || "Unknown"} 
                color="secondary" 
                sx={{ my: 1 }} 
              />
              <Typography variant="body2">
                {getStrategyDescription(def_strategy || "")}
              </Typography>
            </Grid>
          </Grid>
          
          {notes && notes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Round Notes:</Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {notes.map((note: string, index: number) => (
                  <Box component="li" key={index}>
                    <Typography variant="body2">{note}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Helper function to get strategy descriptions
  const getStrategyDescription = (strategy: string): string => {
    const descriptions: Record<string, string> = {
      "aggressive_push": "Launch a fast, coordinated attack on a single site with minimal information gathering.",
      "split_push": "Attack from multiple entry points simultaneously to divide defender attention.",
      "fast_execute": "Quick, coordinated site take with pre-set utility usage.",
      "default": "Standard approach with map control before deciding on a site to attack.",
      "eco": "Conservative play with minimal investment, looking for picks and economic damage.",
      "semi_buy": "Medium investment round with limited utility and weapons.",
      "full_buy": "Full equipment with optimal weapons and utility.",
      "stack_a": "Focus defensive resources on A site, leaving other areas with minimal coverage.",
      "stack_b": "Focus defensive resources on B site, leaving other areas with minimal coverage.",
      "balanced_defense": "Even distribution of defenders across all sites.",
      "passive_defense": "Playing from safe positions, giving up map control until site defense.",
      "aggressive_defense": "Pushing forward to gain information and control of key map areas.",
      "mixed_defense": "Combination of aggressive and passive elements across the map."
    };
    
    return descriptions[strategy] || "Custom strategy approach.";
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
          
          {simResult.round_data.summary && (
            <Typography variant="body1" sx={{ fontStyle: 'italic', my: 1 }}>
              {simResult.round_data.summary}
            </Typography>
          )}
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{teamAName}</Typography>
                  <Typography>Final Economy: ${simResult.round_data.economy?.team_a}</Typography>
                  <Typography>
                    Strategy: {simResult.round_data.att_strategy || simResult.round_data.def_strategy || "Unknown"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{teamBName}</Typography>
                  <Typography>Final Economy: ${simResult.round_data.economy?.team_b}</Typography>
                  <Typography>
                    Strategy: {simResult.round_data.att_strategy || simResult.round_data.def_strategy || "Unknown"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setShowStrategyDetails(!showStrategyDetails)} 
            sx={{ mt: 2 }}
          >
            {showStrategyDetails ? "Hide Strategy Details" : "Show Strategy Details"}
          </Button>
          
          {showStrategyDetails && renderStrategyDetails()}
          
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