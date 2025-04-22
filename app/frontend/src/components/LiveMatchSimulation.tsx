import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { simulateMatchThunk } from '../store/thunks/gameThunks';
import type { MatchResult } from '../store/slices/gameSlice';
import RoundSimulation from './RoundSimulation';
import type { RoundEvent } from '../services/api';

type SimulationSpeed = 'slow' | 'normal' | 'fast';

// Mock events for demonstration (will be replaced by API data)
const generateMockEvents = (roundNumber: number, attackingTeam: 'team_a' | 'team_b', teamAPlayers: any[], teamBPlayers: any[]): RoundEvent[] => {
  const events: RoundEvent[] = [];
  const roundDuration = 100; // seconds
  
  // Get list of players for each team
  const attackingPlayers = attackingTeam === 'team_a' ? teamAPlayers : teamBPlayers;
  const defendingPlayers = attackingTeam === 'team_a' ? teamBPlayers : teamAPlayers;
  
  // Random early events (player movements, positioning)
  events.push({
    timestamp: 5 + Math.random() * 10,
    type: 'comment',
    description: `Teams are setting up for the round, with players moving into position.`,
  });
  
  // Random mid-round events
  // First blood
  const attackerKill = Math.random() > 0.5;
  const killerIndex = Math.floor(Math.random() * (attackerKill ? attackingPlayers.length : defendingPlayers.length));
  const victimIndex = Math.floor(Math.random() * (attackerKill ? defendingPlayers.length : attackingPlayers.length));
  
  const killer = attackerKill ? attackingPlayers[killerIndex] : defendingPlayers[killerIndex];
  const victim = attackerKill ? defendingPlayers[victimIndex] : attackingPlayers[victimIndex];
  
  if (killer && victim) {
    events.push({
      timestamp: 20 + Math.random() * 15,
      type: 'kill',
      description: `${killer.firstName} "${killer.gamerTag}" ${killer.lastName} eliminates ${victim.firstName} "${victim.gamerTag}" ${victim.lastName} with a headshot!`,
      player_id: killer.id,
      player_name: `${killer.firstName} "${killer.gamerTag}" ${killer.lastName}`,
      target_id: victim.id,
      target_name: `${victim.firstName} "${victim.gamerTag}" ${victim.lastName}`,
      location: [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)],
    });
  }
  
  // More kills and events...
  // This is just a simple example - in a real implementation, these would come from the backend
  
  // Spike plant (50% chance)
  const spikePlanted = Math.random() > 0.5;
  if (spikePlanted) {
    const planter = attackingPlayers[Math.floor(Math.random() * attackingPlayers.length)];
    const site = Math.random() > 0.5 ? 'A' : 'B';
    
    if (planter) {
      events.push({
        timestamp: 45 + Math.random() * 20,
        type: 'plant',
        description: `${planter.firstName} "${planter.gamerTag}" ${planter.lastName} plants the spike at site ${site}!`,
        player_id: planter.id,
        player_name: `${planter.firstName} "${planter.gamerTag}" ${planter.lastName}`,
        location: [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)],
        details: { site }
      });
      
      // Defuse attempt (30% chance of successful defuse if spike is planted)
      const defuseSuccess = Math.random() > 0.7;
      
      if (defuseSuccess && defendingPlayers.length > 0) {
        const defuser = defendingPlayers[Math.floor(Math.random() * defendingPlayers.length)];
        
        if (defuser) {
          events.push({
            timestamp: 70 + Math.random() * 15,
            type: 'defuse',
            description: `${defuser.firstName} "${defuser.gamerTag}" ${defuser.lastName} successfully defuses the spike!`,
            player_id: defuser.id,
            player_name: `${defuser.firstName} "${defuser.gamerTag}" ${defuser.lastName}`,
            location: [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)],
          });
        }
      } else {
        // Spike detonation
        events.push({
          timestamp: 90,
          type: 'comment',
          description: `The spike detonates! Round goes to the attacking team.`,
        });
      }
    }
  } else {
    // No plant - random end of round based on eliminations
    events.push({
      timestamp: 75 + Math.random() * 15,
      type: 'comment',
      description: Math.random() > 0.5 
        ? `All attackers eliminated! Defense wins the round.`
        : `All defenders eliminated! Attackers take the round.`,
    });
  }
  
  // Sort events by timestamp
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

