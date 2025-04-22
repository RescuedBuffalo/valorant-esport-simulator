import React, { useState, useEffect, useCallback } from 'react';
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
  useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PersonIcon from '@mui/icons-material/Person';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import GradeIcon from '@mui/icons-material/Grade';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { RoundSimulationRequest, RoundSimulationResponse, RoundEvent } from '../types/api.types';
import { recordUserInteraction } from '../utils/metrics';
import { config } from '../config'; // Import config to get API_URL

interface RoundPlayByPlayProps {
  teamA: string;
  teamB: string;
  teamAId: string;
  teamBId: string;
  mapName: string;
  roundNumber: string;
  economy?: {
    teamA: number;
    teamB: number;
  };
  lossStreaks?: {
    teamA: number;
    teamB: number;
  };
  agentSelections?: {
    teamA: Record<string, string>;
    teamB: Record<string, string>;
  };
  onComplete?: (result: RoundSimulationResponse) => void;
  onCancel?: () => void;
  autoplay?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}

// Helper for getting appropriate icon for each event type
const getEventIcon = (eventType: string): React.ReactElement => {
  switch (eventType) {
    case 'kill':
      return <LocalFireDepartmentIcon color="error" />;
    case 'ability':
      return <FlashOnIcon color="secondary" />;
    case 'plant':
      return <GradeIcon color="warning" />;
    case 'defuse':
      return <GradeIcon color="info" />;
    default:
      return <SportsEsportsIcon />;
  }
};

