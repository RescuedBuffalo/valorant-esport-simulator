from fastapi import APIRouter, HTTPException
from typing import List
from app.simulation.match_engine import MatchEngine

router = APIRouter()
match_engine = MatchEngine()

@router.post("/simulate")
async def simulate_match(team_a: List[dict], team_b: List[dict]):
    """Simulate a match between two teams."""
    try:
        result = match_engine.simulate_match(team_a, team_b)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 