import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { resetMatchResult } from '../store/slices/gameSlice';
import { simulateMatchThunk } from '../store/thunks/gameThunks';
import type { MatchResult } from '../store/slices/gameSlice';
import ErrorBoundary from './ErrorBoundary';
import PerformanceMonitor from '../utils/performance';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EastIcon from '@mui/icons-material/East';
import WestIcon from '@mui/icons-material/West';
import ShieldIcon from '@mui/icons-material/Shield';

type Round = MatchResult['rounds'][0];

interface PlayerLoadout {
  agent?: string;
  weapon: string;
  armor: boolean;
  total_spend: number;
}

const RoundSummary: React.FC<{ 
  round: Round; 
  index: number; 
  teamA: string; 
  teamB: string;
  teamAPlayers: any[];
  teamBPlayers: any[];
}> = ({
  round,
  index,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
}) => {
  const startTime = PerformanceMonitor.startMeasure('RoundSummary');
  const [open, setOpen] = useState(false);
  
  // Determine which team is attacking (team_a attacks on rounds 0-11, team_b on 12-23)
  const isTeamAAttacking = index < 12;
  const attackingTeam = isTeamAAttacking ? 'team_a' : 'team_b';
  const attackingTeamName = isTeamAAttacking ? teamA : teamB;
  
  // Get economy logs if available
  const economyLog = round.economy_log || null;
  
  // Create a map of player IDs to names for easier lookup
  const playerNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    
    // Process team A players
    teamAPlayers?.forEach(player => {
      map[player.id] = `${player.firstName} ${player.lastName}`;
    });
    
    // Process team B players
    teamBPlayers?.forEach(player => {
      map[player.id] = `${player.firstName} ${player.lastName}`;
    });
    
    return map;
  }, [teamAPlayers, teamBPlayers]);
  
  // Function to get player display name
  const getPlayerName = (playerId: string): string => {
    return playerNameMap[playerId] || playerId.substring(0, 8) + '...';
  };

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
              {round.is_pistol_round && (
                <Chip 
                  label="Pistol Round"
                  color="secondary"
                  size="small"
                  sx={{ position: 'absolute', top: -12, left: 100 }}
                />
              )}
            </Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2,
              position: 'relative'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {isTeamAAttacking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EastIcon color="error" fontSize="small" />
                    <Typography variant="caption" color="error.main" sx={{ ml: 0.5 }}>Attacking</Typography>
                  </Box>
                )}
                <Typography variant="h6" color={round.winner === 'team_a' ? 'primary' : 'text.secondary'}>
                  {teamA}
                </Typography>
                {!isTeamAAttacking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <ShieldIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="info.main" sx={{ ml: 0.5 }}>Defending</Typography>
                  </Box>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary">VS</Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {!isTeamAAttacking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EastIcon color="error" fontSize="small" />
                    <Typography variant="caption" color="error.main" sx={{ ml: 0.5 }}>Attacking</Typography>
                  </Box>
                )}
                <Typography variant="h6" color={round.winner === 'team_b' ? 'primary' : 'text.secondary'}>
                  {teamB}
                </Typography>
                {isTeamAAttacking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <ShieldIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="info.main" sx={{ ml: 0.5 }}>Defending</Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            {/* Economy Visualization */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ddd' }}>
              <Typography variant="subtitle2" gutterBottom>Economy</Typography>
              
              {/* Team A Economy */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{teamA}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {economyLog && (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {economyLog.team_a_start} →
                      </Typography>
                    )}
                    <Typography variant="body2" fontWeight="bold">
                      {round.economy?.team_a || '?'}
                    </Typography>
                  </Box>
                </Box>
                
                {economyLog && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                    {economyLog.team_a_spend > 0 && (
                      <Typography variant="caption" color="error" sx={{ mr: 1 }}>
                        -${economyLog.team_a_spend}
                      </Typography>
                    )}
                    {economyLog.team_a_reward > 0 && (
                      <Typography variant="caption" color="success.main">
                        +${economyLog.team_a_reward}
                      </Typography>
                    )}
                  </Box>
                )}
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (round.economy?.team_a || 0) / 90)} 
                  color={round.winner === 'team_a' ? 'success' : 'primary'}
                  sx={{ mt: 0.5, height: 5, borderRadius: 1 }}
                />
              </Box>
              
              {/* Team B Economy */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{teamB}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {economyLog && (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {economyLog.team_b_start} →
                      </Typography>
                    )}
                    <Typography variant="body2" fontWeight="bold">
                      {round.economy?.team_b || '?'}
                    </Typography>
                  </Box>
                </Box>
                
                {economyLog && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                    {economyLog.team_b_spend > 0 && (
                      <Typography variant="caption" color="error" sx={{ mr: 1 }}>
                        -${economyLog.team_b_spend}
                      </Typography>
                    )}
                    {economyLog.team_b_reward > 0 && (
                      <Typography variant="caption" color="success.main">
                        +${economyLog.team_b_reward}
                      </Typography>
                    )}
                  </Box>
                )}
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (round.economy?.team_b || 0) / 90)} 
                  color={round.winner === 'team_b' ? 'success' : 'primary'}
                  sx={{ mt: 0.5, height: 5, borderRadius: 1 }}
                />
              </Box>
            </Box>
            
            {/* Player Details Button */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                size="small"
                onClick={() => setOpen(!open)}
                endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              >
                {open ? "Hide Player Details" : "View Player Details"}
              </Button>
            </Box>
            
            {/* Player Details Drawer */}
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, borderTop: '1px dashed #ddd', pt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Team {teamA} Loadouts</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Weapon</TableCell>
                        <TableCell>Armor</TableCell>
                        <TableCell align="right">Spent</TableCell>
                        <TableCell align="right">Credits</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {round.player_loadouts && Object.entries(round.player_loadouts.team_a).map(([playerId, loadout]) => (
                        <TableRow key={playerId}>
                          <TableCell sx={{ fontWeight: 'medium' }}>{getPlayerName(playerId)}</TableCell>
                          <TableCell>{(loadout as PlayerLoadout).agent || "Unknown"}</TableCell>
                          <TableCell sx={{ color: (loadout as PlayerLoadout).weapon === 'Classic' ? 'text.secondary' : 'inherit' }}>
                            {(loadout as PlayerLoadout).weapon}
                          </TableCell>
                          <TableCell>{(loadout as PlayerLoadout).armor ? "Yes" : "No"}</TableCell>
                          <TableCell align="right" sx={{ color: (loadout as PlayerLoadout).total_spend > 0 ? 'error.main' : 'inherit', fontWeight: (loadout as PlayerLoadout).total_spend > 0 ? 'bold' : 'normal' }}>
                            {(loadout as PlayerLoadout).total_spend > 0 ? `-$${(loadout as PlayerLoadout).total_spend}` : '$0'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${round.player_credits?.[playerId] || '?'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Typography variant="subtitle2" gutterBottom>Team {teamB} Loadouts</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Weapon</TableCell>
                        <TableCell>Armor</TableCell>
                        <TableCell align="right">Spent</TableCell>
                        <TableCell align="right">Credits</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {round.player_loadouts && Object.entries(round.player_loadouts.team_b).map(([playerId, loadout]) => (
                        <TableRow key={playerId}>
                          <TableCell sx={{ fontWeight: 'medium' }}>{getPlayerName(playerId)}</TableCell>
                          <TableCell>{(loadout as PlayerLoadout).agent || "Unknown"}</TableCell>
                          <TableCell sx={{ color: (loadout as PlayerLoadout).weapon === 'Classic' ? 'text.secondary' : 'inherit' }}>
                            {(loadout as PlayerLoadout).weapon}
                          </TableCell>
                          <TableCell>{(loadout as PlayerLoadout).armor ? "Yes" : "No"}</TableCell>
                          <TableCell align="right" sx={{ color: (loadout as PlayerLoadout).total_spend > 0 ? 'error.main' : 'inherit', fontWeight: (loadout as PlayerLoadout).total_spend > 0 ? 'bold' : 'normal' }}>
                            {(loadout as PlayerLoadout).total_spend > 0 ? `-$${(loadout as PlayerLoadout).total_spend}` : '$0'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${round.player_credits?.[playerId] || '?'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
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
  teamAPlayers: any[];
  teamBPlayers: any[];
}> = ({ result, teamA, teamB, teamAPlayers, teamBPlayers }) => {
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
            
            {/* Agent Composition Summary */}
            {result.player_agents && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Agent Composition
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {/* Team A Agents */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {teamA}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {teamAPlayers.map(player => {
                        const agentName = result.player_agents?.[player.id] || 'Unknown';
                        return (
                          <Chip 
                            key={player.id}
                            label={`${agentName}`}
                            size="small"
                            sx={{ 
                              backgroundColor: 
                                agentName.match(/Jett|Phoenix|Raze|Reyna|Yoru|Neon|ISO/i) ? 'rgba(244, 67, 54, 0.1)' : // Duelist
                                agentName.match(/Brimstone|Viper|Omen|Astra|Harbor|Clove/i) ? 'rgba(33, 150, 243, 0.1)' : // Controller
                                agentName.match(/Killjoy|Cypher|Sage|Chamber|Deadlock/i) ? 'rgba(76, 175, 80, 0.1)' : // Sentinel
                                agentName.match(/Sova|Breach|Skye|KAY\/O|Fade|Gekko/i) ? 'rgba(255, 152, 0, 0.1)' : // Initiator
                                'rgba(158, 158, 158, 0.1)',
                              borderColor:
                                agentName.match(/Jett|Phoenix|Raze|Reyna|Yoru|Neon|ISO/i) ? 'rgba(244, 67, 54, 0.5)' : // Duelist
                                agentName.match(/Brimstone|Viper|Omen|Astra|Harbor|Clove/i) ? 'rgba(33, 150, 243, 0.5)' : // Controller
                                agentName.match(/Killjoy|Cypher|Sage|Chamber|Deadlock/i) ? 'rgba(76, 175, 80, 0.5)' : // Sentinel
                                agentName.match(/Sova|Breach|Skye|KAY\/O|Fade|Gekko/i) ? 'rgba(255, 152, 0, 0.5)' : // Initiator
                                'rgba(158, 158, 158, 0.5)',
                              border: '1px solid',
                              mb: 1,
                              position: 'relative'
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                  
                  {/* Team B Agents */}
                  <Box sx={{ flex: 1, textAlign: 'right' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {teamB}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                      {teamBPlayers.map(player => {
                        const agentName = result.player_agents?.[player.id] || 'Unknown';
                        return (
                          <Chip 
                            key={player.id}
                            label={`${agentName}`}
                            size="small"
                            sx={{ 
                              backgroundColor: 
                                agentName.match(/Jett|Phoenix|Raze|Reyna|Yoru|Neon|ISO/i) ? 'rgba(244, 67, 54, 0.1)' : // Duelist
                                agentName.match(/Brimstone|Viper|Omen|Astra|Harbor|Clove/i) ? 'rgba(33, 150, 243, 0.1)' : // Controller
                                agentName.match(/Killjoy|Cypher|Sage|Chamber|Deadlock/i) ? 'rgba(76, 175, 80, 0.1)' : // Sentinel
                                agentName.match(/Sova|Breach|Skye|KAY\/O|Fade|Gekko/i) ? 'rgba(255, 152, 0, 0.1)' : // Initiator
                                'rgba(158, 158, 158, 0.1)',
                              borderColor:
                                agentName.match(/Jett|Phoenix|Raze|Reyna|Yoru|Neon|ISO/i) ? 'rgba(244, 67, 54, 0.5)' : // Duelist
                                agentName.match(/Brimstone|Viper|Omen|Astra|Harbor|Clove/i) ? 'rgba(33, 150, 243, 0.5)' : // Controller
                                agentName.match(/Killjoy|Cypher|Sage|Chamber|Deadlock/i) ? 'rgba(76, 175, 80, 0.5)' : // Sentinel
                                agentName.match(/Sova|Breach|Skye|KAY\/O|Fade|Gekko/i) ? 'rgba(255, 152, 0, 0.5)' : // Initiator
                                'rgba(158, 158, 158, 0.5)',
                              border: '1px solid',
                              mb: 1
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
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
                teamAPlayers={teamAPlayers}
                teamBPlayers={teamBPlayers}
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
  const navigate = useNavigate();
  const teams = useSelector((state: RootState) => state.game.teams);
  const matchResult = useSelector((state: RootState) => state.game.matchResult);
  const loading = useSelector((state: RootState) => state.game.loading);

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get the selected teams' player data
  const teamAPlayers = React.useMemo(() => {
    if (!teamA) return [];
    const team = teams.find(t => t.name === teamA);
    return team?.players || [];
  }, [teamA, teams]);

  const teamBPlayers = React.useMemo(() => {
    if (!teamB) return [];
    const team = teams.find(t => t.name === teamB);
    return team?.players || [];
  }, [teamB, teams]);

  const handleSimulate = async () => {
    try {
      setError(null); // Clear any previous errors
      if (teamA && teamB && teamA !== teamB) {
        console.log(`Simulating match: ${teamA} vs ${teamB}`);
        const result = await dispatch(simulateMatchThunk({ team_a: teamA, team_b: teamB }));
        
        // Check for rejection
        if (simulateMatchThunk.rejected.match(result)) {
          // Handle rejection specifically
          const errorMessage = result.error?.message || 'Unknown error occurred';
          console.error('Match simulation failed:', errorMessage);
          setError(`Match simulation failed: ${errorMessage}`);
        }
      }
    } catch (error: any) {
      // Handle any uncaught exceptions
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      console.error('Error simulating match:', errorMessage);
      setError(`Error: ${errorMessage}`);
    }
  };

  const handleNewMatch = () => {
    try {
      dispatch(resetMatchResult());
      setTeamA('');
      setTeamB('');
      setError(null); // Clear errors on new match
    } catch (error) {
      console.error('Error clearing match:', error);
    }
  };

  const navigateToTeamCreation = () => {
    navigate('/team-creation');
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
            onClick={navigateToTeamCreation}
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
          {!matchResult ? (
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
                  
                  {/* Error message display */}
                  {error && (
                    <Grid item xs={12}>
                      <Box 
                        sx={{ 
                          mt: 2, 
                          p: 2, 
                          bgcolor: 'error.lighter', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'error.main'
                        }}
                      >
                        <Typography color="error.main" variant="body2">
                          {error}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grow>
          ) : (
            <Box>
              <ErrorBoundary>
                <MatchResultDisplay 
                  result={matchResult} 
                  teamA={teamA} 
                  teamB={teamB} 
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                />
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