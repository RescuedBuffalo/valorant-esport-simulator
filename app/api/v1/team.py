from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel
from app.simulation.player_generator import PlayerGenerator

router = APIRouter()
player_generator = PlayerGenerator()

# Simple in-memory storage for teams
teams_db: List[Dict[str, Any]] = []

class TeamCreate(BaseModel):
    name: str
    region: Optional[str] = None

def transform_player(player: Dict[str, Any]) -> Dict[str, Any]:
    """Transform player data from backend format to frontend expected format."""
    return {
        "id": player.get("id", str(uuid.uuid4())),
        "firstName": player.get("firstName", ""),
        "lastName": player.get("lastName", ""),
        "age": player.get("age", 0),
        "nationality": player.get("nationality", ""),
        "role": player.get("primaryRole", ""),
        "stats": {
            "aim": player.get("coreStats", {}).get("aim", 0),
            "game_sense": player.get("coreStats", {}).get("gameSense", 0),
            "utility": player.get("coreStats", {}).get("utilityUsage", 0),
            "leadership": player.get("coreStats", {}).get("communication", 0),
            "clutch": player.get("coreStats", {}).get("clutch", 0),
            "movement": player.get("coreStats", {}).get("movement", 0),
        },
        "salary": player.get("salary", 0),
        "form": player.get("careerStats", {}).get("winRate", 0.5) * 100,
        "fatigue": 0,  # Default value
        "agent_proficiencies": player.get("agentProficiencies", {})
    }

@router.post("/")
async def create_team(team_data: TeamCreate):
    """Create a new team."""
    try:
        roster = player_generator.generate_team_roster(region=team_data.region)
        
        # Transform players to match frontend format
        transformed_players = [transform_player(player) for player in roster]
        
        # Calculate average rating from player core stats
        total_rating = 0
        if roster:
            for player in roster:
                core_stats = player.get("coreStats", {})
                avg_stat = sum(core_stats.values()) / len(core_stats) if core_stats else 50
                total_rating += avg_stat
            reputation = total_rating / len(roster) if roster else 50
        else:
            reputation = 50
        
        # Create the team object
        team = {
            "id": str(uuid.uuid4()),
            "name": team_data.name,
            "region": team_data.region or "Unknown",
            "reputation": round(reputation, 1),
            "players": transformed_players,
            "stats": {
                "wins": 0,
                "losses": 0,
                "tournaments_won": 0,
                "prize_money": 0
            }
        }
        
        # Add to in-memory database
        teams_db.append(team)
        
        return team
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_teams():
    """List all teams."""
    return {"teams": teams_db} 