// Helper for generating event color based on event type
const getEventColor = (eventType: string): string => {
  switch (eventType) {
    case 'kill':
      return 'error.main';
    case 'ability':
      return 'secondary.main';
    case 'plant':
      return 'warning.main';
    case 'defuse':
      return 'info.main';
    default:
      return 'text.primary';
  }
};

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Generate round events from the round data
const generateEventsFromRoundData = (data: RoundSimulationResponse): RoundEvent[] => {
  const events: RoundEvent[] = [];
  const roundData = data.round_data;
  const teamAInfo = data.team_info?.team_a;
  const teamBInfo = data.team_info?.team_b;
  
  // Helper to get random player from a team
  const getRandomPlayer = (team: 'team_a' | 'team_b') => {
    const players = team === 'team_a' ? teamAInfo?.players : teamBInfo?.players;
    if (!players || players.length === 0) return null;
    return players[Math.floor(Math.random() * players.length)];
  };
  
  // Round start event
  events.push({
    event_type: 'comment',
    timestamp: 5,
    position: [0, 0],
    player_id: '',
    details: { message: `Round ${roundData.round_number + 1} begins!` }
  });
  
  // Team strategies
  if (roundData.att_strategy) {
    events.push({
      event_type: 'comment',
      timestamp: 10,
      position: [0, 0],
      player_id: '',
      details: { message: `Attackers strategy: ${roundData.att_strategy}` }
    });
  }
  
  if (roundData.def_strategy) {
    events.push({
      event_type: 'comment',
      timestamp: 15,
      position: [0, 0],
      player_id: '',
      details: { message: `Defenders strategy: ${roundData.def_strategy}` }
    });
  }
  
  // Add ability usage events for both teams
  let timestamp = 20;
  
  // Process player loadouts for both teams
  if (roundData.player_loadouts) {
    // Team A player events
    if ('team_a' in roundData.player_loadouts) {
      const teamALoadouts = roundData.player_loadouts.team_a as Record<string, any>;
      Object.entries(teamALoadouts).forEach(([playerId, loadout]) => {
        if (loadout && loadout.ability_used) {
          const player = teamAInfo?.players.find(p => p.id === playerId);
          timestamp += Math.random() * 5;
          
          if (player) {
            events.push({
              event_type: 'ability',
              timestamp,
              position: [Math.random(), Math.random()],
              player_id: playerId,
              details: { 
                message: `${player.gamerTag} uses an ability with ${loadout.ability_impact || 'neutral'} impact!`,
                impact: loadout.ability_impact || 'neutral'
              }
            });
          }
        }
      });
    }
    
    // Team B player events
    if ('team_b' in roundData.player_loadouts) {
      const teamBLoadouts = roundData.player_loadouts.team_b as Record<string, any>;
      Object.entries(teamBLoadouts).forEach(([playerId, loadout]) => {
        if (loadout && loadout.ability_used) {
          const player = teamBInfo?.players.find(p => p.id === playerId);
          timestamp += Math.random() * 5;
          
          if (player) {
            events.push({
              event_type: 'ability',
              timestamp,
              position: [Math.random(), Math.random()],
              player_id: playerId,
              details: { 
                message: `${player.gamerTag} uses an ability with ${loadout.ability_impact || 'neutral'} impact!`,
                impact: loadout.ability_impact || 'neutral'
              }
            });
          }
        }
      });
    }
  }
  
  // Add spike plant event if applicable
  if (roundData.spike_planted) {
    const planter = getRandomPlayer(roundData.winner === 'team_a' ? 'team_a' : 'team_b');
    timestamp = 45 + Math.random() * 10;
    
    if (planter) {
      events.push({
        event_type: 'plant',
        timestamp,
        position: [Math.random(), Math.random()],
        player_id: planter.id,
        details: { 
          message: `${planter.gamerTag} plants the spike!`,
          site: Math.random() > 0.5 ? 'A' : 'B' 
        }
      });
    }
    
    // Add defuse event if defenders won
    if ((roundData.winner === 'team_a' && roundData.att_strategy === 'def_strategy') || 
        (roundData.winner === 'team_b' && roundData.att_strategy !== 'def_strategy')) {
      const defuser = getRandomPlayer(roundData.winner === 'team_a' ? 'team_a' : 'team_b');
      
      if (defuser) {
        events.push({
          event_type: 'defuse',
          timestamp: timestamp + 15 + Math.random() * 10,
          position: [Math.random(), Math.random()],
          player_id: defuser.id,
          details: { message: `${defuser.gamerTag} defuses the spike!` }
        });
      }
    }
  }
  
  // Add final round outcome
  events.push({
    event_type: 'comment',
    timestamp: 85 + Math.random() * 10,
    position: [0, 0],
    player_id: '',
    details: { message: roundData.summary || 'Round complete' }
  });
  
  // Sort events by timestamp and return
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

const RoundPlayByPlay: React.FC<RoundPlayByPlayProps> = ({
  teamA,
  teamB,
  teamAId,
  teamBId,
  mapName,
  roundNumber,
  economy,
  lossStreaks,
  agentSelections,
  onComplete,
  onCancel,
  autoplay = true,
  speed = 'normal',
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundData, setRoundData] = useState<RoundSimulationResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [displayedEvents, setDisplayedEvents] = useState<RoundEvent[]>([]);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(100); // 100 seconds in a round
  const [events, setEvents] = useState<RoundEvent[]>([]);

  // Get delay between events based on speed setting
  const getEventDelay = useCallback(() => {
    switch (speed) {
      case 'slow': return 3000;
      case 'fast': return 800;
      default: return 1500; // normal
    }
  }, [speed]);

  // Fetch round data on component mount
  useEffect(() => {
    const fetchRoundData = async () => {
      try {
        setIsLoading(true);
        
        // Record user interaction for analytics
        recordUserInteraction('RoundPlayByPlay', 'fetch_round_data', {
          teamA: teamAId,
          teamB: teamBId,
          roundNumber,
          mapName,
        });
        
        // Prepare request payload
        const requestData: RoundSimulationRequest = {
          team_a: teamAId,
          team_b: teamBId,
          map_name: mapName,
          round_number: parseInt(roundNumber, 10),
        };
        
        // Add optional params if provided
        if (economy) {
          requestData.economy = {
            team_a: economy.teamA,
            team_b: economy.teamB,
          };
        }
        
        if (lossStreaks) {
          requestData.loss_streaks = {
            team_a: lossStreaks.teamA,
            team_b: lossStreaks.teamB,
          };
        }
        
        if (agentSelections) {
          requestData.agent_selections = {
            team_a: agentSelections.teamA,
            team_b: agentSelections.teamB,
          };
        }
        
        // Call API to simulate round using fetch directly with the proper API URL
        const response = await fetch(`${config.API_URL}/api/v1/matches/simulate-round`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data: RoundSimulationResponse = await response.json();
        setRoundData(data);
        
        // Generate events from round data since backend doesn't provide them
        const generatedEvents = generateEventsFromRoundData(data);
        setEvents(generatedEvents);
        
        // Start with showing the first event if autoplay
        if (autoplay && generatedEvents.length > 0) {
          setCurrentEventIndex(0);
          setDisplayedEvents([generatedEvents[0]]);
        }
        
        // Record successful simulation
        recordUserInteraction('RoundPlayByPlay', 'simulation_success', {
          roundNumber,
          eventCount: generatedEvents.length,
        });
      } catch (err) {
        console.error('Error fetching round data:', err);
        setError('Failed to load round simulation data.');
        
        // Record error for analytics
        recordUserInteraction('RoundPlayByPlay', 'simulation_error', {
          roundNumber,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoundData();
  }, [teamAId, teamBId, mapName, roundNumber, economy, lossStreaks, agentSelections, autoplay]);

  // Process events based on current index and playing state
  useEffect(() => {
    if (!isPlaying || events.length === 0 || currentEventIndex >= events.length - 1) return;
    
    const timer = setTimeout(() => {
      // Move to next event
      const nextIndex = currentEventIndex + 1;
      if (nextIndex < events.length) {
        setCurrentEventIndex(nextIndex);
        setDisplayedEvents(prev => [...prev, events[nextIndex]]);
        
        // Update round time based on event timestamp
        const eventTime = events[nextIndex].timestamp;
        setRoundTimeRemaining(Math.max(0, 100 - eventTime));
      } else {
        // End of events, stop playing
        setIsPlaying(false);
        if (onComplete && roundData) {
          onComplete(roundData);
        }
      }
    }, getEventDelay());
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, events, roundData, getEventDelay, onComplete]);

  // Handle play/pause button
  const handlePlayPause = () => {
    // If at the beginning and pressing play, show first event
    if (currentEventIndex === -1 && !isPlaying && events.length > 0) {
      setCurrentEventIndex(0);
      setDisplayedEvents([events[0]]);
    }
    setIsPlaying(prev => !prev);
    
    // Record user interaction
    recordUserInteraction('RoundPlayByPlay', isPlaying ? 'pause' : 'play');
  };

  // Handle skip to next event
  const handleNext = () => {
    if (!roundData || events.length === 0) return;
    
    const nextIndex = Math.min(currentEventIndex + 1, events.length - 1);
    setCurrentEventIndex(nextIndex);
    
    // If this is the first event being shown
    if (currentEventIndex === -1) {
      setDisplayedEvents([events[0]]);
    } else if (nextIndex > currentEventIndex) {
      setDisplayedEvents(prev => [...prev, events[nextIndex]]);
    }
    
    // Update round time
    if (events[nextIndex]) {
      setRoundTimeRemaining(Math.max(0, 100 - events[nextIndex].timestamp));
    }
    
    recordUserInteraction('RoundPlayByPlay', 'next_event');
  };

  // Handle skip to previous event
  const handlePrevious = () => {
    if (currentEventIndex <= 0 || !roundData) return;
    
    const prevIndex = currentEventIndex - 1;
    setCurrentEventIndex(prevIndex);
    setDisplayedEvents(prev => prev.slice(0, prev.length - 1));
    
    // Update round time
    if (events[prevIndex]) {
      setRoundTimeRemaining(Math.max(0, 100 - events[prevIndex].timestamp));
    }
    
    recordUserInteraction('RoundPlayByPlay', 'previous_event');
  };

  // Handle skip to end
  const handleSkipToEnd = () => {
    if (!roundData || events.length === 0) return;
    
    setCurrentEventIndex(events.length - 1);
    setDisplayedEvents(events);
    setRoundTimeRemaining(0);
    setIsPlaying(false);
    
    recordUserInteraction('RoundPlayByPlay', 'skip_to_end');
    
    if (onComplete) {
      onComplete(roundData);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Simulating round...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="h6">{error}</Typography>
        <Button variant="contained" color="primary" onClick={onCancel} sx={{ mt: 2 }}>
          Back
        </Button>
      </Paper>
    );
  }

  // Render no data state
  if (!roundData) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>No round data available.</Typography>
        <Button variant="contained" color="primary" onClick={onCancel} sx={{ mt: 2 }}>
          Back
        </Button>
      </Paper>
    );
  }

  // Get team names from the response if available
  const teamAName = roundData.team_info?.team_a?.name || teamA;
  const teamBName = roundData.team_info?.team_b?.name || teamB;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header with round info and controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Round {roundNumber}: {teamAName} vs {teamBName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={`Time: ${formatTime(roundTimeRemaining)}`}
            color="default"
            sx={{ mr: 2 }}
          />
          <IconButton onClick={handlePrevious} disabled={currentEventIndex <= 0}>
            <SkipPreviousIcon />
          </IconButton>
          <IconButton onClick={handlePlayPause}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton 
            onClick={handleNext} 
            disabled={events.length === 0 || currentEventIndex >= events.length - 1}
          >
            <SkipNextIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleSkipToEnd}
            disabled={events.length === 0 || currentEventIndex >= events.length - 1}
            sx={{ ml: 1 }}
          >
            Skip to End
          </Button>
        </Box>
      </Box>
      
      {/* Economy information */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Chip 
          label={`${teamAName} Economy: $${roundData.round_data.economy.team_a}`}
          color="primary"
        />
        <Chip 
          label={`${teamBName} Economy: $${roundData.round_data.economy.team_b}`}
          color="secondary"
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Timeline of round events */}
      <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', mx: 'auto', my: 3 }}>
        {displayedEvents.map((event, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
              mb: 2,
              position: 'relative'
            }}
          >
            {/* Event time */}
            <Box sx={{ width: '80px', textAlign: 'center', pt: 1 }}>
              <Typography color="text.secondary">
                {formatTime(100 - event.timestamp)}
              </Typography>
            </Box>
            
            {/* Center line with icon */}
            <Box sx={{ 
              width: '60px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative'
            }}>
              <Box 
                sx={{ 
                  height: index === 0 ? '50%' : '100%', 
                  width: '2px', 
                  bgcolor: 'divider',
                  position: 'absolute',
                  top: index === 0 ? '50%' : 0,
                  zIndex: 0
                }} 
              />
              {index < displayedEvents.length - 1 && (
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: '2px', 
                    bgcolor: 'divider',
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 0
                  }} 
                />
              )}
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 
                    event.event_type === 'kill' ? 'error.main' :
                    event.event_type === 'plant' ? 'warning.main' :
                    event.event_type === 'defuse' ? 'success.main' :
                    event.event_type === 'ability' ? 'secondary.main' : 'primary.main',
                  color: 'white',
                  zIndex: 1,
                  my: 1
                }}
              >
                {getEventIcon(event.event_type)}
              </Box>
            </Box>
            
            {/* Event content */}
            <Box sx={{ flex: 1, maxWidth: '350px' }}>
              <Card variant="outlined" sx={{ 
                borderLeft: 4, 
                borderColor: getEventColor(event.event_type) 
              }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body1">
                    {event.details?.message}
                  </Typography>
                  {event.player_id && (
                    <Typography variant="body2" color="text.secondary">
                      Player ID: {event.player_id}
                    </Typography>
                  )}
                  {event.details && (
                    <Typography variant="body2" color="text.secondary">
                      {Object.entries(event.details || {})
                        .filter(([key]) => key !== 'message')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' | ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        ))}
      </Box>
      
      {/* Bottom controls for completing the simulation */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => {
            if (onComplete && roundData) {
              onComplete(roundData);
            }
          }}
        >
          Complete
        </Button>
        {onCancel && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onCancel}
            sx={{ ml: 1 }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default RoundPlayByPlay; 