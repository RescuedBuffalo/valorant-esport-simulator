import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { createTeamThunk } from '../store/thunks/gameThunks';
import { AppDispatch, RootState } from '../store';

const TeamCreate: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const regions = useSelector((state: RootState) => state.game.regions);
  
  const [teamData, setTeamData] = useState({
    name: '',
    tag: '',
    region: '',
    budget: 1000000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTeamData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setTeamData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await dispatch(createTeamThunk({
        name: teamData.name,
        region: teamData.region,
        tag: teamData.tag,
        budget: teamData.budget
      } as any));
      navigate('/teams');
    } catch (err) {
      setError('Failed to create team: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Create New Team
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Name"
                name="name"
                value={teamData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Tag"
                name="tag"
                value={teamData.tag}
                onChange={handleInputChange}
                required
                helperText="Short team tag (e.g., TSM, 100T)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Region</InputLabel>
                <Select
                  name="region"
                  value={teamData.region}
                  onChange={handleSelectChange}
                  label="Region"
                >
                  {regions.map((region: string) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                name="budget"
                type="number"
                value={teamData.budget}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 100000 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/teams')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Team'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TeamCreate; 