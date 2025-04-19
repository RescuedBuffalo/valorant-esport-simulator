import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as TeamIcon,
  SportsEsports as MatchIcon,
  Store as MarketIcon,
  EmojiEvents as TournamentIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/team', label: 'Team', icon: <TeamIcon /> },
    { path: '/match', label: 'Match', icon: <MatchIcon /> },
    { path: '/market', label: 'Market', icon: <MarketIcon /> },
    { path: '/tournaments', label: 'Tournaments', icon: <TournamentIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const renderMobileNavigation = () => (
    <BottomNavigation
      value={location.pathname}
      onChange={(_, newValue) => handleNavigation(newValue)}
      showLabels
      sx={{
        width: '100%',
        position: 'fixed',
        bottom: 0,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {navigationItems.map((item) => (
        <BottomNavigationAction
          key={item.path}
          label={item.label}
          icon={item.icon}
          value={item.path}
        />
      ))}
    </BottomNavigation>
  );

  const renderDesktopNavigation = () => (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );

  const renderTemporaryDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <List sx={{ width: 250 }}>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Valorant Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer */}
      {isMobile ? (
        <>
          {renderTemporaryDrawer()}
          {renderMobileNavigation()}
        </>
      ) : (
        renderDesktopNavigation()
      )}
    </>
  );
};

export default Navigation; 