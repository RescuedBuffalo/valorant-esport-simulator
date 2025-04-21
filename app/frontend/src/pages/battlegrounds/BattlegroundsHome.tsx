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
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HistoryIcon from '@mui/icons-material/History';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import { useNavigate } from 'react-router-dom';

const BattlegroundsHome: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            bgcolor: '#2ac1de', 
            width: 64, 
            height: 64, 
            mr: 2,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <SportsEsportsIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold">
            BattleGrounds
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Test your strategic skills against other players or AI
          </Typography>
        </Box>
      </Box>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          bgcolor: 'rgba(42, 193, 222, 0.05)',
          border: '1px solid rgba(42, 193, 222, 0.1)',
        }}
      >
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
          Welcome to BattleGrounds!
        </Typography>
        <Typography variant="body1" paragraph>
          This feature is coming soon. BattleGrounds will allow you to test your strategic skills by playing against AI opponents or other players. You'll be able to climb the leaderboard, develop unique strategies, and earn rewards for your performance.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay tuned for updates as we prepare to launch this exciting new feature!
        </Typography>
      </Paper>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                Game Modes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Player vs Player" 
                    secondary="Challenge other managers to matches" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ComputerIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Player vs AI" 
                    secondary="Practice against computer opponents" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEventsIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Tournaments" 
                    secondary="Join organized competitions with brackets" 
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
                Features
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <FormatListBulletedIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Strategy Builder" 
                    secondary="Create and save your game strategies" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEventsIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Leaderboards" 
                    secondary="Climb the ranks against other players" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HistoryIcon sx={{ color: '#2ac1de' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Match History" 
                    secondary="Review your past performances" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<SportsEsportsIcon />}
          sx={{ 
            bgcolor: '#2ac1de',
            '&:hover': {
              bgcolor: '#1fa5c0',
            },
            mr: 2,
            px: this
          }}
          onClick={() => navigate('/battlegrounds/play')}
          disabled
        >
          Start Playing
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

export default BattlegroundsHome; 