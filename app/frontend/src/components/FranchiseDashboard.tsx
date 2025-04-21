import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Divider,
  useTheme 
} from '@mui/material';
import { MetricsService } from '../services/metrics';
import axios from 'axios';
import { config } from '../config';

// Types
interface FranchiseStats {
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  totalRevenue: number;
  popularMaps: { name: string; playCount: number }[];
  recentTransactions: { id: string; type: string; amount: number; date: string }[];
}

const FranchiseDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FranchiseStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metrics = MetricsService.getInstance();

  useEffect(() => {
    // Track component mount as a custom interaction
    metrics.trackInteraction('FranchiseDashboard', 'mount');
    
    const fetchStats = async () => {
      const startTime = performance.now();
      
      try {
        // In a real implementation, this would be an actual API call
        // For now, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockStats: FranchiseStats = {
          totalTeams: 24,
          totalPlayers: 120,
          totalMatches: 156,
          totalRevenue: 1250000,
          popularMaps: [
            { name: 'Ascent', playCount: 45 },
            { name: 'Bind', playCount: 38 },
            { name: 'Haven', playCount: 30 },
            { name: 'Split', playCount: 25 },
            { name: 'Icebox', playCount: 18 }
          ],
          recentTransactions: [
            { id: 'tx1', type: 'Player Transfer', amount: 50000, date: '2023-05-15' },
            { id: 'tx2', type: 'Sponsorship', amount: 75000, date: '2023-05-12' },
            { id: 'tx3', type: 'Merchandise', amount: 12500, date: '2023-05-10' },
            { id: 'tx4', type: 'Ticket Sales', amount: 35000, date: '2023-05-05' }
          ]
        };
        
        // Track API call success
        const duration = performance.now() - startTime;
        metrics.trackApiCall('/api/v1/franchise/stats', 'GET', duration, 200);
        
        setStats(mockStats);
      } catch (err) {
        const apiError = err as Error;
        setError(apiError.message || 'Failed to load franchise data');
        
        // Track API call failure
        const duration = performance.now() - startTime;
        metrics.trackApiCall('/api/v1/franchise/stats', 'GET', duration, 500);
        
        // Track error
        metrics.trackError('api_failure', apiError.message, 'FranchiseDashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Track component unmount
    return () => {
      metrics.trackInteraction('FranchiseDashboard', 'unmount');
    };
  }, []);
  
  // Track render time
  useEffect(() => {
    const renderStart = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStart;
      // Track custom metric for component render time
      axios.post(`${config.API_URL}/api/v1/metrics/custom`, {
        metric_name: 'component_render_time',
        component: 'FranchiseDashboard',
        duration_seconds: renderTime / 1000
      }).catch(err => console.error('Failed to track render time:', err));
    };
  }, [stats]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !stats) {
    return (
      <Paper sx={{ p: 3, backgroundColor: theme.palette.error.light }}>
        <Typography variant="h6" color="error">
          Error: {error || 'Failed to load franchise data'}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Franchise Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Key Statistics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Key Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Teams
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalTeams}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Players
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalPlayers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Matches Played
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalMatches}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ${(stats.totalRevenue / 1000).toFixed(1)}K
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Popular Maps */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Popular Maps
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats.popularMaps.map((map, index) => (
              <Box key={index} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{map.name}</Typography>
                <Typography fontWeight="bold">{map.playCount} matches</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats.recentTransactions.map((tx, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{tx.type}</Typography>
                  <Typography fontWeight="bold">${tx.amount.toLocaleString()}</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {tx.date}
                </Typography>
                {index < stats.recentTransactions.length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FranchiseDashboard; 