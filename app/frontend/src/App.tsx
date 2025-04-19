import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import theme from './theme';
import store from './store';

// Pages
import Dashboard from './pages/Dashboard';
import TeamManagement from './pages/TeamManagement';
import MatchSimulation from './pages/MatchSimulation';
import PlayerMarket from './pages/PlayerMarket';
import Tournaments from './pages/Tournaments';

// Components
import Navigation from './components/Navigation';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/match" element={<MatchSimulation />} />
            <Route path="/market" element={<PlayerMarket />} />
            <Route path="/tournaments" element={<Tournaments />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App; 