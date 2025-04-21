import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import BusinessIcon from '@mui/icons-material/Business';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate } from 'react-router-dom';
import { MetricsService } from '../../services/metrics';

const FranchiseHome: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const metrics = MetricsService.getInstance();
  
  const handleDashboardClick = () => {
    // Track interaction before navigation
    metrics.trackInteraction('FranchiseHome', 'dashboard_navigate');
    navigate('/franchise/dashboard');
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            bgcolor: '#18e4b7', 
            width: 64, 
            height: 64, 
            mr: 2,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <BusinessIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold">
            Franchise Mode
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Build your esports empire over multiple seasons
          </Typography>
        </Box>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              Franchise Dashboard
            </Typography>
            <Typography variant="body1">
              View your franchise stats, financials, and performance metrics
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={handleDashboardClick}
            sx={{ 
              px: 3, 
              py: 1.5,
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }}
          >
            View Dashboard
          </Button>
        </Box>
      </Paper>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          bgcolor: 'rgba(24, 228, 183, 0.05)',
          border: '1px solid rgba(24, 228, 183, 0.1)',
        }}
      >
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
          Welcome to Franchise Mode!
        </Typography>
        <Typography variant="body1" paragraph>
          This feature is coming soon. Franchise Mode will let you build and manage your own esports organization over multiple seasons. You'll handle budgets, sign players, compete in leagues, develop talent, and aim to create a championship-winning dynasty.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay tuned for the launch of this comprehensive management experience!
        </Typography>
      </Paper>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                Key Features
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MonetizationOnIcon sx={{ color: '#18e4b7' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Budget Management" 
                    secondary="Handle finances, sponsors, and merchandise" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon sx={{ color: '#18e4b7' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Team Building" 
                    secondary="Scout, sign, and develop players" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BarChartIcon sx={{ color: '#18e4b7' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Performance Analysis" 
                    secondary="Track stats and optimize strategies" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEventsIcon sx={{ color: '#18e4b7' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Competitions" 
                    secondary="Compete in leagues and tournaments" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon sx={{ color: '#18e4b7' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Academy Teams" 
                    secondary="Develop young talent for the future" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                Season Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Timeline position="alternate">
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    Phase 1
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: '#18e4b7' }}>
                      <MonetizationOnIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1" fontWeight="medium">
                      Budget Planning
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set your financial strategy
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    Phase 2
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: '#18e4b7' }}>
                      <PeopleIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1" fontWeight="medium">
                      Roster Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign, release, and trade players
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    Phase 3
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: '#18e4b7' }}>
                      <CalendarMonthIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1" fontWeight="medium">
                      Regular Season
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      League matches and standings
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    Phase 4
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: '#18e4b7' }}>
                      <SportsTennisIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1" fontWeight="medium">
                      Tournaments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Special events and championships
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    Phase 5
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: '#18e4b7' }}>
                      <BarChartIcon />
                    </TimelineDot>
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1" fontWeight="medium">
                      End of Season Review
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analysis and planning for next season
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<BusinessIcon />}
          sx={{ 
            bgcolor: '#18e4b7',
            color: '#0f1923',
            '&:hover': {
              bgcolor: '#15c9a0',
            },
            mr: 2,
          }}
          onClick={() => navigate('/franchise/my-franchise')}
          disabled
        >
          Start Franchise
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
};

export default FranchiseHome; 