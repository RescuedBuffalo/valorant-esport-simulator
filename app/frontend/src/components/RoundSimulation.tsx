import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ForwardIcon from '@mui/icons-material/Forward';
import EastIcon from '@mui/icons-material/East';
import WestIcon from '@mui/icons-material/West';
import ShieldIcon from '@mui/icons-material/Shield';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getRoleColor } from '../data/agents';

// Types
type PlayerId = string;
type TeamId = string;

interface PlayerLoadout {
  weapon: string;
  armor: boolean;
  total_spend: number;
  agent: string;
  ability_used: boolean;
  ability_impact: string | null;
}

interface TeamLoadouts {
  [playerId: string]: PlayerLoadout;
}

interface RoundLoadouts {
  team_a: TeamLoadouts;
  team_b: TeamLoadouts;
}

interface RoundEvent {
  timestamp: number;
  type: 'kill' | 'ability' | 'plant' | 'defuse' | 'comment';
  playerId?: PlayerId;
  targetId?: PlayerId;
  comment: string;
  position?: [number, number];
}

interface RoundData {
  round_number: number;
  is_pistol_round: boolean;
  attacking_team: TeamId;
  defending_team: TeamId;
  winner: TeamId;
  spike_planted: boolean;
  player_loadouts: RoundLoadouts;
  events: RoundEvent[];
  economy: {
    team_a: number;
    team_b: number;
  };
  economy_log?: {
    team_a_start: number;
    team_b_start: number;
    team_a_spend: number;
    team_b_spend: number;
    team_a_reward: number;
    team_b_reward: number;
  };
}

// Mock commentator phrases
const COMMENTATOR_PHRASES = {
  roundStart: [
    "The round begins with {attackTeam} on the attack.",
    "Both teams are taking their positions as {attackTeam} prepares to attack.",
    "{attackTeam} is on the attack with {defendTeam} setting up their defense.",
    "Players are moving into position for round {roundNumber}.",
  ],
  pistolRound: [
    "It's pistol round! Economy will be key here.",
    "Pistol round is crucial - winning this gives a huge economic advantage.",
    "Classic pistols at the ready as we start this important pistol round.",
  ],
  ecoRound: [
    "{team} is on an eco round, looking to do damage with minimal investment.",
    "With limited resources, {team} opts for an eco strategy.",
    "{team} saving their credits this round with a basic loadout.",
  ],
  fullBuy: [
    "{team} comes in with a full buy, looking strong with rifles and armor.",
    "Full equipment for {team} this round, they're ready to fight.",
    "{team} not holding back on the spending this round with a complete loadout.",
  ],
  abilities: [
    "{player} uses {agent}'s abilities to gain an advantage!",
    "Great utility usage from {player} playing {agent}!",
    "{player} creating space with {agent}'s abilities!",
  ],
  kill: [
    "{player} takes down {target} with a clean shot!",
    "{player} eliminates {target} from the round!",
    "Beautiful shot by {player} to take out {target}!",
    "{player} wins the duel against {target}!",
  ],
  plantAttempt: [
    "The spike is being planted at site {site}!",
    "{team} making a move to plant the spike at {site}!",
    "Planting attempt at {site} by {team}!",
  ],
  plantSuccess: [
    "Spike planted! The pressure is on {defendTeam} to defuse.",
    "Spike is down at site {site}! {defendTeam} needs to retake.",
    "Successful plant by {team}! Now they need to defend it.",
  ],
  defuseAttempt: [
    "{player} is trying to defuse the spike!",
    "Defuse attempt coming in from {player}!",
    "{player} going for the defuse under pressure!",
  ],
  teamEliminated: [
    "{team} has been eliminated! {winningTeam} takes the round.",
    "All players from {team} are down! Round goes to {winningTeam}.",
    "{winningTeam} wins by eliminating all of {team}!",
  ],
  timeExpired: [
    "Time has expired! {winningTeam} wins the round.",
    "The clock runs out, giving {winningTeam} the round victory.",
    "{winningTeam} successfully stalls until the end of the round!",
  ],
  spikeExploded: [
    "BOOM! The spike detonates, giving {attackTeam} the round!",
    "The spike explodes! {attackTeam} wins the round!",
    "{attackTeam} successfully protects the spike until detonation!",
  ],
  clutch: [
    "What a clutch by {player}! Turning a {vsText} situation into a win!",
    "Incredible performance by {player} to clutch this {vsText}!",
    "{player} with nerves of steel, winning that {vsText} clutch!",
  ],
};

