from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.simulation.player_generator import PlayerGenerator
from app.repositories.team_repository import TeamRepository

router = APIRouter()
player_generator = PlayerGenerator()

class TeamCreate(BaseModel):
    name: str
    region: Optional[str] = None

def transform_player(player: Dict[str, Any]) -> Dict[str, Any]:
    """Transform player dictionary to match frontend expectations."""
    # Format is already good from the generator, return as is
    return player

@router.post("/")
async def create_team(team_data: TeamCreate, db: Session = Depends(get_db)):
    """Create a new team and save to database."""
    try:
        # Generate roster using existing player generator
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
        
        # Create team in database
        team_db_data = {
            "name": team_data.name,
            "region": team_data.region or "Unknown",
            "reputation": round(reputation, 1),
        }
        
        team = TeamRepository.create_team(db, team_db_data)
        
        # Add players to the team in database
        for player_data in roster:
            TeamRepository.add_player_to_team(db, team.id, player_data)
        
        # Get all players from the database
        players = TeamRepository.get_team_players(db, team.id)
        
        # Format response
        response = TeamRepository.format_team_response(team, players)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_teams(db: Session = Depends(get_db)):
    """List all teams from database."""
    teams_db = TeamRepository.get_teams(db)
    teams_response = []
    
    for team in teams_db:
        players = TeamRepository.get_team_players(db, team.id)
        teams_response.append(
            TeamRepository.format_team_response(team, players)
        )
    
    return {"teams": teams_response}

@router.get("/{team_id}")
async def get_team(team_id: str, db: Session = Depends(get_db)):
    """Get team details from database."""
    team = TeamRepository.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    players = TeamRepository.get_team_players(db, team.id)
    response = TeamRepository.format_team_response(team, players)
    
    return response 