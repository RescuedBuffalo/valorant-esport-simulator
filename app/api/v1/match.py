from fastapi import APIRouter, HTTPException, Body, Request, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
import traceback
from app.simulation.match_engine import MatchEngine
from app.db.session import get_db
from app.repositories.match_repository import MatchRepository
from app.repositories.team_repository import TeamRepository
from sqlalchemy.orm import Session
import uuid

logger = logging.getLogger("valorant-sim")
router = APIRouter()
match_engine = MatchEngine()

class MatchRequest(BaseModel):
    team_a: str
    team_b: str
    map_name: Optional[str] = "Haven"
    agent_selections: Optional[Dict[str, str]] = None

class RoundSimulationRequest(BaseModel):
    """Request model for simulating a single round with detailed events."""
    team_a: str
    team_b: str
    map_name: str = "Haven"
    round_number: int
    economy: Dict[str, int] = None
    loss_streaks: Dict[str, int] = None
    agent_selections: Optional[Dict[str, str]] = None

def transform_for_engine(players):
    """Transform player data from database format to match engine format."""
    engine_players = []
    for player in players:
        # If player is already in the correct format, just use it directly
        if isinstance(player, dict):
            engine_players.append(player)
        else:
            # Assuming player is a database model instance, convert to dict
            player_dict = player.to_dict() if hasattr(player, 'to_dict') else {
                'id': player.id,
                'firstName': player.first_name,
                'lastName': player.last_name,
                'gamerTag': player.gamer_tag,
                'age': player.age,
                'nationality': player.nationality,
                'region': player.region,
                'primaryRole': player.primary_role,
                'salary': player.salary,
                'coreStats': {
                    'aim': player.aim,
                    'gameSense': player.game_sense,
                    'movement': player.movement,
                    'utilityUsage': player.utility_usage,
                    'communication': player.communication,
                    'clutch': player.clutch
                },
                'roleProficiencies': player.role_proficiencies,
                'agentProficiencies': player.agent_proficiencies,
                'careerStats': {
                    'matchesPlayed': player.matches_played,
                    'kills': player.kills,
                    'deaths': player.deaths,
                    'assists': player.assists,
                    'firstBloods': player.first_bloods,
                    'clutches': player.clutches_won
                }
            }
            engine_players.append(player_dict)
    return engine_players

@router.post("/simulate")
async def simulate_match(match_req: MatchRequest, request: Request, db: Session = Depends(get_db)):
    """Simulate a match between two teams using team IDs or names."""
    logger.info(f"Match simulation requested: {match_req.team_a} vs {match_req.team_b} on {match_req.map_name}")
    
    # Log request details
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.debug(f"Request from: {client_host}, User-Agent: {user_agent}")
    
    try:
        # Try to find teams by ID first, then by name
        team_a_db = TeamRepository.get_team_by_id(db, match_req.team_a)
        if not team_a_db:
            team_a_db = TeamRepository.get_team_by_name(db, match_req.team_a)
            
        team_b_db = TeamRepository.get_team_by_id(db, match_req.team_b)
        if not team_b_db:
            team_b_db = TeamRepository.get_team_by_name(db, match_req.team_b)
        
        if not team_a_db:
            error_msg = f"Team '{match_req.team_a}' not found"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
            
        if not team_b_db:
            error_msg = f"Team '{match_req.team_b}' not found"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        # Get players for both teams
        team_a_players_db = TeamRepository.get_team_players(db, team_a_db.id)
        team_b_players_db = TeamRepository.get_team_players(db, team_b_db.id)
        
        # Validate team structures
        if not team_a_players_db:
            error_msg = f"Team '{match_req.team_a}' has no players"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
            
        if not team_b_players_db:
            error_msg = f"Team '{match_req.team_b}' has no players"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Transform players to match_engine expected format
        team_a_players = transform_for_engine(team_a_players_db)
        team_b_players = transform_for_engine(team_b_players_db)
        
        logger.info(f"Starting match simulation between {team_a_db.name} ({len(team_a_players)} players) and {team_b_db.name} ({len(team_b_players)} players) on {match_req.map_name}")
        
        # Pass agent selections to match engine if provided
        if match_req.agent_selections:
            logger.info(f"Using custom agent selections: {match_req.agent_selections}")
            # Set any preset agent selections in the match engine
            match_engine.player_agents = match_req.agent_selections
        
        # Simulate match using the transformed players and specified map
        result = match_engine.simulate_match(team_a_players, team_b_players, match_req.map_name)
        
        # Update team stats in database
        if result["score"]["team_a"] > result["score"]["team_b"]:
            team_a_db.match_wins += 1
            team_b_db.match_losses += 1
            logger.info(f"Match complete: {team_a_db.name} wins {result['score']['team_a']}-{result['score']['team_b']}")
        else:
            team_b_db.match_wins += 1
            team_a_db.match_losses += 1
            logger.info(f"Match complete: {team_b_db.name} wins {result['score']['team_b']}-{result['score']['team_a']}")
        
        # Commit changes to database
        db.commit()
        
        # Save match data to database
        logger.info("Saving match data to database")
        
        # Prepare match data for database
        match_data = {
            "team_a_name": team_a_db.name,
            "team_b_name": team_b_db.name,
            "map": result["map"],
            "duration": result["duration"],
            "score": result["score"],
            "mvp": result["mvp"],
            "rounds": result["rounds"]
        }
        
        # Create match record
        match_record = MatchRepository.create_match_record(db, match_data)
        
        # Save economy logs
        if "economy_logs" in result:
            MatchRepository.add_economy_logs(db, match_record.id, result["economy_logs"])
            
            # Associate economy logs with rounds in the API response
            round_logs = {}
            for log in result["economy_logs"]:
                round_logs[log["round_number"]] = log
                
            # Attach each log to its corresponding round
            for i, round_data in enumerate(result["rounds"]):
                if i in round_logs:
                    round_data["economy_log"] = round_logs[i]
        
        logger.info(f"Match data saved to database with ID {match_record.id}")
        
        # Include match record ID in the result for reference
        result["match_id"] = match_record.id
        
        return result
    except HTTPException:
        # Re-raise HTTP exceptions so they get proper status codes
        raise
    except Exception as e:
        # Log detailed error and traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error during match simulation: {str(e)}")
        logger.error(error_trace)
        
        # Return a meaningful error message
        raise HTTPException(
            status_code=400, 
            detail={
                "message": f"Failed to simulate match: {str(e)}",
                "error_type": str(type(e).__name__)
            }
        )

