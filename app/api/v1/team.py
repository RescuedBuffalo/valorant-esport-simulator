from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.simulation.player_generator import PlayerGenerator

router = APIRouter()
player_generator = PlayerGenerator()

@router.post("/")
async def create_team(name: str, region: Optional[str] = None):
    """Create a new team."""
    try:
        roster = player_generator.generate_team_roster(region=region)
        return {
            "name": name,
            "region": region or "Unknown",
            "roster": roster
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_teams():
    """List all teams."""
    # TODO: Implement database integration
    return {"teams": []} 