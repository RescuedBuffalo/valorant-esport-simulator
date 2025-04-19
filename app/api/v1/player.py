from fastapi import APIRouter, HTTPException
from typing import Optional
from app.simulation.player_generator import PlayerGenerator

router = APIRouter()
player_generator = PlayerGenerator()

@router.post("/")
async def generate_player(region: Optional[str] = None, role: Optional[str] = None):
    """Generate a new player."""
    try:
        player = player_generator.generate_player(region=region, role=role)
        return player
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 