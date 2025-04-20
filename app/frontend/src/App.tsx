import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import store from './store';
import TeamCreation from './components/TeamCreation';
import TeamList from './components/TeamList';
import MatchSimulation from './components/MatchSimulation';
import Maps from './pages/maps';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4655', // Valorant red
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#1f2326',
      paper: '#2f3136',
    },
  },
  typography: {
    fontFamily: '"DIN Next", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

// Routes mapped to tab indices
const ROUTES = ['/', '/team-creation', '/match-simulation', '/maps'];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine the active tab based on the current path
  const getTabIndexFromPath = () => {
    const path = location.pathname;
    const index = ROUTES.indexOf(path);
    return index >= 0 ? index : 0;
  };
  
  const [tabValue, setTabValue] = React.useState(getTabIndexFromPath());
  
  // Update the tab value when the location changes
  useEffect(() => {
    setTabValue(getTabIndexFromPath());
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    navigate(ROUTES[newValue]);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Valorant Team Simulation
            </Typography>
          </Toolbar>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="game navigation tabs"
            centered
          >
            <Tab label="Teams" />
            <Tab label="Create Team" />
            <Tab label="Simulate Match" />
            <Tab label="Maps" />
          </Tabs>
        </AppBar>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<TeamList />} />
            <Route path="/team-creation" element={<TeamCreation />} />
            <Route path="/match-simulation" element={<MatchSimulation />} />
            <Route path="/maps" element={<Maps />} />
            {/* Default route */}
            <Route path="*" element={<TeamList />} />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App; 