import React from 'react';
import { useSelector } from 'react-redux';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  SelectChangeEvent,
} from '@mui/material';
import { RootState } from '../store';

interface TeamSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  otherTeam: string;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  label,
  value,
  onChange,
  otherTeam,
}) => {
  const teams = useSelector((state: RootState) => state.game.teams);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
      >
        {teams.map((team) => (
          <MenuItem
            key={team.id}
            value={team.name}
            disabled={team.name === otherTeam}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                {team.name[0]}
              </Avatar>
              <Box>
                <Typography variant="body1">{team.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Region: {team.region} • Rating: {team.reputation}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TeamSelector; 