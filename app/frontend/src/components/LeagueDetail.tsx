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
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { AppDispatch, RootState } from '../store';
import { 
  fetchLeagueByIdThunk, 
  addTeamToLeagueThunk, 
  removeTeamFromLeagueThunk,
  createCircuitThunk,
} from '../store/thunks/leagueThunks';
import { fetchTeamsThunk } from '../store/thunks/gameThunks';
import { Circuit } from '../store/slices/leagueSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`league-tabpanel-${index}`}
      aria-labelledby={`league-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LeagueDetail: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { currentLeague, loading, error } = useSelector((state: RootState) => state.league);
  const { teams } = useSelector((state: RootState) => state.game);
  
  const [tabValue, setTabValue] = useState(0);
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [createCircuitDialogOpen, setCreateCircuitDialogOpen] = useState(false);
  const [newCircuit, setNewCircuit] = useState<Partial<Circuit>>({
    name: '',
    description: '',
    stage: 'Regular Season',
    season: 1,
    prize_pool: 0,
  });
  
  useEffect(() => {
    if (leagueId) {
      console.log('Fetching league data for ID:', leagueId);
      dispatch(fetchLeagueByIdThunk({ 
        leagueId, 
        includeTeams: true, 
        includeCircuits: true 
      }))
      .unwrap()
      .then(response => {
        console.log('League data fetched successfully:', response);
      })
      .catch(err => {
        console.error('Error fetching league data:', err);
      });
      
      dispatch(fetchTeamsThunk())
      .unwrap()
      .then(response => {
        console.log('Teams fetched successfully:', response);
      })
      .catch(err => {
        console.error('Error fetching teams:', err);
      });
    }
  }, [dispatch, leagueId]);
  
  // Add debug logging
  useEffect(() => {
    console.log('Current league state:', currentLeague);
    console.log('Teams state:', teams);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
    
    // Additional safety check
    if (currentLeague) {
      console.log('League teams:', currentLeague.teams || 'undefined');
      console.log('League circuits:', currentLeague.circuits || 'undefined');
    }
  }, [currentLeague, teams, loading, error]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleAddTeam = () => {
    if (leagueId && selectedTeamId) {
      dispatch(addTeamToLeagueThunk({ leagueId, teamId: selectedTeamId }))
        .unwrap()
        .then(() => {
          setAddTeamDialogOpen(false);
          setSelectedTeamId('');
          // Refresh league data to see the updated teams
          dispatch(fetchLeagueByIdThunk({ 
            leagueId, 
            includeTeams: true, 
            includeCircuits: true 
          }));
        })
        .catch(error => {
          console.error('Error adding team to league:', error);
        });
    }
  };
  
  const handleRemoveTeam = (teamId: string) => {
    if (leagueId) {
      if (window.confirm('Are you sure you want to remove this team from the league?')) {
        dispatch(removeTeamFromLeagueThunk({ leagueId, teamId }))
          .unwrap()
          .then(() => {
            // Refresh league data to see the updated teams
            dispatch(fetchLeagueByIdThunk({ 
              leagueId, 
              includeTeams: true, 
              includeCircuits: true 
            }));
          })
          .catch(error => {
            console.error('Error removing team from league:', error);
          });
      }
    }
  };
  
  const handleCreateCircuit = () => {
    if (leagueId && newCircuit.name && newCircuit.stage) {
      const circuitData = {
        ...newCircuit,
        league_id: leagueId,
      } as any;
      
      dispatch(createCircuitThunk(circuitData))
        .unwrap()
        .then(() => {
          setCreateCircuitDialogOpen(false);
          setNewCircuit({
            name: '',
            description: '',
            stage: 'Regular Season',
            season: 1,
            prize_pool: 0,
          });
          // Refresh league data to see the updated circuits
          dispatch(fetchLeagueByIdThunk({ 
            leagueId, 
            includeTeams: true, 
            includeCircuits: true 
          }));
        })
        .catch(error => {
          console.error('Error creating circuit:', error);
        });
    }
  };
  
  const handleCircuitInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCircuit(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCircuitSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setNewCircuit(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Safe filtering function with error handling
  const safeAvailableTeams = () => {
    try {
      if (!Array.isArray(teams)) {
        console.error('Teams is not an array:', teams);
        return [];
      }
      
      if (!currentLeague?.teams) {
        console.log('No teams in current league, returning all teams');
        return teams;
      }
      
      if (!Array.isArray(currentLeague.teams)) {
        console.error('currentLeague.teams is not an array:', currentLeague.teams);
        return teams;
      }
      
      return teams.filter(team => {
        if (!team || !team.id) {
          console.error('Invalid team object in teams array:', team);
          return false;
        }
        
        // Add a null check for currentLeague.teams again for TypeScript's sake
        if (!currentLeague?.teams) {
          return true;
        }
        
        return !currentLeague.teams.some(leagueTeam => {
          if (!leagueTeam || !leagueTeam.id) {
            console.error('Invalid team object in league teams array:', leagueTeam);
            return false;
          }
          return leagueTeam.id === team.id;
        });
      });
    } catch (err) {
      console.error('Error filtering available teams:', err);
      return [];
    }
  };
  
  // Replace original filter code with the safe function
  const availableTeams = safeAvailableTeams();
  
  // Add a more comprehensive error boundary
  const renderTeamsTab = () => {
    try {
      if (!currentLeague) {
        return (
          <Typography variant="h6" gutterBottom>
            League data not available
          </Typography>
        );
      }

      if (!currentLeague.teams || !Array.isArray(currentLeague.teams)) {
        return (
          <Box>
            <Typography variant="h5">Teams</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              No teams information available for this league.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddTeamDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Add Team
            </Button>
          </Box>
        );
      }

      return (
        <Box>
          <Typography variant="h5">Teams</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2">
              {currentLeague.teams.length} / {currentLeague.max_teams || 12} teams in league
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddTeamDialogOpen(true)}
              disabled={currentLeague.teams.length >= (currentLeague.max_teams || 12)}
            >
              Add Team
            </Button>
          </Box>
          
          {currentLeague.teams.length > 0 ? (
            <List>
              {currentLeague.teams.map((team) => (
                <ListItem key={team.id} divider>
                  <ListItemText
                    primary={team.name}
                    secondary={`Players: ${team.players?.length || 0}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => handleRemoveTeam(team.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="h6" gutterBottom>No teams in this league</Typography>
          )}
        </Box>
      );
    } catch (err) {
      console.error('Error rendering teams tab:', err);
      return (
        <Alert severity="error">
          An error occurred while displaying teams. Please try refreshing the page.
        </Alert>
      );
    }
  };

  // Add a debug button to help troubleshoot
  const debugButton = (
    <Button 
      variant="outlined" 
      color="info" 
      onClick={() => {
        console.log('Current league state:', currentLeague);
        console.log('Available teams:', availableTeams);
        console.log('All teams:', teams);
        
        // Force reload league data
        if (leagueId) {
          dispatch(fetchLeagueByIdThunk({ 
            leagueId, 
            includeTeams: true, 
            includeCircuits: true 
          }));
        }
      }}
      sx={{ mt: 2 }}
    >
      Debug State
    </Button>
  );
  
  if (loading && !currentLeague) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/leagues')}
          sx={{ mt: 2 }}
        >
          Back to Leagues
        </Button>
      </Container>
    );
  }
  
  if (!currentLeague) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 2 }}>
          League not found
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/leagues')}
          >
            Back to Leagues
          </Button>
          {debugButton}
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* League Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4">{currentLeague.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
              <Chip
                label={currentLeague.region}
                size="small"
                color="primary"
              />
              <Chip
                label={`Tier ${currentLeague.tier}`}
                size="small"
                color="secondary"
              />
              {currentLeague.active ? (
                <Chip label="Active" size="small" color="success" />
              ) : (
                <Chip label="Inactive" size="small" color="default" />
              )}
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/leagues/${leagueId}/edit`)}
          >
            Edit League
          </Button>
        </Box>
        <Typography variant="body1" paragraph>
          {currentLeague.description || 'No description available.'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Teams
            </Typography>
            <Typography variant="h6">
              {currentLeague.team_count} / {currentLeague.max_teams}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Prize Pool
            </Typography>
            <Typography variant="h6">
              ${currentLeague.prize_pool.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Current Season
            </Typography>
            <Typography variant="h6">
              {currentLeague.current_season}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Players
            </Typography>
            <Typography variant="h6">
              {currentLeague.player_count}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs for Teams and Circuits */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Teams" />
            <Tab label="Circuits" />
            <Tab label="Standings" />
          </Tabs>
        </Box>
        
        {/* Teams Tab */}
        <TabPanel value={tabValue} index={0}>
          {renderTeamsTab()}
        </TabPanel>
        
        {/* Circuits Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Circuits</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateCircuitDialogOpen(true)}
            >
              Create Circuit
            </Button>
          </Box>
          
          {currentLeague.circuits && currentLeague.circuits.length > 0 ? (
            <List>
              {currentLeague.circuits.map((circuit) => (
                <ListItem key={circuit.id} divider>
                  <ListItemText
                    primary={circuit.name}
                    secondary={`${circuit.stage} | Prize: $${circuit.prize_pool.toLocaleString()} | ${circuit.start_date ? new Date(circuit.start_date).toLocaleDateString() : 'TBD'} - ${circuit.end_date ? new Date(circuit.end_date).toLocaleDateString() : 'TBD'}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No circuits created</Typography>
              <Typography variant="body1" paragraph>
                Create a circuit to start scheduling matches.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateCircuitDialogOpen(true)}
              >
                Create Circuit
              </Button>
            </Paper>
          )}
        </TabPanel>
        
        {/* Standings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>Standings</Typography>
          
          {currentLeague.teams && currentLeague.teams.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell align="right">W</TableCell>
                    <TableCell align="right">L</TableCell>
                    <TableCell align="right">Win %</TableCell>
                    <TableCell align="right">Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Sort teams by win percentage */}
                  {[...currentLeague.teams]
                    .sort((a, b) => {
                      const aWinPct = a.stats.wins / Math.max(1, a.stats.wins + a.stats.losses);
                      const bWinPct = b.stats.wins / Math.max(1, b.stats.wins + b.stats.losses);
                      return bWinPct - aWinPct;
                    })
                    .map((team, index) => {
                      const winPct = team.stats.wins / Math.max(1, team.stats.wins + team.stats.losses);
                      return (
                        <TableRow key={team.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{team.name}</TableCell>
                          <TableCell align="right">{team.stats.wins}</TableCell>
                          <TableCell align="right">{team.stats.losses}</TableCell>
                          <TableCell align="right">{(winPct * 100).toFixed(1)}%</TableCell>
                          <TableCell align="right">{team.stats.wins * 3}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No standings available</Typography>
              <Typography variant="body1">
                Add teams to the league to view standings.
              </Typography>
            </Paper>
          )}
        </TabPanel>
      </Box>
      
      {/* Add Team Dialog */}
      <Dialog open={addTeamDialogOpen} onClose={() => setAddTeamDialogOpen(false)}>
        <DialogTitle>Add Team to League</DialogTitle>
        <DialogContent>
          {availableTeams.length > 0 ? (
            <List>
              {availableTeams.map((team) => (
                <ListItem key={team.id} button onClick={() => handleAddTeam()}>
                  <ListItemText
                    primary={team.name}
                    secondary={`Players: ${team.players?.length || 0}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No more teams available to add.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTeamDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Circuit Dialog */}
      <Dialog 
        open={createCircuitDialogOpen} 
        onClose={() => setCreateCircuitDialogOpen(false)} 
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Circuit</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Circuit Name"
                name="name"
                value={newCircuit.name}
                onChange={handleCircuitInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={newCircuit.description}
                onChange={handleCircuitInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select
                  name="stage"
                  value={newCircuit.stage}
                  label="Stage"
                  onChange={handleCircuitSelectChange}
                >
                  <MenuItem value="Regular Season">Regular Season</MenuItem>
                  <MenuItem value="Playoffs">Playoffs</MenuItem>
                  <MenuItem value="Finals">Finals</MenuItem>
                  <MenuItem value="Qualifiers">Qualifiers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Season"
                name="season"
                type="number"
                value={newCircuit.season}
                onChange={handleCircuitInputChange}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prize Pool ($)"
                name="prize_pool"
                type="number"
                value={newCircuit.prize_pool}
                onChange={handleCircuitInputChange}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCircuitDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCircuit} 
            variant="contained" 
            disabled={!newCircuit.name || !newCircuit.stage}
          >
            Create Circuit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeagueDetail; 