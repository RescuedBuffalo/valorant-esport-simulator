import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Divider,
  useTheme,
  Paper,
  Button,
  Avatar,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BrushIcon from '@mui/icons-material/Brush';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BusinessIcon from '@mui/icons-material/Business';
import InfoIcon from '@mui/icons-material/Info';

// Define feature groups
const featureGroups = [
  {
    id: 'customization-hub',
    name: 'Customization Hub',
    description: 'Create and manage teams, leagues, matches, and maps',
    icon: <BrushIcon fontSize="large" />,
    color: '#ff4655', // Valorant red
    path: '/customization/teams',
    features: [
      { name: 'Teams', count: 24 },
      { name: 'Leagues', count: 3 },
      { name: 'Maps', count: 8 },
    ]
  },
  {
    id: 'battlegrounds',
    name: 'BattleGrounds',
    description: 'Challenge other players or AI in strategic gameplay',
    icon: <SportsEsportsIcon fontSize="large" />,
    color: '#2ac1de', // Valorant blue
    path: '/battlegrounds/play',
    features: [
      { name: 'Matches', count: 0 },
      { name: 'Rank', count: 0 },
    ],
    comingSoon: true
  },
  {
    id: 'franchise',
    name: 'Franchise',
    description: 'Run your own esports organization over multiple seasons',
    icon: <BusinessIcon fontSize="large" />,
    color: '#18e4b7', // Valorant teal
    path: '/franchise/my-franchise',
    features: [
      { name: 'Seasons', count: 0 },
      { name: 'Championships', count: 0 },
    ],
    comingSoon: true
  }
];

// Recent activity mock data
const recentActivity = [
  { id: 1, type: 'team', name: 'Cloud9', action: 'created', time: '2 hours ago' },
  { id: 2, type: 'match', name: 'Cloud9 vs Team Liquid', action: 'simulated', time: '1 hour ago', result: '13-11' },
  { id: 3, type: 'league', name: 'VCT Champions', action: 'updated', time: '30 minutes ago' },
];

const NewHomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const handleGroupClick = (path: string) => {
    navigate(path);
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Valorant Esports Simulator
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create, manage, and simulate your own Valorant esports ecosystem
        </Typography>
      </Box>
      
      {/* Feature Group Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {featureGroups.map((group) => (
          <Grid item xs={12} md={4} key={group.id}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                borderRadius: 2,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              {group.comingSoon && (
                <Paper
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    bgcolor: theme.palette.warning.main,
                    color: theme.palette.warning.contrastText,
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 10,
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    Coming Soon
                  </Typography>
                </Paper>
              )}
              
              <CardActionArea 
                onClick={() => handleGroupClick(group.path)}
                disabled={group.comingSoon}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: group.color,
                        width: 56,
                        height: 56,
                        mr: 2,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      {React.cloneElement(group.icon as any, { sx: { color: 'white' } })}
                    </Avatar>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      {group.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      minHeight: 60,
                    }}
                  >
                    {group.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Grid container spacing={1}>
                      {group.features.map((feature, index) => (
                        <Grid item xs={6} key={index}>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 1.5, 
                              textAlign: 'center',
                              bgcolor: 'background.default',
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold" color={group.comingSoon ? 'text.disabled' : 'inherit'}>
                              {feature.count}
                            </Typography>
                            <Typography variant="body2" color={group.comingSoon ? 'text.disabled' : 'text.secondary'}>
                              {feature.name}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Recent Activity */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          Recent Activity
        </Typography>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          {recentActivity.length > 0 ? (
            <Stack spacing={2} divider={<Divider />}>
              {recentActivity.map((activity) => (
                <Box key={activity.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        mr: 2, 
                        bgcolor: 
                          activity.type === 'team' ? '#ff4655' : 
                          activity.type === 'match' ? '#2ac1de' : '#18e4b7'
                      }}
                    >
                      {activity.type.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {activity.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.time}
                        {activity.result && ` • Result: ${activity.result}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<InfoIcon />}
                    sx={{ minWidth: 100 }}
                  >
                    Details
                  </Button>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No recent activity found. Start by creating teams and simulating matches!
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/customization/teams')}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              textAlign: 'center',
              bgcolor: 'rgba(255, 70, 85, 0.05)',
              border: '1px solid rgba(255, 70, 85, 0.1)',
            }}
          >
            <Typography variant="h3" component="div" fontWeight="bold" color="primary">
              24
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Teams Created
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              textAlign: 'center',
              bgcolor: 'rgba(42, 193, 222, 0.05)',
              border: '1px solid rgba(42, 193, 222, 0.1)',
            }}
          >
            <Typography 
              variant="h3" 
              component="div" 
              fontWeight="bold" 
              sx={{ color: '#2ac1de' }}
            >
              47
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Matches Simulated
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              textAlign: 'center',
              bgcolor: 'rgba(24, 228, 183, 0.05)',
              border: '1px solid rgba(24, 228, 183, 0.1)',
            }}
          >
            <Typography 
              variant="h3" 
              component="div" 
              fontWeight="bold" 
              sx={{ color: '#18e4b7' }}
            >
              3
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Active Leagues
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewHomePage; 