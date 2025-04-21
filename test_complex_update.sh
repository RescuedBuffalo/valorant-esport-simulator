#!/bin/bash

# Test updating multiple player fields
echo "Testing complex player update..."
TEAM_ID="2de8af3e-0bc8-4b9c-a26e-3ba79b0941ae"
PLAYER_ID="54235d3c-2c54-4caf-b7bc-85fc4990fe63"
TIMESTAMP=$(date +%s)

curl -X PUT -H "Content-Type: application/json" \
  -d '{
    "gamerTag": "UpdatedTag'$TIMESTAMP'",
    "firstName": "UpdatedFirst",
    "lastName": "UpdatedLast",
    "age": 25,
    "coreStats": {
      "aim": 85,
      "gameSense": 90
    }
  }' \
  http://localhost:8000/api/v1/teams/$TEAM_ID/players/$PLAYER_ID \
  -v 

echo -e "\n\nDone." 