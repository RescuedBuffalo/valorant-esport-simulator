import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { AppDispatch, RootState } from '../store';
import { createTeamThunk, fetchRegionsThunk } from '../store/thunks/gameThunks';

const TeamCreation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [teamName, setTeamName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const regions = useSelector((state: RootState) => state.game.regions);
  const loading = useSelector((state: RootState) => state.game.loading);

  useEffect(() => {
    dispatch(fetchRegionsThunk());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() && selectedRegion) {
      try {
        await dispatch(createTeamThunk({
          name: teamName.trim(),
          region: selectedRegion,
        }));
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
          {regions.map((region) => (
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
        disabled={loading || !teamName.trim() || !selectedRegion}
      >
        {loading ? 'Creating Team...' : 'Create Team'}
      </Button>
    </Box>
  );
};

export default TeamCreation; 