// Helper to get a random phrase
const getRandomPhrase = (category: keyof typeof COMMENTATOR_PHRASES) => {
  const phrases = COMMENTATOR_PHRASES[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

// Format a comment with player names, team names, etc.
const formatComment = (
  comment: string, 
  data: {
    player?: string;
    target?: string;
    team?: string;
    attackTeam?: string;
    defendTeam?: string;
    winningTeam?: string;
    agent?: string;
    site?: string;
    roundNumber?: number;
    vsText?: string;
  }
) => {
  let result = comment;
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const replaceValue = value.toString();
      result = result.replace(new RegExp(`{${key}}`, 'g'), replaceValue);
    }
  });
  return result;
};

// The detailed round simulation component
const RoundSimulation: React.FC<{
  teamA: string;
  teamB: string;
  teamAPlayers: any[];
  teamBPlayers: any[];
  roundData: RoundData;
  onComplete?: () => void;
  onCancel?: () => void;
  autoplay?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}> = ({
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  roundData,
  onComplete,
  onCancel,
  autoplay = true,
  speed = 'normal',
}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [displayedEvents, setDisplayedEvents] = useState<RoundEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(100); // 100 seconds for a round
  
  // Player name mapping
  const playerNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    
    teamAPlayers?.forEach(player => {
      map[player.id] = `${player.firstName} "${player.gamerTag}" ${player.lastName}`;
    });
    
    teamBPlayers?.forEach(player => {
      map[player.id] = `${player.firstName} "${player.gamerTag}" ${player.lastName}`;
    });
    
    return map;
  }, [teamAPlayers, teamBPlayers]);
  
  // Get readable team names
  const getTeamName = (teamId: TeamId) => teamId === 'team_a' ? teamA : teamB;
  
  // Get player display name
  const getPlayerName = (playerId: string) => {
    return playerNameMap[playerId] || `Player_${playerId.substring(0, 4)}`;
  };
  
  // Delay between events based on speed setting
  const getEventDelay = () => {
    switch (speed) {
      case 'slow': return 3000;
      case 'fast': return 800;
      default: return 1500; // normal
    }
  };
  
  // Process the next event
  useEffect(() => {
    if (!isPlaying || currentEventIndex >= roundData.events.length - 1) return;
    
    const timeoutId = setTimeout(() => {
      setCurrentEventIndex(prev => prev + 1);
      setDisplayedEvents(prev => [
        ...prev, 
        roundData.events[currentEventIndex + 1]
      ]);
      
      // Update time remaining for realism
      if (roundData.events[currentEventIndex + 1]) {
        const eventTime = roundData.events[currentEventIndex + 1].timestamp;
        setTimeRemaining(prev => Math.max(0, 100 - eventTime));
      }
    }, getEventDelay());
    
    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentEventIndex, roundData.events, speed]);
  
  // Add initial round start events if none exist
  useEffect(() => {
    if (!roundData.events || roundData.events.length === 0 || displayedEvents.length > 0) return;
    
    const attackingTeamName = getTeamName(roundData.attacking_team);
    const defendingTeamName = getTeamName(roundData.defending_team);
    
    const initialEvents: RoundEvent[] = [];
    
    // Round start comment
    initialEvents.push({
      timestamp: 0,
      type: 'comment',
      comment: formatComment(getRandomPhrase('roundStart'), {
        attackTeam: attackingTeamName,
        defendTeam: defendingTeamName,
        roundNumber: roundData.round_number + 1,
      }),
    });
    
    // Pistol round comment
    if (roundData.is_pistol_round) {
      initialEvents.push({
        timestamp: 1,
        type: 'comment',
        comment: getRandomPhrase('pistolRound'),
      });
    }
    
    // Team economy comments
    if (roundData.economy_log) {
      const teamASpend = roundData.economy_log.team_a_spend;
      const teamBSpend = roundData.economy_log.team_b_spend;
      
      // Team A economy comment
      if (teamASpend < 3000) {
        initialEvents.push({
          timestamp: 2,
          type: 'comment',
          comment: formatComment(getRandomPhrase('ecoRound'), { team: teamA }),
        });
      } else if (teamASpend > 15000) {
        initialEvents.push({
          timestamp: 2,
          type: 'comment',
          comment: formatComment(getRandomPhrase('fullBuy'), { team: teamA }),
        });
      }
      
      // Team B economy comment
      if (teamBSpend < 3000) {
        initialEvents.push({
          timestamp: 3,
          type: 'comment',
          comment: formatComment(getRandomPhrase('ecoRound'), { team: teamB }),
        });
      } else if (teamBSpend > 15000) {
        initialEvents.push({
          timestamp: 3,
          type: 'comment',
          comment: formatComment(getRandomPhrase('fullBuy'), { team: teamB }),
        });
      }
    }
    
    setDisplayedEvents(initialEvents);
    setCurrentEventIndex(initialEvents.length - 1);
  }, [roundData, displayedEvents.length, getTeamName]);
  
  // Check if simulation is complete
  useEffect(() => {
    if (currentEventIndex >= roundData.events.length - 1 && onComplete && displayedEvents.length > 0) {
      // Add a delay before calling onComplete
      const completionTimeout = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(completionTimeout);
    }
  }, [currentEventIndex, roundData.events.length, onComplete, displayedEvents.length]);
  
  // Control functions
  const handlePlayPause = () => setIsPlaying(prev => !prev);
  const handleNext = () => {
    if (currentEventIndex < roundData.events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
      setDisplayedEvents(prev => [
        ...prev, 
        roundData.events[currentEventIndex + 1]
      ]);
    }
  };
  const handlePrevious = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(prev => prev - 1);
      setDisplayedEvents(prev => prev.slice(0, prev.length - 1));
    }
  };
  const handleSkipToEnd = () => {
    setCurrentEventIndex(roundData.events.length - 1);
    setDisplayedEvents(roundData.events);
  };
  
  const handleTimeoutRequest = () => {
    setIsPlaying(false);
    setDialogOpen(true);
  };
  
  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', p: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Round Info Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Round {roundData.round_number + 1}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {roundData.is_pistol_round && (
                <Chip 
                  label="Pistol Round" 
                  color="secondary" 
                  size="small" 
                />
              )}
              <Chip 
                label={`${timeRemaining} seconds`}
                size="small"
                icon={<AccessTimeIcon />}
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              color="warning"
              onClick={handleTimeoutRequest}
            >
              Timeout
            </Button>
            <IconButton onClick={handlePrevious} disabled={currentEventIndex <= 0}>
              <SkipPreviousIcon />
            </IconButton>
            <IconButton onClick={handlePlayPause}>
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={handleNext} disabled={currentEventIndex >= roundData.events.length - 1}>
              <SkipNextIcon />
            </IconButton>
            <IconButton onClick={handleSkipToEnd} disabled={currentEventIndex >= roundData.events.length - 1}>
              <ForwardIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Team Scoreboard */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={5}>
            <Card variant="outlined" sx={{ 
              bgcolor: roundData.attacking_team === 'team_a' ? 'rgba(255,99,71,0.1)' : 'rgba(30,144,255,0.1)'
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                  {teamA}
                </Typography>
                {roundData.attacking_team === 'team_a' ? (
                  <Chip 
                    icon={<EastIcon />}
                    label="Attack"
                    size="small"
                    color="error"
                  />
                ) : (
                  <Chip 
                    icon={<ShieldIcon />}
                    label="Defense"
                    size="small"
                    color="info"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              VS
            </Typography>
          </Grid>
          
          <Grid item xs={5}>
            <Card variant="outlined" sx={{ 
              bgcolor: roundData.attacking_team === 'team_b' ? 'rgba(255,99,71,0.1)' : 'rgba(30,144,255,0.1)'
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                  {teamB}
                </Typography>
                {roundData.attacking_team === 'team_b' ? (
                  <Chip 
                    icon={<EastIcon />}
                    label="Attack"
                    size="small"
                    color="error"
                  />
                ) : (
                  <Chip 
                    icon={<ShieldIcon />}
                    label="Defense"
                    size="small"
                    color="info"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Commentary Feed */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: '300px', 
            overflowY: 'auto',
            bgcolor: theme.palette.background.default,
            mb: 3
          }}
        >
          {displayedEvents.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Round simulation starting...
              </Typography>
            </Box>
          ) : (
            displayedEvents.map((event, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 1, 
                  mb: 1, 
                  borderRadius: 1,
                  bgcolor: index === currentEventIndex ? 'rgba(0,0,0,0.1)' : 'transparent',
                  transition: 'background-color 0.3s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip 
                    label={`${Math.floor(event.timestamp)}s`}
                    size="small"
                    sx={{ mr: 1, minWidth: '50px' }}
                  />
                  {event.type === 'kill' && (
                    <Chip 
                      label="Kill"
                      size="small"
                      color="error"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {event.type === 'ability' && (
                    <Chip 
                      label="Ability"
                      size="small"
                      color="secondary"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {event.type === 'plant' && (
                    <Chip 
                      label="Spike Plant"
                      size="small"
                      color="warning"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {event.type === 'defuse' && (
                    <Chip 
                      label="Spike Defuse"
                      size="small"
                      color="success"
                      sx={{ mr: 1 }}
                    />
                  )}
                </Box>
                
                <Typography variant="body1">
                  {event.comment}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
        
        {/* Players and Loadouts */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {teamA} Loadouts
            </Typography>
            <Box>
              {teamAPlayers.map(player => {
                const playerId = player.id;
                const loadout = roundData.player_loadouts.team_a[playerId];
                if (!loadout) return null;
                
                return (
                  <Box 
                    key={playerId} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        bgcolor: getRoleColor(loadout.agent.toLowerCase())
                      }}
                    >
                      {loadout.agent.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {player.firstName} "{player.gamerTag}" {player.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={loadout.weapon} size="small" />
                        {loadout.armor && <Chip label="Armor" size="small" variant="outlined" />}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {teamB} Loadouts
            </Typography>
            <Box>
              {teamBPlayers.map(player => {
                const playerId = player.id;
                const loadout = roundData.player_loadouts.team_b[playerId];
                if (!loadout) return null;
                
                return (
                  <Box 
                    key={playerId} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        bgcolor: getRoleColor(loadout.agent.toLowerCase())
                      }}
                    >
                      {loadout.agent.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {player.firstName} "{player.gamerTag}" {player.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={loadout.weapon} size="small" />
                        {loadout.armor && <Chip label="Armor" size="small" variant="outlined" />}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Grid>
        </Grid>
        
        {/* Timeout Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Tactical Timeout</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              The team has called a timeout to discuss strategy. Timeouts can be used to break
              the enemy team's momentum or to realign your team's approach.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                Current Economy:
              </Typography>
              <Typography variant="body2">
                {teamA}: ${roundData.economy.team_a}
              </Typography>
              <Typography variant="body2">
                {teamB}: ${roundData.economy.team_b}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="primary">
              End Timeout
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default RoundSimulation; 