#!/bin/bash

# Test updating a player's gamertag
echo "Testing player update with gamertag..."
TEAM_ID="2de8af3e-0bc8-4b9c-a26e-3ba79b0941ae"
PLAYER_ID="54235d3c-2c54-4caf-b7bc-85fc4990fe63"
NEW_GAMERTAG="TestGamerTag_$(date +%s)"

curl -X PUT -H "Content-Type: application/json" \
  -d "{\"gamerTag\": \"$NEW_GAMERTAG\"}" \
  http://localhost:8000/api/v1/teams/$TEAM_ID/players/$PLAYER_ID \
  -v 

echo -e "\n\nDone." 