const LiveMatchSimulation: React.FC<{
  teamA: string;
  teamB: string;
  teamAId: string;
  teamBId: string;
  teamAPlayers: any[];
  teamBPlayers: any[];
  mapName: string;
  onComplete?: (result: MatchResult) => void;
  onCancel?: () => void;
}> = ({
  teamA,
  teamB,
  teamAId,
  teamBId,
  teamAPlayers,
  teamBPlayers,
  mapName,
  onComplete,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>('normal');
  const [isLoading, setIsLoading] = useState(true);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [currentRound, setCurrentRound] = useState(-1);
  const [roundsCompleted, setRoundsCompleted] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Simulate the match on component mount
  useEffect(() => {
    const simulateMatch = async () => {
      try {
        setIsLoading(true);
        const resultAction = await dispatch(simulateMatchThunk({
          team_a: teamAId,
          team_b: teamBId,
          map_name: mapName,
        }));
        
        if (simulateMatchThunk.fulfilled.match(resultAction)) {
          setMatchResult(resultAction.payload);
          
          // Initialize rounds completed array
          if (resultAction.payload.rounds) {
            setRoundsCompleted(new Array(resultAction.payload.rounds.length).fill(false));
            // Start with the first round
            setCurrentRound(0);
          }
        } else {
          setError('Failed to simulate match. Please try again.');
        }
      } catch (err) {
        setError('An error occurred during simulation.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    simulateMatch();
  }, [dispatch, teamAId, teamBId, mapName]);
  
  // Handle round completion
  const handleRoundComplete = () => {
    if (!matchResult) return;
    
    // Mark current round as completed
    const newCompletedRounds = [...roundsCompleted];
    newCompletedRounds[currentRound] = true;
    setRoundsCompleted(newCompletedRounds);
    
    // Move to next round or complete match
    if (currentRound < matchResult.rounds.length - 1) {
      setCurrentRound(prev => prev + 1);
    } else {
      // All rounds complete
      if (onComplete) {
        onComplete(matchResult);
      }
    }
  };
  
  // Enhance round data with play-by-play events
  const getEnhancedRoundData = (roundIndex: number) => {
    if (!matchResult || !matchResult.rounds[roundIndex]) return null;
    
    const round = matchResult.rounds[roundIndex];
    const attackingTeam = roundIndex < 12 ? 'team_a' : 'team_b';
    const defendingTeam = attackingTeam === 'team_a' ? 'team_b' : 'team_a';
    
    // Generate or retrieve events for this round
    // In a real implementation, these would come from the backend
    const apiEvents = generateMockEvents(roundIndex, attackingTeam, teamAPlayers, teamBPlayers);
    
    // Convert API events to the format expected by RoundSimulation
    const transformedEvents = apiEvents.map(event => ({
      timestamp: event.timestamp,
      type: event.type as 'kill' | 'ability' | 'plant' | 'defuse' | 'comment',
      playerId: event.player_id,
      targetId: event.target_id,
      comment: event.description,
      position: event.location
    }));
    
    return {
      round_number: roundIndex,
      is_pistol_round: roundIndex === 0 || roundIndex === 12,
      attacking_team: attackingTeam,
      defending_team: defendingTeam,
      winner: round.winner,
      spike_planted: round.spike_planted || false,
      player_loadouts: round.player_loadouts || {
        team_a: {},
        team_b: {},
      },
      events: transformedEvents,
      economy: round.economy || { team_a: 0, team_b: 0 },
      economy_log: round.economy_log,
    };
  };
  
  // Change simulation speed
  const handleSpeedChange = (speed: SimulationSpeed) => {
    setSimulationSpeed(speed);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Preparing match simulation...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!matchResult) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Unable to load match data.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      {/* Match Info Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Live Match Simulation
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={5}>
            <Typography variant="h6" align="right">{teamA}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="h6" align="center">vs</Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography variant="h6" align="left">{teamB}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" align="center">
              Map: {mapName}
            </Typography>
          </Grid>
        </Grid>
        
        {/* Score Display */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {matchResult.score.team_a}
          </Typography>
          <Typography variant="h5" sx={{ mx: 2 }}>:</Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {matchResult.score.team_b}
          </Typography>
        </Box>
        
        {/* Simulation Speed Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Button 
            variant={simulationSpeed === 'slow' ? 'contained' : 'outlined'} 
            size="small"
            onClick={() => handleSpeedChange('slow')}
          >
            Slow
          </Button>
          <Button 
            variant={simulationSpeed === 'normal' ? 'contained' : 'outlined'} 
            size="small"
            onClick={() => handleSpeedChange('normal')}
          >
            Normal
          </Button>
          <Button 
            variant={simulationSpeed === 'fast' ? 'contained' : 'outlined'} 
            size="small"
            onClick={() => handleSpeedChange('fast')}
          >
            Fast
          </Button>
        </Box>
      </Paper>
      
      {/* Round Stepper */}
      <Stepper activeStep={currentRound} orientation="vertical">
        {matchResult.rounds.map((round, index) => {
          const roundLabel = `Round ${index + 1}`;
          const roundSubtitle = round.winner === 'team_a' 
            ? `${teamA} wins` 
            : `${teamB} wins`;
            
          return (
            <Step key={index} completed={roundsCompleted[index]}>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{roundLabel}</Typography>
                  <Chip 
                    label={roundSubtitle} 
                    size="small"
                    color={round.winner === 'team_a' ? 'primary' : 'secondary'}
                  />
                  {round.spike_planted && (
                    <Chip 
                      label="Spike Planted" 
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {index === 0 || index === 12 ? (
                    <Chip 
                      label="Pistol Round" 
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ) : null}
                </Box>
              </StepLabel>
              <StepContent>
                {currentRound === index && (
                  <RoundSimulation 
                    teamA={teamA}
                    teamB={teamB}
                    teamAPlayers={teamAPlayers}
                    teamBPlayers={teamBPlayers}
                    roundData={getEnhancedRoundData(index)!}
                    onComplete={handleRoundComplete}
                    autoplay={true}
                    speed={simulationSpeed}
                  />
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      
      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="error" onClick={onCancel}>
          Cancel Simulation
        </Button>
        
        {currentRound >= matchResult.rounds.length - 1 && roundsCompleted[matchResult.rounds.length - 1] && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onComplete && onComplete(matchResult)}
          >
            View Match Summary
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LiveMatchSimulation; 