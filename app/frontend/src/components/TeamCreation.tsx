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
  Paper,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { createTeam, fetchRegions } from '../store/slices/gameSlice';

const TeamCreation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const regions = useSelector((state: RootState) => state.game.regions);
  const loading = useSelector((state: RootState) => state.game.loading);

  const [teamName, setTeamName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    dispatch(fetchRegions());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      await dispatch(createTeam({
        name: teamName.trim(),
        region: selectedRegion || undefined,
      }));
      setTeamName('');
      setSelectedRegion('');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create New Team
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Region</InputLabel>
          <Select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            label="Region"
          >
            <MenuItem value="">
              <em>Random</em>
            </MenuItem>
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
          sx={{ mt: 2 }}
          disabled={loading || !teamName.trim()}
        >
          {loading ? 'Creating...' : 'Create Team'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TeamCreation; 