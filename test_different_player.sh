#!/bin/bash

# Get a list of players from the first team
echo "Getting player list from team..."
TEAM_RESPONSE=$(curl -s http://localhost:8000/api/v1/teams/)
TEAM_ID=$(echo $TEAM_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d '"' -f 4)
echo "Using team ID: $TEAM_ID"

# Get a different player ID
PLAYER_ID=13486d13-13c1-4a68-a645-a3e3ab215fe2
echo "Using player ID: $PLAYER_ID"

# Test updating a different player's stats
echo "Testing player stat update on different player..."
curl -X PUT -H "Content-Type: application/json" \
  -d '{
    "coreStats": {
      "aim": 92,
      "clutch": 83
    }
  }' \
  http://localhost:8000/api/v1/teams/ef5a1760-2cec-4189-806d-c5f7b90b22c1/players/13486d13-13c1-4a68-a645-a3e3ab215fe2 \
  -v

echo -e "\n\nDone." 