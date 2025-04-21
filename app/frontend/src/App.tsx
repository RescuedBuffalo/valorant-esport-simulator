import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, Tab, Tabs, CircularProgress, Button } from '@mui/material';
import { useDispatch } from 'react-redux';

import { fetchTeamsThunk, fetchRegionsThunk } from './store/thunks/gameThunks';
import { fetchLeaguesThunk } from './store/thunks/leagueThunks';
import { RouteConfig, safeNavigate, isValidRoute } from './utils/routeUtils';
import { debugLog } from './config';
import MetricsTracker from './components/MetricsTracker';

// Pages/Components
import HomePage from './pages/HomePage';
import TeamList from './components/TeamList';
import TeamCreate from './components/TeamCreate';
import TeamEditor from './components/TeamEditor';
import MatchSimulation from './pages/MatchSimulation';
import Maps from './pages/maps';
import MapBuilder from './components/MapBuilder';
import TestPage from './pages/TestPage';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import AgentBrowser from './components/AgentBrowser';

// New League components
import LeagueList from './components/LeagueList';
import LeagueDetail from './components/LeagueDetail';
import LeagueEdit from './components/LeagueEdit';

// New Franchise components
import FranchiseHome from './pages/franchise/FranchiseHome';
import FranchiseDashboard from './components/FranchiseDashboard';

// Define route configuration
const routes: RouteConfig[] = [
  { path: '/', name: 'Home' },
  { path: '/teams', name: 'Teams' },
  { path: '/matches', name: 'Matches' },
  { path: '/leagues', name: 'Leagues' },
  { path: '/franchise', name: 'Franchise' },
  { path: '/maps', name: 'Maps' },
  { path: '/agents', name: 'Agents' },
  { path: '/test', name: 'Test' },
];

function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get current route for tab selection
  const currentPath = '/' + location.pathname.split('/')[1];
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchTeamsThunk() as any),
          dispatch(fetchRegionsThunk() as any),
          dispatch(fetchLeaguesThunk() as any)
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [dispatch]);
  
  // Handle tab changes safely
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const targetPath = routes[newValue]?.path;
    if (targetPath) {
      safeNavigate(navigate, targetPath);
    }
  };
  
  // Validate current route
  useEffect(() => {
    if (!isValidRoute(location.pathname, routes) && !loading) {
      debugLog(`Invalid route: ${location.pathname}, redirecting to homepage`);
      safeNavigate(navigate, '/');
    }
  }, [location.pathname, loading, navigate]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <>
      <MetricsTracker />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Valorant Esports Simulator
            </Typography>
          </Toolbar>
          <Tabs 
            value={routes.findIndex(route => route.path === currentPath)}
            onChange={handleTabChange}
            centered
            textColor="inherit"
            variant="fullWidth"
          >
            {routes.map((route) => (
              <Tab key={route.path} label={route.name} />
            ))}
          </Tabs>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/teams" element={<TeamList />} />
              <Route path="/teams/new" element={<TeamCreate />} />
              <Route path="/teams/:teamId" element={<TeamEditor />} />
              <Route path="/matches" element={<MatchSimulation />} />
              <Route path="/leagues" element={<LeagueList />} />
              <Route path="/leagues/:leagueId" element={<LeagueDetail />} />
              <Route path="/leagues/:leagueId/edit" element={<LeagueEdit />} />
              <Route path="/franchise" element={<FranchiseHome />} />
              <Route path="/franchise/dashboard" element={<FranchiseDashboard />} />
              <Route path="/maps" element={<Maps />} />
              <Route path="/maps/builder" element={<MapBuilder />} />
              <Route path="/agents" element={<AgentBrowser />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Container>
        
        <Box component="footer" sx={{ bgcolor: 'secondary.main', py: 2, color: 'white', textAlign: 'center' }}>
          <Typography variant="body2">
            Valorant Esports Simulator © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </>
  );
}

export default App; 