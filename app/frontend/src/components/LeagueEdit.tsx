import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import { AppDispatch, RootState } from '../store';
import { fetchLeagueByIdThunk, updateLeagueThunk } from '../store/thunks/leagueThunks';
import { fetchRegionsThunk } from '../store/thunks/gameThunks';
import { League } from '../store/slices/leagueSlice';

const LeagueEdit: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { loading } = useSelector((state: RootState) => state.league);
  const { regions } = useSelector((state: RootState) => state.game);
  const league = useSelector((state: RootState) => 
    state.league.leagues.find(l => l.id === leagueId)
  );
  
  const [formData, setFormData] = useState<Partial<League>>({
    name: '',
    description: '',
    region: '',
    prize_pool: 0,
    tier: 1,
    max_teams: 12,
    seasons_per_year: 2
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (leagueId) {
      dispatch(fetchLeagueByIdThunk({ 
        leagueId, 
        includeTeams: true, 
        includeCircuits: true 
      }));
      dispatch(fetchRegionsThunk());
    }
  }, [dispatch, leagueId]);
  
  useEffect(() => {
    if (league) {
      setFormData({
        name: league.name,
        description: league.description,
        region: league.region,
        prize_pool: league.prize_pool,
        tier: league.tier,
        max_teams: league.max_teams,
        seasons_per_year: league.seasons_per_year
      });
    }
  }, [league]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (['prize_pool', 'tier', 'max_teams', 'seasons_per_year'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.region) {
      setError('Name and region are required');
      return;
    }
    
    try {
      if (leagueId) {
        await dispatch(updateLeagueThunk({
          leagueId: leagueId,
          leagueData: formData as Partial<League>
        }));
        setSuccess(true);
        
        // Navigate back after success
        setTimeout(() => {
          navigate(`/leagues/${leagueId}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update league');
    }
  };
  
  if (loading && !league) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!league && !loading) {
    return (
      <Alert severity="error">League not found</Alert>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/leagues/${leagueId}`)}
          sx={{ mr: 2 }}
        >
          Back to League
        </Button>
        <Typography variant="h4">Edit League</Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>League updated successfully!</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="League Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Region</InputLabel>
                <Select
                  name="region"
                  value={formData.region as string}
                  onChange={handleSelectChange}
                  label="Region"
                >
                  {regions?.map((region: string) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Prize Pool ($)"
                name="prize_pool"
                value={formData.prize_pool}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  name="tier"
                  value={formData.tier?.toString() || '1'}
                  onChange={handleSelectChange}
                  label="Tier"
                >
                  <MenuItem value="1">Tier 1 (Premier)</MenuItem>
                  <MenuItem value="2">Tier 2 (Challenger)</MenuItem>
                  <MenuItem value="3">Tier 3 (Regional)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Teams"
                name="max_teams"
                value={formData.max_teams}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 2, max: 32 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Seasons Per Year"
                name="seasons_per_year"
                value={formData.seasons_per_year}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1, max: 4 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/leagues/${leagueId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Update League
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default LeagueEdit; 