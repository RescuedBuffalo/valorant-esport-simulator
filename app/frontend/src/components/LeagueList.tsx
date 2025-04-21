import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Divider,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { AppDispatch, RootState } from '../store';
import { fetchLeaguesThunk, createLeagueThunk } from '../store/thunks/leagueThunks';
import { fetchRegionsThunk } from '../store/thunks/gameThunks';
import { League } from '../store/slices/leagueSlice';

const LeagueList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leagues, loading, error } = useSelector((state: RootState) => state.league);
  const { regions } = useSelector((state: RootState) => state.game);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    region: '',
    prize_pool: 0,
    tier: 1,
    max_teams: 12,
    seasons_per_year: 2
  });
  
  useEffect(() => {
    dispatch(fetchLeaguesThunk());
    dispatch(fetchRegionsThunk());
  }, [dispatch]);
  
  const handleCreateLeague = () => {
    dispatch(createLeagueThunk(newLeague))
      .unwrap()
      .then(() => {
        setCreateDialogOpen(false);
        setNewLeague({
          name: '',
          description: '',
          region: '',
          prize_pool: 0,
          tier: 1,
          max_teams: 12,
          seasons_per_year: 2
        });
      })
      .catch(error => {
        console.error('Error creating league:', error);
      });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLeague(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setNewLeague(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const getTierLabel = (tier: number) => {
    switch(tier) {
      case 1: return 'Major';
      case 2: return 'Minor';
      case 3: return 'Regional';
      default: return `Tier ${tier}`;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Leagues & Circuits
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create League
        </Button>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {leagues.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No leagues found</Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Create your first league to start organizing competitions.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create League
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {leagues.map((league: League) => (
                <Grid item xs={12} md={6} lg={4} key={league.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {league.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
                        <Chip
                          label={league.region}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={getTierLabel(league.tier)}
                          size="small"
                          color="secondary"
                        />
                        {league.active ? (
                          <Chip label="Active" size="small" color="success" />
                        ) : (
                          <Chip label="Inactive" size="small" color="default" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {league.description || 'No description available.'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Teams
                          </Typography>
                          <Typography variant="body1">
                            {league.team_count} / {league.max_teams}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Prize Pool
                          </Typography>
                          <Typography variant="body1">
                            ${league.prize_pool.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Season
                          </Typography>
                          <Typography variant="body1">
                            {league.current_season}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Players
                          </Typography>
                          <Typography variant="body1">
                            {league.player_count}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/leagues/${league.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/leagues/${league.id}/circuits`}
                      >
                        Circuits
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Create League Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New League</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="League Name"
                name="name"
                value={newLeague.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={newLeague.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Region</InputLabel>
                <Select
                  name="region"
                  value={newLeague.region}
                  label="Region"
                  onChange={handleSelectChange}
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prize Pool ($)"
                name="prize_pool"
                type="number"
                value={newLeague.prize_pool}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  name="tier"
                  value={newLeague.tier}
                  label="Tier"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={1}>Tier 1 (Major)</MenuItem>
                  <MenuItem value={2}>Tier 2 (Minor)</MenuItem>
                  <MenuItem value={3}>Tier 3 (Regional)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Teams"
                name="max_teams"
                type="number"
                value={newLeague.max_teams}
                onChange={handleInputChange}
                inputProps={{ min: 2, max: 32 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Seasons Per Year"
                name="seasons_per_year"
                type="number"
                value={newLeague.seasons_per_year}
                onChange={handleInputChange}
                inputProps={{ min: 1, max: 4 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateLeague} 
            variant="contained" 
            disabled={!newLeague.name || !newLeague.region}
          >
            Create League
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeagueList; 