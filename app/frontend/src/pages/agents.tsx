import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
  Chip,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import agents, { getRoleColor, getAbilityTypeColor, Agent, Ability } from '../data/agents';

const AgentPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>(agents[0].id);

  const handleAgentChange = (_: React.SyntheticEvent, newAgent: string) => {
    setSelectedAgent(newAgent);
  };

  const currentAgent = agents.find(agent => agent.id === selectedAgent) || agents[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Agents
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={selectedAgent}
          onChange={handleAgentChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {agents.map(agent => (
            <Tab
              key={agent.id}
              label={agent.name}
              value={agent.id}
              icon={
                <Chip
                  label={agent.role}
                  size="small"
                  sx={{
                    bgcolor: getRoleColor(agent.role) + '33',
                    color: getRoleColor(agent.role),
                    borderColor: getRoleColor(agent.role),
                    border: '1px solid',
                  }}
                />
              }
              iconPosition="end"
            />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <AgentProfile agent={currentAgent} />
        </Grid>
        <Grid item xs={12} md={8}>
          <AgentAbilities agent={currentAgent} />
        </Grid>
      </Grid>
    </Container>
  );
};

interface AgentProfileProps {
  agent: Agent;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ agent }) => {
  return (
    <Card elevation={3}>
      <CardMedia
        component="img"
        height="280"
        image={agent.portrait || `https://via.placeholder.com/400x280/1A1A1A/FFFFFF?text=${agent.name}`}
        alt={agent.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{ 
              width: 64, 
              height: 64,
              bgcolor: getRoleColor(agent.role) + '33',
              border: `2px solid ${getRoleColor(agent.role)}`
            }}
          >
            {agent.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" component="div">
              {agent.name}
            </Typography>
            <Chip
              label={agent.role}
              sx={{
                bgcolor: getRoleColor(agent.role) + '33',
                color: getRoleColor(agent.role),
                borderColor: getRoleColor(agent.role),
                border: '1px solid',
              }}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {agent.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

interface AgentAbilitiesProps {
  agent: Agent;
}

const AgentAbilities: React.FC<AgentAbilitiesProps> = ({ agent }) => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Abilities
      </Typography>
      
      <List>
        {agent.abilities.map((ability, index) => (
          <AbilityItem key={index} ability={ability} />
        ))}
      </List>
    </Paper>
  );
};

interface AbilityItemProps {
  ability: Ability;
}

const AbilityItem: React.FC<AbilityItemProps> = ({ ability }) => {
  return (
    <>
      <ListItem alignItems="flex-start" sx={{ py: 2 }}>
        <ListItemIcon>
          <Avatar
            sx={{ 
              bgcolor: getAbilityTypeColor(ability.type) + '33',
              color: getAbilityTypeColor(ability.type),
              border: `1px solid ${getAbilityTypeColor(ability.type)}`
            }}
          >
            {ability.name.charAt(0)}
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" component="span">
                {ability.name}
              </Typography>
              <Chip 
                label={ability.type}
                size="small"
                sx={{
                  bgcolor: getAbilityTypeColor(ability.type) + '33',
                  color: getAbilityTypeColor(ability.type),
                  borderColor: getAbilityTypeColor(ability.type),
                  border: '1px solid',
                }}
              />
            </Box>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.primary" paragraph>
                {ability.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {ability.cost && (
                  <Chip 
                    label={`Cost: ${ability.type === 'Ultimate' ? `${ability.cost} Points` : `${ability.cost} Credits`}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                
                {ability.charges && (
                  <Chip 
                    label={`Charges: ${ability.charges}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          }
        />
      </ListItem>
      <Divider component="li" />
    </>
  );
};

export default AgentPage; 