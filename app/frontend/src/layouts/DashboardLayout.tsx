import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Collapse,
  useTheme,
  useMediaQuery,
  Container,
  Tooltip,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BusinessIcon from '@mui/icons-material/Business';
import BrushIcon from '@mui/icons-material/Brush';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const drawerWidth = 240;

interface FeatureGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  features: Feature[];
}

interface Feature {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
}

// Define the main feature groups
const featureGroups: FeatureGroup[] = [
  {
    id: 'customization-hub',
    name: 'Customization Hub',
    icon: <BrushIcon />,
    features: [
      { id: 'teams', name: 'Teams', path: '/customization/teams', icon: <PeopleIcon /> },
      { id: 'matches', name: 'Matches', path: '/customization/matches', icon: <SportsSoccerIcon /> },
      { id: 'leagues', name: 'Leagues', path: '/customization/leagues', icon: <EmojiEventsIcon /> },
      { id: 'maps', name: 'Maps', path: '/customization/maps', icon: <MapIcon /> },
    ]
  },
  {
    id: 'battlegrounds',
    name: 'BattleGrounds',
    icon: <SportsEsportsIcon />,
    features: [
      { id: 'play', name: 'Play', path: '/battlegrounds/play' },
      { id: 'leaderboard', name: 'Leaderboard', path: '/battlegrounds/leaderboard' },
      { id: 'strategies', name: 'Strategies', path: '/battlegrounds/strategies' },
    ]
  },
  {
    id: 'franchise',
    name: 'Franchise',
    icon: <BusinessIcon />,
    features: [
      { id: 'my-franchise', name: 'My Franchise', path: '/franchise/my-franchise' },
      { id: 'career', name: 'Career', path: '/franchise/career' },
      { id: 'seasons', name: 'Seasons', path: '/franchise/seasons' },
    ]
  }
];

const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [open, setOpen] = useState(!isMobile);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // Find active group based on current path
  const activeGroupId = React.useMemo(() => {
    for (const group of featureGroups) {
      for (const feature of group.features) {
        if (location.pathname.startsWith(feature.path)) {
          return group.id;
        }
      }
    }
    return null;
  }, [location.pathname]);
  
  // Expand the active group on initial render
  React.useEffect(() => {
    if (activeGroupId && !expandedGroup) {
      setExpandedGroup(activeGroupId);
    }
  }, [activeGroupId, expandedGroup]);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  const handleGroupClick = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };
  
  const handleFeatureClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const isFeatureActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Valorant Esports Simulator
          </Typography>
          <Tooltip title="Profile">
            <IconButton color="inherit">
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 32,
                  height: 32,
                }}
              >
                VS
              </Avatar>
            </IconButton>
          </Tooltip>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.default,
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerToggle}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Toolbar>
        <Divider />
        
        <List component="nav">
          <ListItemButton 
            onClick={() => navigate('/')}
            selected={location.pathname === '/'} 
            sx={{ 
              borderRadius: '8px',
              mx: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 70, 85, 0.15)', // Using primary color with low opacity
                '&:hover': {
                  backgroundColor: 'rgba(255, 70, 85, 0.25)',
                },
              },
            }}
          >
            <ListItemIcon>
              <HomeIcon color={location.pathname === '/' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          
          <Divider sx={{ my: 1 }} />
          
          {featureGroups.map((group) => (
            <React.Fragment key={group.id}>
              <ListItemButton 
                onClick={() => handleGroupClick(group.id)}
                sx={{ 
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  ...(expandedGroup === group.id && {
                    backgroundColor: 'rgba(255, 70, 85, 0.07)',
                  }),
                }}
              >
                <ListItemIcon>
                  {React.cloneElement(group.icon as any, { 
                    color: expandedGroup === group.id ? 'primary' : 'inherit' 
                  })}
                </ListItemIcon>
                <ListItemText 
                  primary={group.name} 
                  primaryTypographyProps={{
                    fontWeight: expandedGroup === group.id ? 'bold' : 'normal',
                    color: expandedGroup === group.id ? 'primary' : 'inherit',
                  }}
                />
                {expandedGroup === group.id ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedGroup === group.id} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {group.features.map((feature) => (
                    <ListItemButton
                      key={feature.id}
                      sx={{ 
                        pl: 4,
                        borderRadius: '8px',
                        mx: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 70, 85, 0.15)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 70, 85, 0.25)',
                          },
                        },
                      }}
                      selected={isFeatureActive(feature.path)}
                      onClick={() => handleFeatureClick(feature.path)}
                    >
                      {feature.icon && (
                        <ListItemIcon>
                          {React.cloneElement(feature.icon as any, { 
                            color: isFeatureActive(feature.path) ? 'primary' : 'inherit',
                            fontSize: 'small'
                          })}
                        </ListItemIcon>
                      )}
                      <ListItemText 
                        primary={feature.name} 
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isFeatureActive(feature.path) ? 'medium' : 'normal',
                          color: isFeatureActive(feature.path) ? 'primary' : 'inherit',
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          overflow: 'auto',
          minHeight: '100vh',
          background: theme.palette.background.default,
          backgroundImage: 'linear-gradient(rgba(255, 70, 85, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 70, 85, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <Toolbar /> {/* Offset for AppBar */}
        <Container 
          maxWidth="xl" 
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          sx={{ mt: 2 }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 