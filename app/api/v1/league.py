"""
API endpoints for League and Circuit management.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.repositories.league_repository import LeagueRepository

router = APIRouter()

# ----- Pydantic Models for Request/Response ----- #

class LeagueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    region: str
    prize_pool: Optional[float] = 0.0
    tier: Optional[int] = 1
    logo_url: Optional[str] = None
    max_teams: Optional[int] = 12
    seasons_per_year: Optional[int] = 2
    format: Optional[Dict[str, Any]] = None
    
class LeagueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    prize_pool: Optional[float] = None
    tier: Optional[int] = None
    logo_url: Optional[str] = None
    max_teams: Optional[int] = None
    seasons_per_year: Optional[int] = None
    current_season: Optional[int] = None
    active: Optional[bool] = None
    format: Optional[Dict[str, Any]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class CircuitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    league_id: str
    season: Optional[int] = 1
    stage: str
    prize_pool: Optional[float] = 0.0
    format: Optional[Dict[str, Any]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
class CircuitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    season: Optional[int] = None
    stage: Optional[str] = None
    prize_pool: Optional[float] = None
    format: Optional[Dict[str, Any]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# ----- League API Endpoints ----- #

@router.post("/leagues")
async def create_league(
    league_data: LeagueCreate,
    db: Session = Depends(get_db)
):
    """Create a new league."""
    # Check if league with same name already exists
    existing_league = LeagueRepository.get_league_by_name(db, league_data.name)
    if existing_league:
        raise HTTPException(status_code=400, detail="League with this name already exists")
    
    # Ensure format is a dict, not None
    if league_data.format is None:
        league_data_dict = league_data.dict()
        league_data_dict["format"] = {}
    else:
        league_data_dict = league_data.dict()
    
    league = LeagueRepository.create_league(db, league_data_dict)
    return LeagueRepository.format_league_response(league)

@router.get("/leagues")
async def list_leagues(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all leagues."""
    try:
        leagues = LeagueRepository.get_leagues(db, skip, limit)
        return {"leagues": [LeagueRepository.format_league_response(league) for league in leagues]}
    except Exception as e:
        print(f"Error in list_leagues: {e}")
        return {"leagues": [], "error": str(e)}

@router.get("/leagues/{league_id}")
async def get_league(
    league_id: str,
    include_teams: bool = False,
    include_circuits: bool = False,
    db: Session = Depends(get_db)
):
    """Get a specific league by ID."""
    try:
        league = LeagueRepository.get_league_by_id(db, league_id)
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        response = LeagueRepository.format_league_response(
            league, 
            include_teams=include_teams,
            include_circuits=include_circuits
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_league: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/leagues/{league_id}")
async def update_league(
    league_id: str,
    league_data: LeagueUpdate,
    db: Session = Depends(get_db)
):
    """Update a league's details."""
    # Convert pydantic model to dict, removing None values
    update_data = {k: v for k, v in league_data.dict().items() if v is not None}
    
    updated_league = LeagueRepository.update_league(db, league_id, update_data)
    if not updated_league:
        raise HTTPException(status_code=404, detail="League not found")
    
    return LeagueRepository.format_league_response(updated_league)

@router.delete("/leagues/{league_id}")
async def delete_league(
    league_id: str,
    db: Session = Depends(get_db)
):
    """Delete a league."""
    success = LeagueRepository.delete_league(db, league_id)
    if not success:
        raise HTTPException(status_code=404, detail="League not found")
    
    return {"status": "success", "message": "League deleted successfully"}

# ----- Team-League Management ----- #

@router.post("/leagues/{league_id}/teams/{team_id}")
async def add_team_to_league(
    league_id: str,
    team_id: str,
    db: Session = Depends(get_db)
):
    """Add a team to a league."""
    success, message = LeagueRepository.add_team_to_league(db, league_id, team_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"status": "success", "message": message}

@router.delete("/leagues/{league_id}/teams/{team_id}")
async def remove_team_from_league(
    league_id: str,
    team_id: str,
    db: Session = Depends(get_db)
):
    """Remove a team from a league."""
    success, message = LeagueRepository.remove_team_from_league(db, league_id, team_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"status": "success", "message": message}

@router.get("/leagues/{league_id}/teams")
async def get_league_teams(
    league_id: str,
    db: Session = Depends(get_db)
):
    """Get all teams in a league."""
    league = LeagueRepository.get_league_by_id(db, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    teams = LeagueRepository.get_league_teams(db, league_id)
    return {"teams": [team.to_dict() for team in teams]}

@router.get("/leagues/{league_id}/players")
async def get_league_players(
    league_id: str,
    db: Session = Depends(get_db)
):
    """Get all players in a league."""
    league = LeagueRepository.get_league_by_id(db, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    players = LeagueRepository.get_league_players(db, league_id)
    return {"players": [player.to_dict() for player in players]}

# ----- Circuit API Endpoints ----- #

@router.post("/circuits")
async def create_circuit(
    circuit_data: CircuitCreate,
    db: Session = Depends(get_db)
):
    """Create a new circuit within a league."""
    # Check if the league exists
    league = LeagueRepository.get_league_by_id(db, circuit_data.league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Ensure format is a dict, not None
    if circuit_data.format is None:
        circuit_data_dict = circuit_data.dict()
        circuit_data_dict["format"] = {}
    else:
        circuit_data_dict = circuit_data.dict()
    
    circuit = LeagueRepository.create_circuit(db, circuit_data_dict)
    return circuit.to_dict()

@router.get("/circuits")
async def list_circuits(
    league_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all circuits, optionally filtered by league."""
    circuits = LeagueRepository.get_circuits(db, league_id, skip, limit)
    return {"circuits": [circuit.to_dict() for circuit in circuits]}

@router.get("/circuits/{circuit_id}")
async def get_circuit(
    circuit_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific circuit by ID."""
    circuit = LeagueRepository.get_circuit_by_id(db, circuit_id)
    if not circuit:
        raise HTTPException(status_code=404, detail="Circuit not found")
    
    return circuit.to_dict()

@router.put("/circuits/{circuit_id}")
async def update_circuit(
    circuit_id: str,
    circuit_data: CircuitUpdate,
    db: Session = Depends(get_db)
):
    """Update a circuit's details."""
    # Convert pydantic model to dict, removing None values
    update_data = {k: v for k, v in circuit_data.dict().items() if v is not None}
    
    updated_circuit = LeagueRepository.update_circuit(db, circuit_id, update_data)
    if not updated_circuit:
        raise HTTPException(status_code=404, detail="Circuit not found")
    
    return updated_circuit.to_dict()

@router.delete("/circuits/{circuit_id}")
async def delete_circuit(
    circuit_id: str,
    db: Session = Depends(get_db)
):
    """Delete a circuit."""
    success = LeagueRepository.delete_circuit(db, circuit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Circuit not found")
    
    return {"status": "success", "message": "Circuit deleted successfully"} 