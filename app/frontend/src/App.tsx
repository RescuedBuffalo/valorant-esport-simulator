import React from 'react';
import { Provider } from 'react-redux';
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

const App: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Provider store={store}>
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
            </Tabs>
          </AppBar>
          <Container maxWidth="lg">
            <TabPanel value={tabValue} index={0}>
              <TeamList />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <TeamCreation />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <MatchSimulation />
            </TabPanel>
          </Container>
        </Box>
      </ThemeProvider>
    </Provider>
  );
};

export default App; 