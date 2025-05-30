import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Slider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { 
  fetchTeamByIdThunk, 
  updateTeamThunk, 
  updatePlayerThunk, 
  addPlayerToTeamThunk, 
  removePlayerFromTeamThunk 
} from '../store/thunks/gameThunks';
import { Player, Team } from '../store/slices/gameSlice';
import { sanitizePlayerData } from '../store/thunks/gameThunks';

// Define the TabPanel component for different sections
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
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
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

interface PlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (playerData: Partial<Player>) => void;
  player?: Player;
  isNewPlayer?: boolean;
}

// Player Edit Dialog Component
const PlayerEditDialog: React.FC<PlayerDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  player,
  isNewPlayer = false,
}) => {
  const [formData, setFormData] = useState<Partial<Player>>(player || {
    firstName: '',
    lastName: '',
    gamerTag: '',
    age: 18,
    nationality: '',
    region: '',
    primaryRole: 'Duelist',
    salary: 50000,
    coreStats: {
      aim: 50,
      gameSense: 50,
      movement: 50,
      utilityUsage: 50,
      communication: 50,
      clutch: 50,
    },
    roleProficiencies: {},
    agentProficiencies: {},
  });

  // Add effect to log form data changes
  useEffect(() => {
    console.log('Form data updated:', {
      formData,
      coreStatsTypes: formData.coreStats ? 
        Object.entries(formData.coreStats).map(([key, val]) => `${key}: ${typeof val} (${val})`) : 
        'undefined'
    });
  }, [formData]);

  useEffect(() => {
    if (player) {
      console.log('Setting form data from player:', player);
      setFormData(player);
    }
  }, [player]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Field change - ${name}:`, { value, type: typeof value });
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    console.log('Role change:', event.target.value);
    setFormData((prev) => ({ ...prev, primaryRole: event.target.value }));
  };

  const handleCoreStatChange = (stat: string, newValue: number | number[]) => {
    // Ensure we have a numeric value
    const value = Array.isArray(newValue) ? Number(newValue[0]) : Number(newValue);
    console.log(`Core stat change - ${stat}:`, { value, type: typeof value });
    
    setFormData((prev) => {
      // Ensure coreStats exists
      const currentCoreStats = prev.coreStats || {
        aim: 50,
        gameSense: 50,
        movement: 50,
        utilityUsage: 50,
        communication: 50,
        clutch: 50,
      };
      
      // Create a new stats object to ensure proper reference change
      const updatedCoreStats = { ...currentCoreStats } as Record<string, number>;
      // Explicitly set as a number
      updatedCoreStats[stat] = value;
      
      const updatedData = {
        ...prev,
        coreStats: updatedCoreStats as typeof currentCoreStats
      };
      
      console.log('Updated form data (stats):', {
        statName: stat,
        newValue: value,
        valueType: typeof value,
        allStats: updatedData.coreStats
      });
      
      return updatedData;
    });
  };

  const handleSave = () => {
    console.log('Saving player with form data:', formData);
    // Apply sanitization to ensure proper data types before saving
    const sanitizedData = sanitizePlayerData(formData);
    console.log('Sanitized form data to save:', sanitizedData);
    onSave(sanitizedData);
    onClose();
  };

  const primaryRoles = ['Duelist', 'Controller', 'Sentinel', 'Initiator'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isNewPlayer ? 'Add New Player' : 'Edit Player'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Gamer Tag"
              name="gamerTag"
              value={formData.gamerTag || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age || 18}
              onChange={handleChange}
              inputProps={{ min: 16, max: 40 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Nationality"
              name="nationality"
              value={formData.nationality || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Region"
              name="region"
              value={formData.region || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Primary Role</InputLabel>
              <Select
                value={formData.primaryRole || 'Duelist'}
                label="Primary Role"
                name="primaryRole"
                onChange={handleRoleChange}
              >
                {primaryRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Salary"
              name="salary"
              type="number"
              value={formData.salary || 50000}
              onChange={(e) => {
                // Ensure salary is always an integer
                const rawValue = e.target.value;
                const intValue = parseInt(rawValue, 10);
                if (!isNaN(intValue)) {
                  console.log(`Converting salary from ${rawValue} to ${intValue}`);
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: 'salary',
                      value: intValue.toString()
                    }
                  });
                }
              }}
              inputProps={{
                min: 0,
                step: 1,
                pattern: '[0-9]*'
              }}
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Core Stats
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {formData.coreStats && Object.entries(formData.coreStats).map(([stat, value]) => (
            <Grid item xs={12} md={6} key={stat}>
              <Typography id={`${stat}-slider-label`} gutterBottom>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value}
              </Typography>
              <Slider
                value={value}
                onChange={(_, newValue) => handleCoreStatChange(stat, newValue)}
                aria-labelledby={`${stat}-slider-label`}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={100}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TeamEditor: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { currentTeam, loading, error } = useSelector((state: RootState) => state.game);
  
  const [editMode, setEditMode] = useState(false);
  const [teamFormData, setTeamFormData] = useState<Partial<Team>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [tabValue, setTabValue] = useState(0);

  // Fetch team data when component mounts or team ID changes
  useEffect(() => {
    if (teamId) {
      dispatch(fetchTeamByIdThunk(teamId));
    }
  }, [dispatch, teamId]);

  // Update form data when team data changes
  useEffect(() => {
    if (currentTeam) {
      setTeamFormData({
        name: currentTeam.name,
        region: currentTeam.region,
        reputation: currentTeam.reputation,
      });
    }
  }, [currentTeam]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTeamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTeamFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveTeam = async () => {
    if (teamId && teamFormData) {
      try {
        await dispatch(updateTeamThunk({ teamId, teamData: teamFormData })).unwrap();
        setSnackbar({ open: true, message: 'Team saved successfully', severity: 'success' });
        setEditMode(false);
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to save team', severity: 'error' });
      }
    }
  };

  const handleEditPlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsNewPlayer(false);
    setIsPlayerDialogOpen(true);
  };

  const handleAddPlayerClick = () => {
    setSelectedPlayer(null);
    setIsNewPlayer(true);
    setIsPlayerDialogOpen(true);
  };

  const handleDeletePlayerClick = (playerId: string) => {
    setPlayerToDelete(playerId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeletePlayer = async () => {
    if (teamId && playerToDelete) {
      try {
        await dispatch(removePlayerFromTeamThunk({ teamId, playerId: playerToDelete })).unwrap();
        setSnackbar({ open: true, message: 'Player removed successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to remove player', severity: 'error' });
      }
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  const handleSavePlayer = (playerFormData: Partial<Player>) => {
    console.log('Form data received in handleSavePlayer:', playerFormData);
    
    if (selectedPlayer && !isNewPlayer) {
      console.log('Updating existing player:', selectedPlayer.id);
      
      // Create a minimal update object with only the fields that are changing
      // Focus especially on coreStats as this seems to be causing issues
      const updateData: Partial<Player> = {};
      
      // Only add fields that have values in the form data
      if (playerFormData.firstName !== undefined) updateData.firstName = playerFormData.firstName;
      if (playerFormData.lastName !== undefined) updateData.lastName = playerFormData.lastName;
      if (playerFormData.gamerTag !== undefined) updateData.gamerTag = playerFormData.gamerTag;
      if (playerFormData.age !== undefined) updateData.age = playerFormData.age;
      if (playerFormData.nationality !== undefined) updateData.nationality = playerFormData.nationality;
      if (playerFormData.region !== undefined) updateData.region = playerFormData.region;
      if (playerFormData.primaryRole !== undefined) updateData.primaryRole = playerFormData.primaryRole;
      if (playerFormData.salary !== undefined) updateData.salary = playerFormData.salary;
      
      // If coreStats exists, only include it if values are present
      if (playerFormData.coreStats) {
        // For important stats, only include the specific fields that are being updated
        // Define with the right type to avoid TypeScript errors
        updateData.coreStats = {} as typeof playerFormData.coreStats;
        
        const coreStats = playerFormData.coreStats;
        if (coreStats.aim !== undefined) updateData.coreStats.aim = coreStats.aim;
        if (coreStats.gameSense !== undefined) updateData.coreStats.gameSense = coreStats.gameSense;
        if (coreStats.movement !== undefined) updateData.coreStats.movement = coreStats.movement;
        if (coreStats.utilityUsage !== undefined) updateData.coreStats.utilityUsage = coreStats.utilityUsage;
        if (coreStats.communication !== undefined) updateData.coreStats.communication = coreStats.communication;
        if (coreStats.clutch !== undefined) updateData.coreStats.clutch = coreStats.clutch;
        
        // If no core stats were added, remove the empty object
        if (updateData.coreStats && Object.keys(updateData.coreStats).length === 0) {
          delete updateData.coreStats;
        }
      }
      
      // Log the data being sent to the API
      console.log('Minimal update data being sent to API:', JSON.stringify(updateData, null, 2));
      
      dispatch(updatePlayerThunk({
        teamId: teamId || '',
        playerId: selectedPlayer.id,
        playerData: updateData, // Use minimal update data
      }))
        .unwrap()
        .then(() => {
          console.log('Player updated successfully');
          setSnackbar({ open: true, message: 'Player updated successfully', severity: 'success' });
          setIsPlayerDialogOpen(false);
          // Refresh team data
          if (teamId) {
            dispatch(fetchTeamByIdThunk(teamId));
          }
        })
        .catch((error) => {
          console.error('Failed to update player:', error);
          setSnackbar({ open: true, message: `Failed to update player: ${error}`, severity: 'error' });
        });
    } else {
      console.log('Adding new player');
      
      // Log the data being sent to the API
      console.log('Data being sent to add player API:', JSON.stringify(playerFormData, null, 2));
      
      dispatch(addPlayerToTeamThunk({
        teamId: teamId || '',
        playerData: playerFormData, // Use the form data
      }))
        .unwrap()
        .then(() => {
          console.log('Player added successfully');
          setSnackbar({ open: true, message: 'Player added successfully', severity: 'success' });
          setIsPlayerDialogOpen(false);
          // Refresh team data
          if (teamId) {
            dispatch(fetchTeamByIdThunk(teamId));
          }
        })
        .catch((error) => {
          console.error('Failed to add player:', error);
          setSnackbar({ open: true, message: `Failed to add player: ${error}`, severity: 'error' });
        });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && !currentTeam) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentTeam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Team not found</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/teams')}>
          Back to Teams
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            {editMode ? 'Edit Team' : currentTeam.name}
          </Typography>
          <Box>
            {editMode ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTeam}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit Team
              </Button>
            )}
          </Box>
        </Box>

        {editMode ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Team Name"
                name="name"
                value={teamFormData.name || ''}
                onChange={handleTeamFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Region"
                name="region"
                value={teamFormData.region || ''}
                onChange={handleTeamFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography id="reputation-slider-label" gutterBottom>
                Reputation: {teamFormData.reputation}
              </Typography>
              <Slider
                value={teamFormData.reputation || 50}
                onChange={(_, newValue) => 
                  setTeamFormData((prev) => ({ ...prev, reputation: newValue as number }))
                }
                aria-labelledby="reputation-slider-label"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={100}
              />
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Typography variant="h6">
              Region: {currentTeam.region}
            </Typography>
            <Typography variant="h6">
              Reputation: {currentTeam.reputation}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${currentTeam.stats.wins} Wins`}
                color="success"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${currentTeam.stats.losses} Losses`}
                color="error"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${currentTeam.stats.tournaments_won} Tournaments Won`}
                color="primary"
              />
            </Box>
          </Box>
        )}
      </Paper>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="team management tabs">
            <Tab label="Roster" />
            <Tab label="Statistics" />
            <Tab label="Finances" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Team Roster</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={handleAddPlayerClick}
            >
              Add Player
            </Button>
          </Box>

          <Grid container spacing={3}>
            {currentTeam.players.map((player) => (
              <Grid item xs={12} md={6} lg={4} key={player.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {player.gamerTag?.[0] || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          "{player.gamerTag}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {player.firstName} {player.lastName}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={player.primaryRole}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${player.age} years`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={player.nationality}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Core Stats
                    </Typography>

                    <Grid container spacing={1}>
                      {player.coreStats && Object.entries(player.coreStats).map(([stat, value]) => (
                        <Grid item xs={6} key={stat}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              {stat.charAt(0).toUpperCase() + stat.slice(1)}
                            </Typography>
                            <Typography variant="body2">
                              {Math.round(value)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: 'grey.200',
                              position: 'relative',
                              mb: 1,
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                borderRadius: 2,
                                bgcolor: 'primary.main',
                                width: `${value}%`,
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditPlayerClick(player)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeletePlayerClick(player.id)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Team Statistics
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6">Match Record</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Wins: {currentTeam.stats.wins}
                  </Typography>
                  <Typography variant="body1">
                    Losses: {currentTeam.stats.losses}
                  </Typography>
                  <Typography variant="body1">
                    Win Rate: {
                      currentTeam.stats.wins + currentTeam.stats.losses > 0
                        ? `${Math.round((currentTeam.stats.wins / (currentTeam.stats.wins + currentTeam.stats.losses)) * 100)}%`
                        : 'N/A'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6">Tournament History</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Tournaments Won: {currentTeam.stats.tournaments_won}
                  </Typography>
                  <Typography variant="body1">
                    Prize Money: ${currentTeam.stats.prize_money.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6">Team Rating</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Reputation: {currentTeam.reputation}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 4,
                        bgcolor: 'primary.main',
                        width: `${currentTeam.reputation}%`,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Team Finances
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              Financial details coming soon...
            </Typography>
          </Paper>
        </TabPanel>
      </Box>

      {/* Player Edit Dialog */}
      <PlayerEditDialog
        open={isPlayerDialogOpen}
        onClose={() => setIsPlayerDialogOpen(false)}
        onSave={handleSavePlayer}
        player={selectedPlayer || undefined}
        isNewPlayer={isNewPlayer}
      />

      {/* Delete Player Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Player</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this player from the team? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeletePlayer} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamEditor; 