@router.get("/economy/{match_id}")
async def get_match_economy(match_id: str, db: Session = Depends(get_db)):
    """
    Get detailed economy data for a specific match.
    
    Args:
        match_id: ID of the match to retrieve data for
        
    Returns:
        Detailed economy data for analysis
    """
    match = MatchRepository.get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    economy_logs = MatchRepository.get_match_economy_logs(db, match_id)
    
    # Format the response data
    return {
        "match_id": match_id,
        "match_details": {
            "team_a": match.team_a_name,
            "team_b": match.team_b_name,
            "score": f"{match.team_a_score}-{match.team_b_score}",
            "map": match.map_name,
            "date": match.match_date.isoformat()
        },
        "economy_logs": [
            {
                "round": log.round_number,
                "team_a": {
                    "start": log.team_a_economy_start,
                    "end": log.team_a_economy_end,
                    "spent": log.team_a_spend,
                    "reward": log.team_a_reward if hasattr(log, "team_a_reward") else None
                },
                "team_b": {
                    "start": log.team_b_economy_start,
                    "end": log.team_b_economy_end,
                    "spent": log.team_b_spend,
                    "reward": log.team_b_reward if hasattr(log, "team_b_reward") else None
                },
                "winner": log.winner,
                "spike_planted": log.spike_planted,
                "notes": log.notes
            }
            for log in economy_logs
        ]
    }

@router.get("/recent")
async def get_recent_matches(limit: int = 10, db: Session = Depends(get_db)):
    """
    Get a list of recent matches.
    
    Args:
        limit: Maximum number of matches to return (default: 10)
        
    Returns:
        List of recent matches
    """
    matches = MatchRepository.get_recent_matches(db, limit)
    
    return {
        "matches": [
            {
                "id": match.id,
                "team_a": match.team_a_name,
                "team_b": match.team_b_name,
                "score": f"{match.team_a_score}-{match.team_b_score}",
                "map": match.map_name,
                "date": match.match_date.isoformat()
            }
            for match in matches
        ]
    }

