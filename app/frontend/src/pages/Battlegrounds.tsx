import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import { recordUserInteraction } from '../utils/metrics';
import { AppDispatch, RootState } from '../store';
import TeamSelector from '../components/TeamSelector';
import { agents, Agent } from '../data/agents';
import { simulateMatchThunk } from '../store/thunks/gameThunks';
import RoundPlayByPlay from '../components/RoundPlayByPlay';

// Define match phases
enum MatchPhase {
  SETUP = 'setup',
  MAP_SELECTION = 'map_selection',
  AGENT_SELECTION = 'agent_selection',
  MATCH_IN_PROGRESS = 'match_in_progress',
  MATCH_COMPLETE = 'match_complete',
}

// Define player loadout type
interface PlayerLoadout {
  agentId: string;
  weapon: string;
  armor: boolean;
  hasUltimate: boolean;
  abilities: {
    basic1: { name: string; available: number; cost: number };
    basic2: { name: string; available: number; cost: number };
    signature: { name: string; available: number };
    ultimate: { name: string; points: number; ready: boolean };
  };
}

// Available maps in the game
interface GameMap {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

const AVAILABLE_MAPS: GameMap[] = [
  {
    id: 'ascent',
    name: 'Ascent',
    description: 'An open playground for small wars of position and attrition',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Ascent',
  },
  {
    id: 'bind',
    name: 'Bind',
    description: 'Two sites, no middle, and one-way teleporters',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Bind',
  },
  {
    id: 'haven',
    name: 'Haven',
    description: 'Three sites, multiple pathways, and strategic control points',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Haven',
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Middle control and vertical rope ascenders',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Split',
  },
  {
    id: 'icebox',
    name: 'Icebox',
    description: 'Complex vertical angles and ziplines',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Icebox',
  },
  {
    id: 'breeze',
    name: 'Breeze',
    description: 'Wide open spaces and long sightlines',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Breeze',
  },
  {
    id: 'fracture',
    name: 'Fracture',
    description: 'H-shaped layout with attackers spawning on both sides',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Fracture',
  },
  {
    id: 'lotus',
    name: 'Lotus',
    description: 'Three sites with rotating doors',
    image: 'https://via.placeholder.com/300x150/1A1A1A/FFFFFF?text=Lotus',
  },
];

// TabPanel local definition (MUI does not export TabPanel)
interface TabPanelProps { children?: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// RoundViewer component definition
interface RoundViewerProps { roundData: any; teamAName: string; teamBName: string; mapName: string; }
const RoundViewer: React.FC<RoundViewerProps> = ({ roundData, teamAName, teamBName, mapName }) => {
  const [expanded, setExpanded] = useState(false);
  const handleExpand = () => setExpanded(!expanded);
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">Round {roundData.round_number + 1}</Typography>
          <Typography>{roundData.winner === 'team_a' ? teamAName : teamBName}</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>{roundData.summary}</Typography>
        <Tabs value={expanded ? 1 : 0} onChange={(_, v) => setExpanded(v === 1)}>
          <Tab label="Preview" />
          <Tab label="Details" />
        </Tabs>
        <TabPanel value={expanded ? 1 : 0} index={1}>
          <Typography>Economy: {teamAName} ${roundData.economy.team_a} | {teamBName} ${roundData.economy.team_b}</Typography>
          {/* more details as needed */}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

const Battlegrounds: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { teams, loading } = useSelector((state: RootState) => state.game);
  const [error, setError] = useState<string | null>(null);
  
  // Match state
  const [currentPhase, setCurrentPhase] = useState<MatchPhase>(MatchPhase.SETUP);
  const [userTeam, setUserTeam] = useState<string>('');
  const [opponentTeam, setOpponentTeam] = useState<string>('');
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [agentSelections, setAgentSelections] = useState<Record<string, string>>({});
  const [timeoutsRemaining, setTimeoutsRemaining] = useState<{ attack: number; defense: number }>({ attack: 2, defense: 2 });
  const [currentSide, setCurrentSide] = useState<'attack' | 'defense'>('attack');
  const [isTimeoutActive, setIsTimeoutActive] = useState<boolean>(false);
  const [timeoutSecondsRemaining, setTimeoutSecondsRemaining] = useState<number>(30);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [playerLoadouts, setPlayerLoadouts] = useState<Record<string, PlayerLoadout>>({});
  const [matchResult, setMatchResult] = useState<any>(null);
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [score, setScore] = useState<{userTeam: number, opponentTeam: number}>({userTeam: 0, opponentTeam: 0});
  // New state for match result tabs
  const [resultTabIndex, setResultTabIndex] = useState(0);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  
  // Get players for the selected teams
  const userTeamPlayers = React.useMemo(() => {
    if (!userTeam) return [];
    const team = teams.find(t => t.name === userTeam);
    return team?.players || [];
  }, [userTeam, teams]);

  const opponentTeamPlayers = React.useMemo(() => {
    if (!opponentTeam) return [];
    const team = teams.find(t => t.name === opponentTeam);
    return team?.players || [];
  }, [opponentTeam, teams]);
  
  // Initialize player loadouts when user team changes or after agent selection
  useEffect(() => {
    if (userTeamPlayers.length > 0 && Object.keys(agentSelections).length > 0) {
      const loadouts: Record<string, PlayerLoadout> = {};
      
      userTeamPlayers.forEach(player => {
        const agentId = agentSelections[player.id];
        if (!agentId) return;
        
        const agentData = agents.find(a => a.id === agentId);
        if (!agentData) return;
        
        loadouts[player.id] = {
          agentId,
          weapon: 'Classic', // Default pistol for first round
          armor: false,
          hasUltimate: false,
          abilities: {
            basic1: {
              name: agentData.abilities[0]?.name || 'Unknown',
              available: agentData.abilities[0]?.charges || 2,
              cost: agentData.abilities[0]?.cost || 200,
            },
            basic2: {
              name: agentData.abilities[1]?.name || 'Unknown',
              available: agentData.abilities[1]?.charges || 1,
              cost: agentData.abilities[1]?.cost || 200,
            },
            signature: {
              name: agentData.abilities[2]?.name || 'Unknown',
              available: 1,
            },
            ultimate: {
              name: agentData.abilities[3]?.name || 'Unknown',
              points: 0,
              ready: false,
            },
          },
        };
      });
      
      setPlayerLoadouts(loadouts);
    }
  }, [userTeamPlayers, agentSelections]);
  
  // Handle team selection
  const handleTeamSelect = () => {
    if (userTeam && opponentTeam && userTeam !== opponentTeam) {
      recordUserInteraction('Battlegrounds', 'select_teams', {
        userTeam,
        opponentTeam,
      });
      setCurrentPhase(MatchPhase.MAP_SELECTION);
    }
  };
  
  // Handle map selection
  const handleMapSelect = (mapId: string) => {
    setSelectedMap(mapId);
    recordUserInteraction('Battlegrounds', 'select_map', { map: mapId });
    setCurrentPhase(MatchPhase.AGENT_SELECTION);
  };
  
  // Handle agent selection for a player
  const handleAgentSelect = (playerId: string, agentId: string) => {
    setAgentSelections(prev => ({
      ...prev,
      [playerId]: agentId,
    }));
    recordUserInteraction('Battlegrounds', 'select_agent', { playerId, agentId });
  };
  
  // Start the match after agent selection
  const handleStartMatch = () => {
    // Ensure all players have agents selected
    const allPlayersHaveAgents = userTeamPlayers.every(player => agentSelections[player.id]);
    
    if (!allPlayersHaveAgents) {
      setError('All players must have agents selected');
      return;
    }
    
    recordUserInteraction('Battlegrounds', 'start_match', {
      userTeam,
      opponentTeam,
      map: selectedMap,
      agents: agentSelections,
    });
    
    setCurrentPhase(MatchPhase.MATCH_IN_PROGRESS);
    setError(null);
    
    // For now, we'll simulate the match but in the future we can make it more interactive
    dispatch(simulateMatchThunk({ 
      team_a: userTeam, 
      team_b: opponentTeam,
      map_name: selectedMap,
      agent_selections: agentSelections
    })).then((result: any) => {
      if (result.meta.requestStatus === 'fulfilled') {
        // Store match result data
        setMatchResult(result.payload);
        
        // Set round history for round viewer
        if (result.payload.rounds) {
          setRoundHistory(result.payload.rounds);
        }
        
        // Set final score
        setScore({
          userTeam: result.payload.score?.team_a || 0,
          opponentTeam: result.payload.score?.team_b || 0
        });
        
        // If this is the first round, select it by default
        if (result.payload.rounds && result.payload.rounds.length > 0) {
          setSelectedRound(0);
          // Set tab to round history
          setResultTabIndex(1);
        }
        
        setCurrentPhase(MatchPhase.MATCH_COMPLETE);
      } else {
        setError('Failed to simulate match');
      }
    });
  };
  
  // Handle calling a timeout
  const handleCallTimeout = () => {
    if (timeoutsRemaining[currentSide] > 0) {
      recordUserInteraction('Battlegrounds', 'call_timeout', { 
        side: currentSide,
        round: roundNumber,
      });
      
      setTimeoutsRemaining(prev => ({
        ...prev,
        [currentSide]: prev[currentSide] - 1,
      }));
      
      setIsTimeoutActive(true);
      setTimeoutSecondsRemaining(30);
      
      // Start the timeout countdown
      const interval = setInterval(() => {
        setTimeoutSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimeoutActive(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  
  // Handle result tab change
  const handleResultTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setResultTabIndex(newValue);
  };
  
  // Render the current phase of the match
  const renderPhaseContent = () => {
    switch (currentPhase) {
      case MatchPhase.SETUP:
        return (
          <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>Team Selection</Typography>
            <Typography variant="body1" paragraph>
              Select your team and opponent for the Battlegrounds match.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TeamSelector
                  label="Your Team"
                  value={userTeam}
                  onChange={setUserTeam}
                  otherTeam={opponentTeam}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">VS</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TeamSelector
                  label="Opponent Team"
                  value={opponentTeam}
                  onChange={setOpponentTeam}
                  otherTeam={userTeam}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleTeamSelect}
                  disabled={!userTeam || !opponentTeam || userTeam === opponentTeam}
                >
                  Continue
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
        
      case MatchPhase.MAP_SELECTION:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Map Selection</Typography>
            <Typography variant="body1" paragraph>
              Choose the map for this Battlegrounds match.
            </Typography>
            
            <Grid container spacing={3}>
              {AVAILABLE_MAPS.map((map) => (
                <Grid item xs={12} sm={6} md={4} key={map.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedMap === map.id ? '2px solid #00C2FF' : 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => handleMapSelect(map.id)}
                  >
                    <Box
                      component="img"
                      src={map.image}
                      alt={map.name}
                      sx={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6">{map.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {map.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
        
      case MatchPhase.AGENT_SELECTION:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Agent Selection</Typography>
            <Typography variant="body1" paragraph>
              Select agents for your team players. The opponent's selections will not be revealed.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {userTeamPlayers.map((player) => (
                <Grid item xs={12} key={player.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {player.firstName} "{player.gamerTag}" {player.lastName}
                      </Typography>
                      <Chip 
                        label={player.primaryRole} 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Select Agent:
                    </Typography>
                    
                    <Grid container spacing={1}>
                      {agents.map((agent) => (
                        <Grid item key={agent.id}>
                          <Tooltip title={agent.name}>
                            <Box
                              component="div"
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: agentSelections[player.id] === agent.id 
                                  ? 'primary.main' 
                                  : 'background.paper',
                                border: '2px solid',
                                borderColor: agentSelections[player.id] === agent.id 
                                  ? 'primary.main' 
                                  : 'divider',
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                },
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                              onClick={() => handleAgentSelect(player.id, agent.id)}
                            >
                              <Typography variant="subtitle1">
                                {agent.name.substring(0, 2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleStartMatch}
                  disabled={loading || !userTeamPlayers.every(player => agentSelections[player.id])}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Preparing Match...
                    </Box>
                  ) : (
                    'Start Match'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        );
        
      case MatchPhase.MATCH_IN_PROGRESS:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Match In Progress</Typography>
            
            {/* Round info */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Round {roundNumber} - {currentSide === 'attack' ? 'Attack' : 'Defense'} Side
                </Typography>
                
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    Score: {score.userTeam} - {score.opponentTeam}
                  </Typography>
                  
                  <Tooltip title={`${timeoutsRemaining[currentSide]} timeouts remaining`}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<PauseIcon />}
                      onClick={handleCallTimeout}
                      disabled={timeoutsRemaining[currentSide] === 0 || isTimeoutActive}
                    >
                      Timeout
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
              
              {isTimeoutActive && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Timeout: {timeoutSecondsRemaining} seconds remaining
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(timeoutSecondsRemaining / 30) * 100} 
                  />
                </Box>
              )}
            </Paper>
            
            {/* Player loadouts */}
            <Typography variant="h6" gutterBottom>Player Loadouts</Typography>
            <Grid container spacing={2}>
              {userTeamPlayers.map((player) => {
                const loadout = playerLoadouts[player.id];
                const agentData = agents.find(a => a.id === loadout?.agentId);
                
                return (
                  <Grid item xs={12} sm={6} key={player.id}>
                    <Paper sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle1">
                          {player.gamerTag}
                        </Typography>
                        <Typography variant="subtitle2">
                          {agentData?.name || 'No Agent'}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2">
                        Weapon: {loadout?.weapon || 'None'}
                      </Typography>
                      
                      <Typography variant="body2">
                        Armor: {loadout?.armor ? 'Yes' : 'No'}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        Abilities:
                      </Typography>
                      
                      {loadout && (
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip
                            label={`${loadout.abilities.basic1.name} (${loadout.abilities.basic1.available})`}
                            size="small"
                          />
                          <Chip
                            label={`${loadout.abilities.basic2.name} (${loadout.abilities.basic2.available})`}
                            size="small"
                          />
                          <Chip
                            label={`${loadout.abilities.signature.name} (${loadout.abilities.signature.available})`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={`${loadout.abilities.ultimate.name} (${loadout.abilities.ultimate.points}/7)`}
                            size="small"
                            color={loadout.abilities.ultimate.ready ? "success" : "default"}
                          />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* For now, show loading since we're simulating */}
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          </Box>
        );
        
      case MatchPhase.MATCH_COMPLETE:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>Match Complete</Typography>
            
            {matchResult && (
              <>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    my: 3,
                    px: 4
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">{userTeam}</Typography>
                      <Typography variant="h3" color="primary">
                        {matchResult.score?.team_a || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="text.secondary">VS</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {selectedMap}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">{opponentTeam}</Typography>
                      <Typography variant="h3" color="primary">
                        {matchResult.score?.team_b || 0}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {matchResult.mvp && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="subtitle1">
                        MVP: {matchResult.mvp.player_name || "Unknown"}
                      </Typography>
                      <Typography variant="body2">
                        {matchResult.mvp.kills || 0} Kills, {matchResult.mvp.assists || 0} Assists, {matchResult.mvp.deaths || 0} Deaths
                      </Typography>
                    </Box>
                  )}
                </Paper>
                
                <Paper sx={{ mb: 3 }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                      value={resultTabIndex} 
                      onChange={handleResultTabChange}
                      variant="fullWidth"
                    >
                      <Tab label="Match Summary" />
                      <Tab label="Round History" />
                      {selectedRound !== null && (
                        <Tab label={`Round ${selectedRound + 1} Details`} />
                      )}
                    </Tabs>
                  </Box>
                  
                  <TabPanel value={resultTabIndex} index={0}>
                    <Typography variant="h6" gutterBottom>Match Summary</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Match Details
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2">
                              Duration: {matchResult.duration || "Unknown"}
                            </Typography>
                            <Typography variant="body2">
                              Map: {matchResult.map || selectedMap}
                            </Typography>
                            <Typography variant="body2">
                              Rounds Played: {matchResult.rounds?.length || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Team Performance
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2">
                              {userTeam} Score: {matchResult.score?.team_a || 0}
                            </Typography>
                            <Typography variant="body2">
                              {opponentTeam} Score: {matchResult.score?.team_b || 0}
                            </Typography>
                            <Typography variant="body2">
                              Winner: {
                                (matchResult.score?.team_a || 0) > (matchResult.score?.team_b || 0) 
                                  ? userTeam 
                                  : opponentTeam
                              }
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  
                  <TabPanel value={resultTabIndex} index={1}>
                    <Typography variant="h6" gutterBottom>Round History</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Click on a round to view detailed information
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {matchResult.rounds && matchResult.rounds.map((round: any, index: number) => (
                        <Grid item xs={12} key={index}>
                          <RoundViewer 
                            roundData={round}
                            teamAName={userTeam}
                            teamBName={opponentTeam}
                            mapName={selectedMap}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </TabPanel>
                  
                  {selectedRound !== null && matchResult.rounds && matchResult.rounds[selectedRound] && (
                    <TabPanel value={resultTabIndex} index={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Round {selectedRound + 1} Play-by-Play
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => setResultTabIndex(1)}
                        >
                          Back to Rounds
                        </Button>
                      </Box>
                      
                      <Paper sx={{ p: 2, mb: 3 }}>
                        <RoundPlayByPlay
                          teamA={userTeam}
                          teamB={opponentTeam}
                          teamAId="team_a"
                          teamBId="team_b"
                          mapName={selectedMap}
                          roundNumber={(selectedRound + 1).toString()}
                          autoplay
                          speed="normal"
                        />
                      </Paper>
                    </TabPanel>
                  )}
                </Paper>
                
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/battlegrounds')}
                  >
                    Play Again
                  </Button>
                </Box>
              </>
            )}
          </Box>
        );
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Valorant Battlegrounds
      </Typography>
      
      {/* Phase indicator */}
      <Stepper activeStep={Object.values(MatchPhase).indexOf(currentPhase)} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Team Selection</StepLabel>
        </Step>
        <Step>
          <StepLabel>Map Selection</StepLabel>
        </Step>
        <Step>
          <StepLabel>Agent Selection</StepLabel>
        </Step>
        <Step>
          <StepLabel>Match</StepLabel>
        </Step>
      </Stepper>
      
      {renderPhaseContent()}
    </Box>
  );
};

export default Battlegrounds; 