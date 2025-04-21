import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Container,
  TextField,
  InputAdornment,
  Paper,
  Tooltip,
  Divider,
  Stack,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { agents, getRoleColor, getAbilityTypeColor, Agent } from '../data/agents';

type RoleFilterType = 'All' | 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel';

const AgentBrowser: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Group agents by role for organized display
  const agentsByRole = useMemo(() => {
    return agents.reduce((acc, agent) => {
      const role = agent.role as RoleFilterType;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(agent);
      return acc;
    }, {} as Record<RoleFilterType, Agent[]>);
  }, []);

  // Filter agents based on role and search query
  const filteredAgents = useMemo(() => {
    let filtered = agents;
    
    // Apply role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(agent => agent.role === roleFilter);
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) || 
        agent.role.toLowerCase().includes(query) ||
        agent.abilities.some(ability => ability.name.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [roleFilter, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Valorant Agents
        </Typography>
        
        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by agent name, role, or ability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          {/* Role Filter Pills */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip 
              label="All Agents"
              clickable
              color={roleFilter === 'All' ? 'primary' : 'default'}
              onClick={() => setRoleFilter('All')}
              variant={roleFilter === 'All' ? 'filled' : 'outlined'}
              sx={{ m: 0.5 }}
            />
            <Chip 
              label="Duelists"
              clickable
              onClick={() => setRoleFilter('Duelist')}
              variant={roleFilter === 'Duelist' ? 'filled' : 'outlined'}
              sx={{ 
                m: 0.5,
                bgcolor: roleFilter === 'Duelist' ? getRoleColor('duelist') : 'transparent',
                color: roleFilter === 'Duelist' ? 'white' : getRoleColor('duelist'),
                borderColor: getRoleColor('duelist')
              }}
            />
            <Chip 
              label="Controllers"
              clickable
              onClick={() => setRoleFilter('Controller')}
              variant={roleFilter === 'Controller' ? 'filled' : 'outlined'}
              sx={{ 
                m: 0.5,
                bgcolor: roleFilter === 'Controller' ? getRoleColor('controller') : 'transparent',
                color: roleFilter === 'Controller' ? 'white' : getRoleColor('controller'),
                borderColor: getRoleColor('controller')
              }}
            />
            <Chip 
              label="Initiators"
              clickable
              onClick={() => setRoleFilter('Initiator')}
              variant={roleFilter === 'Initiator' ? 'filled' : 'outlined'}
              sx={{ 
                m: 0.5,
                bgcolor: roleFilter === 'Initiator' ? getRoleColor('initiator') : 'transparent',
                color: roleFilter === 'Initiator' ? 'white' : getRoleColor('initiator'),
                borderColor: getRoleColor('initiator')
              }}
            />
            <Chip 
              label="Sentinels"
              clickable
              onClick={() => setRoleFilter('Sentinel')}
              variant={roleFilter === 'Sentinel' ? 'filled' : 'outlined'}
              sx={{ 
                m: 0.5,
                bgcolor: roleFilter === 'Sentinel' ? getRoleColor('sentinel') : 'transparent', 
                color: roleFilter === 'Sentinel' ? 'white' : getRoleColor('sentinel'),
                borderColor: getRoleColor('sentinel')
              }}
            />
          </Stack>
        </Paper>

        {filteredAgents.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No agents found matching your criteria
            </Typography>
          </Paper>
        ) : roleFilter === 'All' && !searchQuery ? (
          // Organized by role when showing all agents
          Object.entries(agentsByRole).map(([role, roleAgents]) => (
            <Box key={role} mb={4}>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip 
                  label={role}
                  sx={{ 
                    backgroundColor: getRoleColor(role.toLowerCase()),
                    color: 'white',
                    fontSize: '1rem',
                    height: 32
                  }}
                />
                <Divider sx={{ flex: 1, ml: 2 }} />
              </Box>
              <Grid container spacing={3}>
                {roleAgents.map((agent) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                    <AgentCard agent={agent} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        ) : (
          // Regular grid for filtered results
          <Grid container spacing={3}>
            {filteredAgents.map((agent) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                <AgentCard agent={agent} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderTop: `4px solid ${getRoleColor(agent.role.toLowerCase())}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5" component="h2">
            {agent.name}
          </Typography>
          <Chip 
            label={agent.role} 
            size="small" 
            sx={{ 
              backgroundColor: getRoleColor(agent.role.toLowerCase()),
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {agent.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Abilities:
        </Typography>
        
        <Box>
          {agent.abilities.map((ability, index) => (
            <Tooltip 
              key={index} 
              title={
                <Box>
                  <Typography variant="subtitle2">{ability.name}</Typography>
                  <Typography variant="body2">{ability.description}</Typography>
                  {ability.cost && <Typography variant="caption">Cost: {ability.cost}</Typography>}
                </Box>
              }
              arrow
            >
              <Chip
                label={ability.name}
                size="small"
                sx={{
                  m: 0.5,
                  backgroundColor: getAbilityTypeColor(ability.type.toLowerCase()),
                  color: 'white'
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AgentBrowser; 