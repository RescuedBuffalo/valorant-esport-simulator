#!/bin/bash

# Test updating a player's stats specifically
echo "Testing player stat update..."
TEAM_ID="2de8af3e-0bc8-4b9c-a26e-3ba79b0941ae"
PLAYER_ID="54235d3c-2c54-4caf-b7bc-85fc4990fe63"

# First test with a single core stat
echo "Test 1: Updating a single core stat..."
curl -X PUT -H "Content-Type: application/json" \
  -d '{
    "coreStats": {
      "aim": 95
    }
  }' \
  http://localhost:8000/api/v1/teams/$TEAM_ID/players/$PLAYER_ID \
  -v

# Then test with multiple core stats
echo -e "\n\nTest 2: Updating multiple core stats..."
curl -X PUT -H "Content-Type: application/json" \
  -d '{
    "coreStats": {
      "aim": 90,
      "clutch": 85,
      "gameSense": 88
    }
  }' \
  http://localhost:8000/api/v1/teams/$TEAM_ID/players/$PLAYER_ID \
  -v

echo -e "\n\nDone." 