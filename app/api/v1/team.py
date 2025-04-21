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

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    reputation: Optional[float] = None
    tag: Optional[str] = None
    facility_level: Optional[int] = None
    training_quality: Optional[float] = None
    staff_quality: Optional[float] = None
    playstyle: Optional[Dict[str, Any]] = None

class PlayerUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    gamerTag: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    region: Optional[str] = None
    primaryRole: Optional[str] = None
    salary: Optional[int] = None
    coreStats: Optional[Dict[str, Any]] = None
    roleProficiencies: Optional[Dict[str, Any]] = None
    agentProficiencies: Optional[Dict[str, Any]] = None
    isStarter: Optional[bool] = None
    
    class Config:
        # Allow extra fields to be flexible with incoming data
        extra = "allow"
        # This allows field validation to be more permissive
        validate_assignment = False

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

@router.put("/{team_id}")
async def update_team(
    team_id: str, 
    team_data: TeamUpdate, 
    db: Session = Depends(get_db)
):
    """Update team details."""
    try:
        team = TeamRepository.get_team_by_id(db, team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Update team in database
        update_data = team_data.dict(exclude_unset=True)
        updated_team = TeamRepository.update_team(db, team_id, update_data)
        
        # Get all players from the database
        players = TeamRepository.get_team_players(db, team_id)
        
        # Format response
        response = TeamRepository.format_team_response(updated_team, players)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{team_id}/players/{player_id}")
async def update_player(
    team_id: str,
    player_id: str,
    player_data: PlayerUpdate,
    db: Session = Depends(get_db)
):
    """Update player details."""
    try:
        # Check if team exists
        team = TeamRepository.get_team_by_id(db, team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if player exists and belongs to the team
        player = TeamRepository.get_player_by_id(db, player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        if player.team_id != team_id:
            raise HTTPException(
                status_code=400, 
                detail="Player does not belong to the specified team"
            )
        
        # Update player in database
        update_data = player_data.dict(exclude_unset=True)
        updated_player = TeamRepository.update_player(db, player_id, update_data)
        
        if not updated_player:
            raise HTTPException(status_code=500, detail="Failed to update player")
            
        return updated_player.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{team_id}/players")
async def add_player_to_team(
    team_id: str,
    player_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Add a new player to a team."""
    try:
        # Check if team exists
        team = TeamRepository.get_team_by_id(db, team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Add player to the team
        player = TeamRepository.add_player_to_team(db, team_id, player_data)
        
        return player.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{team_id}/players/{player_id}")
async def remove_player_from_team(
    team_id: str,
    player_id: str,
    db: Session = Depends(get_db)
):
    """Remove a player from a team."""
    try:
        # Check if team exists
        team = TeamRepository.get_team_by_id(db, team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if player exists and belongs to the team
        player = TeamRepository.get_player_by_id(db, player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        if player.team_id != team_id:
            raise HTTPException(
                status_code=400, 
                detail="Player does not belong to the specified team"
            )
        
        # Remove player from the team
        success = TeamRepository.remove_player_from_team(db, player_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to remove player from team")
        
        return {"status": "success", "message": "Player removed from team"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 