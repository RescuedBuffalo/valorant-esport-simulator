import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Valorant Team Simulator
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Manage teams, leagues, and simulate matches in the competitive Valorant universe
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Teams
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Create and manage your Valorant teams with customizable players and statistics.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/teams')}>
                View Teams
              </Button>
              <Button size="small" color="primary" onClick={() => navigate('/teams/create')}>
                Create Team
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Leagues
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Organize competitive leagues with multiple teams and structured competitions.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/leagues')}>
                View Leagues
              </Button>
              <Button size="small" color="primary" onClick={() => navigate('/leagues')}>
                Create League
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Match Simulation
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Simulate matches between teams with realistic game mechanics and statistics.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/matches')}>
                Simulate Match
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Additional Tools
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Maps
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Create and customize game maps for your simulations.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => navigate('/maps')}>
                View Maps
              </Button>
              <Button size="small" color="primary" onClick={() => navigate('/maps/builder')}>
                Map Builder
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage; 