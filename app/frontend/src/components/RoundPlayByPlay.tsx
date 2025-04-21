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
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
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

interface RoundPlayByPlayProps {
  teamA: string;
  teamB: string;
  teamAId: string;
  teamBId: string;
  mapName: string;
  roundNumber: number;
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
          round_number: roundNumber,
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
        
        // Call API to simulate round using fetch directly
        const response = await fetch('/api/v1/matches/simulate-round', {
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
        
        // Start with showing the first event if autoplay
        if (autoplay) {
          setCurrentEventIndex(0);
          setDisplayedEvents([data.round_data.events[0]]);
        }
        
        // Record successful simulation
        recordUserInteraction('RoundPlayByPlay', 'simulation_success', {
          roundNumber,
          eventCount: data.round_data.events.length,
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
    if (!isPlaying || !roundData || currentEventIndex >= roundData.round_data.events.length - 1) return;
    
    const timer = setTimeout(() => {
      // Move to next event
      const nextIndex = currentEventIndex + 1;
      if (nextIndex < roundData.round_data.events.length) {
        setCurrentEventIndex(nextIndex);
        setDisplayedEvents(prev => [...prev, roundData.round_data.events[nextIndex]]);
        
        // Update round time based on event timestamp
        const eventTime = roundData.round_data.events[nextIndex].timestamp;
        setRoundTimeRemaining(Math.max(0, 100 - eventTime));
      } else {
        // End of events, stop playing
        setIsPlaying(false);
        if (onComplete) {
          onComplete(roundData);
        }
      }
    }, getEventDelay());
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, roundData, getEventDelay, onComplete]);

  // Handle play/pause button
  const handlePlayPause = () => {
    // If at the beginning and pressing play, show first event
    if (currentEventIndex === -1 && !isPlaying && roundData) {
      setCurrentEventIndex(0);
      setDisplayedEvents([roundData.round_data.events[0]]);
    }
    setIsPlaying(prev => !prev);
    
    // Record user interaction
    recordUserInteraction('RoundPlayByPlay', isPlaying ? 'pause' : 'play');
  };

  // Handle skip to next event
  const handleNext = () => {
    if (!roundData) return;
    
    const nextIndex = Math.min(currentEventIndex + 1, roundData.round_data.events.length - 1);
    setCurrentEventIndex(nextIndex);
    
    // If this is the first event being shown
    if (currentEventIndex === -1) {
      setDisplayedEvents([roundData.round_data.events[0]]);
    } else if (nextIndex > currentEventIndex) {
      setDisplayedEvents(prev => [...prev, roundData.round_data.events[nextIndex]]);
    }
    
    // Update round time
    if (roundData.round_data.events[nextIndex]) {
      setRoundTimeRemaining(Math.max(0, 100 - roundData.round_data.events[nextIndex].timestamp));
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
    if (roundData.round_data.events[prevIndex]) {
      setRoundTimeRemaining(Math.max(0, 100 - roundData.round_data.events[prevIndex].timestamp));
    }
    
    recordUserInteraction('RoundPlayByPlay', 'previous_event');
  };

  // Handle skip to end
  const handleSkipToEnd = () => {
    if (!roundData) return;
    
    setCurrentEventIndex(roundData.round_data.events.length - 1);
    setDisplayedEvents(roundData.round_data.events);
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
            disabled={!roundData || currentEventIndex >= roundData.round_data.events.length - 1}
          >
            <SkipNextIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleSkipToEnd}
            disabled={!roundData || currentEventIndex >= roundData.round_data.events.length - 1}
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
      <Timeline position="alternate">
        {displayedEvents.map((event, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="text.secondary">
              {formatTime(100 - event.timestamp)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={
                event.type === 'kill' ? 'error' :
                event.type === 'plant' ? 'warning' :
                event.type === 'defuse' ? 'success' :
                event.type === 'ability' ? 'secondary' : 'primary'
              }>
                {getEventIcon(event.type)}
              </TimelineDot>
              {index < displayedEvents.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Card variant="outlined" sx={{ 
                mb: 1, 
                borderLeft: 4, 
                borderColor: getEventColor(event.type) 
              }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body1">
                    {event.description}
                  </Typography>
                  {event.player_name && (
                    <Typography variant="body2" color="text.secondary">
                      Player: {event.player_name}
                    </Typography>
                  )}
                  {event.details && (
                    <Typography variant="body2" color="text.secondary">
                      {Object.entries(event.details)
                        .filter(([key]) => key !== 'position')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' | ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      
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