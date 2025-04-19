from fastapi import APIRouter, HTTPException, Body, Request, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
import traceback
from app.simulation.match_engine import MatchEngine
from app.api.v1.team import teams_db  # Import the teams database
from app.db.session import get_db
from app.repositories.match_repository import MatchRepository
from sqlalchemy.orm import Session
import uuid

logger = logging.getLogger("valorant-sim")
router = APIRouter()
match_engine = MatchEngine()

class MatchRequest(BaseModel):
    team_a: str
    team_b: str

def transform_for_engine(players: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transform players from frontend format to match_engine expected format.
    
    Frontend format has:
    - stats: {aim, game_sense, utility, leadership, clutch, movement}
    
    Engine expects:
    - coreStats: {aim, gameSense, utilityUsage, communication, clutch, movement}
    - careerStats: with kdRatio, clutchRate, firstBloodRate fields
    """
    transformed = []
    for player in players:
        # Create a copy to avoid modifying original data
        transformed_player = player.copy()
        
        # If the player already has the right format, just use it
        if "coreStats" in transformed_player and "careerStats" in transformed_player:
            transformed.append(transformed_player)
            continue
            
        # Create coreStats from stats
        stats = player.get("stats", {})
        transformed_player["coreStats"] = {
            "aim": stats.get("aim", 50),
            "gameSense": stats.get("game_sense", 50),
            "utilityUsage": stats.get("utility", 50),
            "communication": stats.get("leadership", 50),
            "clutch": stats.get("clutch", 50),
            "movement": stats.get("movement", 50)
        }
        
        # Add careerStats if missing
        if "careerStats" not in transformed_player:
            # Convert form to win rate (form is 0-100, winRate is 0-1)
            win_rate = player.get("form", 50) / 100 if "form" in player else 0.5
            
            transformed_player["careerStats"] = {
                "matches": 20,  # Reasonable default
                "wins": int(20 * win_rate),
                "losses": int(20 * (1 - win_rate)),
                "kills": 200,  # Reasonable default
                "deaths": 180,
                "assists": 100,
                "kdRatio": stats.get("aim", 50) / 40,  # Base KD on aim stat
                "acs": 220,  # Average combat score
                "firstBloods": 30,
                "clutches": 10,
                "plants": 15,
                "defuses": 8,
                "firstBloodRate": stats.get("clutch", 50) / 250,  # Make it a percentage based on clutch stat
                "clutchRate": stats.get("clutch", 50) / 150,  # Percentage based on clutch stat
                "winRate": win_rate
            }
        
        # Ensure other required fields exist
        if "id" not in transformed_player:
            transformed_player["id"] = player.get("id", str(uuid.uuid4()))
        if "firstName" not in transformed_player:
            transformed_player["firstName"] = player.get("first_name", "Player")
        if "lastName" not in transformed_player:
            transformed_player["lastName"] = player.get("last_name", "Unknown")
        if "primaryRole" not in transformed_player:
            transformed_player["primaryRole"] = player.get("role", "Flex")
        if "agentProficiencies" not in transformed_player:
            transformed_player["agentProficiencies"] = player.get("agent_proficiencies", {})
        
        transformed.append(transformed_player)
    
    return transformed

@router.post("/simulate")
async def simulate_match(match_req: MatchRequest, request: Request, db: Session = Depends(get_db)):
    """Simulate a match between two teams using team names."""
    logger.info(f"Match simulation requested: {match_req.team_a} vs {match_req.team_b}")
    
    # Log request details
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.debug(f"Request from: {client_host}, User-Agent: {user_agent}")
    
    try:
        # Log available teams for debugging
        team_names = [team["name"] for team in teams_db]
        logger.debug(f"Available teams: {team_names}")
        
        # Find teams by name
        team_a = next((team for team in teams_db if team["name"] == match_req.team_a), None)
        team_b = next((team for team in teams_db if team["name"] == match_req.team_b), None)
        
        if not team_a:
            error_msg = f"Team '{match_req.team_a}' not found"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
            
        if not team_b:
            error_msg = f"Team '{match_req.team_b}' not found"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        # Validate team structures
        if "players" not in team_a or not team_a["players"]:
            error_msg = f"Team '{match_req.team_a}' has no players"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
            
        if "players" not in team_b or not team_b["players"]:
            error_msg = f"Team '{match_req.team_b}' has no players"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Transform players to match_engine expected format
        team_a_players = transform_for_engine(team_a["players"])
        team_b_players = transform_for_engine(team_b["players"])
        
        logger.info(f"Starting match simulation between {match_req.team_a} ({len(team_a_players)} players) and {match_req.team_b} ({len(team_b_players)} players)")
        
        # Simulate match using the transformed players
        result = match_engine.simulate_match(team_a_players, team_b_players, "Haven")
        
        # Update team stats
        if result["score"]["team_a"] > result["score"]["team_b"]:
            team_a["stats"]["wins"] += 1
            team_b["stats"]["losses"] += 1
            logger.info(f"Match complete: {match_req.team_a} wins {result['score']['team_a']}-{result['score']['team_b']}")
        else:
            team_b["stats"]["wins"] += 1
            team_a["stats"]["losses"] += 1
            logger.info(f"Match complete: {match_req.team_b} wins {result['score']['team_b']}-{result['score']['team_a']}")
        
        # Save match data to database
        logger.info("Saving match data to database")
        
        # Prepare match data for database
        match_data = {
            "team_a_name": match_req.team_a,
            "team_b_name": match_req.team_b,
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
            # This makes it easier for the frontend to visualize
            round_logs = {}
            for log in result["economy_logs"]:
                round_logs[log["round_number"]] = log
                
            # Attach each log to its corresponding round
            for i, round_data in enumerate(result["rounds"]):
                if i in round_logs:
                    round_data["economy_log"] = round_logs[i]
                
                # Add player loadouts and credits if available
                if "player_loadouts" in round_data:
                    logger.debug(f"Round {i} has player loadouts")
                else:
                    logger.debug(f"Round {i} does not have player loadouts")
                
                # Ensure these fields are included in the response if they exist
                for field in ["player_credits", "player_loadouts", "is_pistol_round"]:
                    if field in round_data:
                        continue
                    else:
                        logger.debug(f"Field {field} not present in round {i}")
            
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