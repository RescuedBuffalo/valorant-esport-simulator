import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Container,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Divider
} from '@mui/material';
import { agents, getRoleColor, getAbilityTypeColor, Agent } from '../data/agents';

type RoleFilterType = 'All' | 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel';

const AgentBrowser: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('All');

  const filteredAgents = useMemo(() => {
    if (roleFilter === 'All') {
      return agents;
    }
    return agents.filter(agent => agent.role === roleFilter);
  }, [roleFilter]);

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Valorant Agents
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={roleFilter}
            onChange={(_, newValue) => setRoleFilter(newValue)}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab 
              label="All Agents" 
              value="All" 
            />
            <Tab 
              label="Duelists" 
              value="Duelist" 
              sx={{ color: getRoleColor('duelist') }}
            />
            <Tab 
              label="Controllers" 
              value="Controller" 
              sx={{ color: getRoleColor('controller') }}
            />
            <Tab 
              label="Initiators" 
              value="Initiator" 
              sx={{ color: getRoleColor('initiator') }}
            />
            <Tab 
              label="Sentinels" 
              value="Sentinel" 
              sx={{ color: getRoleColor('sentinel') }}
            />
          </Tabs>
        </Paper>

        <Grid container spacing={3}>
          {filteredAgents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
              <AgentCard agent={agent} />
            </Grid>
          ))}
        </Grid>
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
        borderTop: `4px solid ${getRoleColor(agent.role.toLowerCase())}`
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