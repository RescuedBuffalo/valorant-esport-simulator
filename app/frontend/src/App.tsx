import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, Tab, Tabs, CircularProgress, Button } from '@mui/material';
import { useDispatch } from 'react-redux';

import { fetchTeamsThunk, fetchRegionsThunk } from './store/thunks/gameThunks';
import { fetchLeaguesThunk } from './store/thunks/leagueThunks';
import { RouteConfig, safeNavigate, isValidRoute } from './utils/routeUtils';
import { debugLog } from './config';

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

// New League components
import LeagueList from './components/LeagueList';
import LeagueDetail from './components/LeagueDetail';
import LeagueEdit from './components/LeagueEdit';

// Define route configuration
const routes: RouteConfig[] = [
  { path: '/', name: 'Home' },
  { path: '/teams', name: 'Teams' },
  { path: '/matches', name: 'Matches' },
  { path: '/leagues', name: 'Leagues' },
  { path: '/maps', name: 'Maps' },
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Valorant Team Simulator
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Home</Button>
        </Toolbar>
      </AppBar>
      
      <Tabs 
        value={routes.findIndex(route => route.path === currentPath) !== -1 ? 
               routes.findIndex(route => route.path === currentPath) : 0}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {routes.map((route) => (
          <Tab key={route.path} label={route.name} />
        ))}
      </Tabs>
      
      <Container>
        <Routes>
          <Route path="/" element={
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          } />
          <Route path="/teams" element={
            <ErrorBoundary>
              <TeamList />
            </ErrorBoundary>
          } />
          <Route path="/teams/create" element={
            <ErrorBoundary>
              <TeamCreate />
            </ErrorBoundary>
          } />
          <Route path="/teams/:teamId/edit" element={
            <ErrorBoundary>
              <TeamEditor />
            </ErrorBoundary>
          } />
          <Route path="/matches" element={
            <ErrorBoundary>
              <MatchSimulation />
            </ErrorBoundary>
          } />
          
          {/* League Routes */}
          <Route path="/leagues" element={
            <ErrorBoundary>
              <LeagueList />
            </ErrorBoundary>
          } />
          <Route path="/leagues/:leagueId" element={
            <ErrorBoundary>
              <LeagueDetail />
            </ErrorBoundary>
          } />
          <Route path="/leagues/:leagueId/edit" element={
            <ErrorBoundary>
              <LeagueEdit />
            </ErrorBoundary>
          } />
          
          {/* Map Routes */}
          <Route path="/maps" element={
            <ErrorBoundary>
              <Maps />
            </ErrorBoundary>
          } />
          <Route path="/maps/builder" element={
            <ErrorBoundary>
              <MapBuilder />
            </ErrorBoundary>
          } />
          
          {/* Test Route */}
          <Route path="/test" element={
            <ErrorBoundary>
              <TestPage />
            </ErrorBoundary>
          } />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 