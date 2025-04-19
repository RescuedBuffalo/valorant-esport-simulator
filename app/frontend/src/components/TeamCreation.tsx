import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { AppDispatch } from '../store';
import { createTeam, fetchRegions } from '../store/slices/gameSlice';
import type { Team } from '../store/slices/gameSlice';

const TeamCreation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [teamName, setTeamName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    dispatch(fetchRegions());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() && selectedRegion) {
      try {
        const newTeam: Omit<Team, 'id'> = {
          name: teamName.trim(),
          region: selectedRegion,
          reputation: 50,
          players: [],
          stats: {
            wins: 0,
            losses: 0,
            tournaments_won: 0,
            prize_money: 0,
          },
        };
        await dispatch(createTeam(newTeam as Team));
        setTeamName('');
        setSelectedRegion('');
      } catch (error) {
        console.error('Failed to create team:', error);
      }
    }
  };

  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    setSelectedRegion(event.target.value);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New Team
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <TextField
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Region</InputLabel>
        <Select
          value={selectedRegion}
          onChange={handleRegionChange}
          label="Region"
          required
        >
          {['NA', 'EU', 'APAC', 'LATAM', 'BR'].map((region) => (
            <MenuItem key={region} value={region}>
              {region}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!teamName.trim() || !selectedRegion}
      >
        Create Team
      </Button>
    </Box>
  );
};

export default TeamCreation; 