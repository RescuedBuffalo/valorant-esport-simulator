"""
FastAPI application for Valorant Simulation Game.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.game import ValorantSim

app = FastAPI(title="Valorant Simulation API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize game instance
game = ValorantSim()

class TeamCreate(BaseModel):
    name: str
    region: Optional[str] = None

class MatchCreate(BaseModel):
    team_a: str
    team_b: str
    map_name: Optional[str] = None

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Valorant Simulation API is running"}

@app.post("/teams/")
async def create_team(team_data: TeamCreate):
    """Create a new team."""
    try:
        team = game.generate_new_team(team_data.name, team_data.region)
        return {"status": "success", "team": team}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/teams/")
async def list_teams():
    """List all teams."""
    return {"teams": game.teams}

@app.get("/teams/{team_name}")
async def get_team(team_name: str):
    """Get team details."""
    if team_name not in game.teams:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"team": game.teams[team_name]}

@app.post("/matches/")
async def simulate_match(match_data: MatchCreate):
    """Simulate a match between two teams."""
    if match_data.team_a not in game.teams or match_data.team_b not in game.teams:
        raise HTTPException(status_code=404, detail="One or both teams not found")
    
    if match_data.team_a == match_data.team_b:
        raise HTTPException(status_code=400, detail="Cannot simulate match between same team")
    
    try:
        match_result = game.simulate_match(match_data.team_a, match_data.team_b)
        return {"status": "success", "result": match_result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/regions/")
async def get_regions():
    """Get available regions."""
    return {
        "regions": ["NA", "EU", "APAC", "BR", "LATAM"]
    }

@app.get("/maps/")
async def get_maps():
    """Get available maps."""
    return {
        "maps": game.maps
    } 