@router.post("/simulate-round")
async def simulate_round_with_events(request: RoundSimulationRequest, db: Session = Depends(get_db)):
    """
    Simulate a single round with detailed play-by-play events.
    
    This endpoint provides a more detailed simulation than the standard match simulation,
    generating events that can be used for play-by-play commentary.
    """
    logger.info(f"Round simulation requested: Round {request.round_number} between {request.team_a} and {request.team_b}")
    
    try:
        # Find teams in database
        team_a_db = TeamRepository.get_team_by_id(db, request.team_a)
        if not team_a_db:
            team_a_db = TeamRepository.get_team_by_name(db, request.team_a)
            
        team_b_db = TeamRepository.get_team_by_id(db, request.team_b)
        if not team_b_db:
            team_b_db = TeamRepository.get_team_by_name(db, request.team_b)
        
        # Add more detailed logging for debugging
        logger.info(f"Team A lookup result: {team_a_db}")
        logger.info(f"Team B lookup result: {team_b_db}")
        
        if not team_a_db:
            error_msg = f"Team '{request.team_a}' not found"
            logger.error(error_msg)
            # Return a more descriptive error to help debugging
            raise HTTPException(
                status_code=404, 
                detail={
                    "message": error_msg,
                    "team_id": request.team_a,
                    "suggestions": "Check that the team ID is valid in the database or try using the team name instead."
                }
            )
            
        if not team_b_db:
            error_msg = f"Team '{request.team_b}' not found"
            logger.error(error_msg)
            # Return a more descriptive error to help debugging
            raise HTTPException(
                status_code=404,
                detail={
                    "message": error_msg,
                    "team_id": request.team_b,
                    "suggestions": "Check that the team ID is valid in the database or try using the team name instead."
                }
            )
        
        # Get players for both teams
        team_a_players = transform_for_engine(TeamRepository.get_team_players(db, team_a_db.id))
        team_b_players = transform_for_engine(TeamRepository.get_team_players(db, team_b_db.id))
        
        logger.info(f"Team A players retrieved: {len(team_a_players)}")
        logger.info(f"Team B players retrieved: {len(team_b_players)}")
        
        # Initialize match engine for round simulation
        match_engine = MatchEngine()
        
        # Set up the match_engine state for this specific round
        match_engine.current_match = match_engine.SimMatch(
            team_a=team_a_players, 
            team_b=team_b_players, 
            map_name=request.map_name
        )
        
        # Set round number
        match_engine.round_number = request.round_number
        
        # Set economy if provided, otherwise use default
        if request.economy:
            match_engine.economy = request.economy
        else:
            # Default economy based on round number
            is_pistol_round = request.round_number == 0 or request.round_number == 12
            if is_pistol_round:
                match_engine.economy = {"team_a": 4000, "team_b": 4000}
            else:
                match_engine.economy = {"team_a": 5000, "team_b": 5000}
        
        # Set loss streaks if provided
        if request.loss_streaks:
            match_engine.loss_streaks = request.loss_streaks
        else:
            match_engine.loss_streaks = {"team_a": 0, "team_b": 0}
        
        # Set agent selections if provided
        if request.agent_selections:
            match_engine.player_agents = request.agent_selections
        else:
            # Generate agent selections
            match_engine.player_agents = match_engine._select_agents_for_teams(team_a_players, team_b_players)
        
        # Simulate the round with detailed events
        round_result = match_engine._simulate_round_with_events()
        
        # Prepare response with additional team information
        response = {
            "round_data": round_result,
            "team_info": {
                "team_a": {
                    "id": team_a_db.id,
                    "name": team_a_db.name,
                    "logo": team_a_db.logo,
                    "players": [
                        {
                            "id": player["id"],
                            "firstName": player["firstName"],
                            "lastName": player["lastName"],
                            "gamerTag": player["gamerTag"],
                            "agent": match_engine.player_agents.get(player["id"], "Unknown")
                        }
                        for player in team_a_players
                    ]
                },
                "team_b": {
                    "id": team_b_db.id,
                    "name": team_b_db.name,
                    "logo": team_b_db.logo,
                    "players": [
                        {
                            "id": player["id"],
                            "firstName": player["firstName"],
                            "lastName": player["lastName"],
                            "gamerTag": player["gamerTag"],
                            "agent": match_engine.player_agents.get(player["id"], "Unknown")
                        }
                        for player in team_b_players
                    ]
                }
            }
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Error during round simulation: {str(e)}")
        logger.error(error_trace)
        
        raise HTTPException(
            status_code=400, 
            detail={
                "message": f"Failed to simulate round: {str(e)}",
                "error_type": str(type(e).__name__),
                "request_data": {
                    "team_a": request.team_a,
                    "team_b": request.team_b,
                    "round_number": request.round_number,
                    "map_name": request.map_name
                }
            }
        ) 