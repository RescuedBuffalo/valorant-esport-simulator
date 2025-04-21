"""
Repository for League and Circuit database operations.
"""
from typing import List, Dict, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.league import League, Circuit, league_team_association, league_player_association
from app.models.team import Team
from app.models.player import Player

class LeagueRepository:
    """Repository for League-related database operations."""
    
    @staticmethod
    def create_league(db: Session, league_data: Dict[str, Any]) -> League:
        """Create a new league in the database."""
        league = League(**league_data)
        db.add(league)
        db.commit()
        db.refresh(league)
        return league
    
    @staticmethod
    def get_leagues(db: Session, skip: int = 0, limit: int = 100) -> List[League]:
        """Get all leagues with pagination."""
        return db.query(League).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_league_by_id(db: Session, league_id: str) -> Optional[League]:
        """Get a specific league by its ID."""
        return db.query(League).filter(League.id == league_id).first()
    
    @staticmethod
    def get_league_by_name(db: Session, name: str) -> Optional[League]:
        """Get a league by its name."""
        return db.query(League).filter(League.name == name).first()
    
    @staticmethod
    def update_league(db: Session, league_id: str, league_data: Dict[str, Any]) -> Optional[League]:
        """Update a league's details."""
        league = LeagueRepository.get_league_by_id(db, league_id)
        if not league:
            return None
            
        for key, value in league_data.items():
            if hasattr(league, key):
                setattr(league, key, value)
                
        db.commit()
        db.refresh(league)
        return league
    
    @staticmethod
    def delete_league(db: Session, league_id: str) -> bool:
        """Delete a league from the database."""
        league = LeagueRepository.get_league_by_id(db, league_id)
        if not league:
            return False
            
        db.delete(league)
        db.commit()
        return True
    
    @staticmethod
    def add_team_to_league(db: Session, league_id: str, team_id: str) -> Tuple[bool, str]:
        """
        Add a team to a league.
        Returns (success, message).
        """
        league = LeagueRepository.get_league_by_id(db, league_id)
        if not league:
            return False, "League not found"
            
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return False, "Team not found"
            
        # Check if team is already in the league
        existing = db.query(league_team_association).filter(
            and_(
                league_team_association.c.league_id == league_id,
                league_team_association.c.team_id == team_id
            )
        ).first()
        
        if existing:
            return False, "Team already in league"
            
        if league.team_count >= league.max_teams:
            return False, "League has reached maximum team capacity"
            
        # Add team to league
        league.teams.append(team)
        
        # Add all team's players to the league with the team context
        for player in team.players:
            # Check if player is already in the league with a different team
            player_in_league = db.query(league_player_association).filter(
                and_(
                    league_player_association.c.league_id == league_id,
                    league_player_association.c.player_id == player.id
                )
            ).first()
            
            if player_in_league:
                # Player already in league with a different team - handle this case
                # For now, we'll skip adding them
                continue
                
            # Insert into the association table
            db.execute(
                league_player_association.insert().values(
                    league_id=league_id,
                    player_id=player.id,
                    team_id=team_id
                )
            )
            
        db.commit()
        return True, "Team added to league successfully"
    
    @staticmethod
    def remove_team_from_league(db: Session, league_id: str, team_id: str) -> Tuple[bool, str]:
        """
        Remove a team from a league.
        Returns (success, message).
        """
        league = LeagueRepository.get_league_by_id(db, league_id)
        if not league:
            return False, "League not found"
            
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return False, "Team not found"
            
        # Check if team is in the league
        existing = db.query(league_team_association).filter(
            and_(
                league_team_association.c.league_id == league_id,
                league_team_association.c.team_id == team_id
            )
        ).first()
        
        if not existing:
            return False, "Team not in league"
            
        # Remove team from league
        league.teams.remove(team)
        
        # Remove team's players from the league
        db.execute(
            league_player_association.delete().where(
                and_(
                    league_player_association.c.league_id == league_id,
                    league_player_association.c.team_id == team_id
                )
            )
        )
            
        db.commit()
        return True, "Team removed from league successfully"
    
    @staticmethod
    def get_league_teams(db: Session, league_id: str) -> List[Team]:
        """Get all teams in a league."""
        try:
            league = LeagueRepository.get_league_by_id(db, league_id)
            if not league:
                return []
                
            if not hasattr(league, 'teams') or league.teams is None:
                return []
                
            return league.teams
        except Exception as e:
            print(f"Error fetching teams for league {league_id}: {e}")
            return []
    
    @staticmethod
    def get_league_players(db: Session, league_id: str) -> List[Player]:
        """Get all players in a league."""
        try:
            league = LeagueRepository.get_league_by_id(db, league_id)
            if not league:
                return []
                
            if not hasattr(league, 'players') or league.players is None:
                return []
                
            return league.players
        except Exception as e:
            print(f"Error fetching players for league {league_id}: {e}")
            return []
    
    @staticmethod
    def get_player_team_in_league(db: Session, league_id: str, player_id: str) -> Optional[Team]:
        """Get the team that a player belongs to in a specific league."""
        # Query the league_player_association table to get the team_id
        result = db.query(league_player_association).filter(
            and_(
                league_player_association.c.league_id == league_id,
                league_player_association.c.player_id == player_id
            )
        ).first()
        
        if not result:
            return None
            
        team_id = result.team_id
        return db.query(Team).filter(Team.id == team_id).first()
    
    # Circuit-related methods
    
    @staticmethod
    def create_circuit(db: Session, circuit_data: Dict[str, Any]) -> Circuit:
        """Create a new circuit in the database."""
        circuit = Circuit(**circuit_data)
        db.add(circuit)
        db.commit()
        db.refresh(circuit)
        return circuit
    
    @staticmethod
    def get_circuits(db: Session, league_id: Optional[str] = None, 
                     skip: int = 0, limit: int = 100) -> List[Circuit]:
        """Get all circuits with optional filtering by league."""
        query = db.query(Circuit)
        if league_id:
            query = query.filter(Circuit.league_id == league_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_circuit_by_id(db: Session, circuit_id: str) -> Optional[Circuit]:
        """Get a specific circuit by its ID."""
        return db.query(Circuit).filter(Circuit.id == circuit_id).first()
    
    @staticmethod
    def update_circuit(db: Session, circuit_id: str, circuit_data: Dict[str, Any]) -> Optional[Circuit]:
        """Update a circuit's details."""
        circuit = LeagueRepository.get_circuit_by_id(db, circuit_id)
        if not circuit:
            return None
            
        for key, value in circuit_data.items():
            if hasattr(circuit, key):
                setattr(circuit, key, value)
                
        db.commit()
        db.refresh(circuit)
        return circuit
    
    @staticmethod
    def delete_circuit(db: Session, circuit_id: str) -> bool:
        """Delete a circuit from the database."""
        circuit = LeagueRepository.get_circuit_by_id(db, circuit_id)
        if not circuit:
            return False
            
        db.delete(circuit)
        db.commit()
        return True
    
    @staticmethod
    def format_league_response(league: League, include_teams: bool = False,
                               include_circuits: bool = False) -> Dict[str, Any]:
        """Format a league object for API response."""
        try:
            response = league.to_dict()
            
            if include_teams:
                try:
                    if hasattr(league, 'teams') and league.teams is not None:
                        response["teams"] = []
                        for team in league.teams:
                            try:
                                if hasattr(team, 'to_dict'):
                                    response["teams"].append(team.to_dict())
                                else:
                                    print(f"Team object has no to_dict method: {team}")
                                    # Create a minimal dict with available attributes
                                    minimal_team = {"id": getattr(team, "id", "unknown")}
                                    for attr in ["name", "tag", "region"]:
                                        if hasattr(team, attr):
                                            minimal_team[attr] = getattr(team, attr)
                                    response["teams"].append(minimal_team)
                            except Exception as e:
                                print(f"Error formatting team in league response: {e}")
                    else:
                        response["teams"] = []
                except Exception as e:
                    print(f"Error accessing teams for league {league.id}: {e}")
                    response["teams"] = []
                    
            if include_circuits:
                try:
                    if hasattr(league, 'circuits') and league.circuits is not None:
                        response["circuits"] = []
                        for circuit in league.circuits:
                            try:
                                if hasattr(circuit, 'to_dict'):
                                    response["circuits"].append(circuit.to_dict())
                                else:
                                    print(f"Circuit object has no to_dict method: {circuit}")
                                    # Create a minimal dict with available attributes
                                    minimal_circuit = {"id": getattr(circuit, "id", "unknown")}
                                    for attr in ["name", "stage", "season"]:
                                        if hasattr(circuit, attr):
                                            minimal_circuit[attr] = getattr(circuit, attr)
                                    response["circuits"].append(minimal_circuit)
                            except Exception as e:
                                print(f"Error formatting circuit in league response: {e}")
                    else:
                        response["circuits"] = []
                except Exception as e:
                    print(f"Error accessing circuits for league {league.id}: {e}")
                    response["circuits"] = []
                
            return response
        except Exception as e:
            print(f"Error in format_league_response: {e}")
            # Fallback to creating a minimal response
            return {
                "id": getattr(league, "id", "unknown"),
                "name": getattr(league, "name", "Unknown League"),
                "error": str(e)
            } 