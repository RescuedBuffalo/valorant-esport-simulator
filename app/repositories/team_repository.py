"""
Repository for team and player database operations.
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.models.team import Team
from app.models.player import Player

class TeamRepository:
    """Repository for team and player operations."""
    
    @staticmethod
    def create_team(db: Session, team_data: Dict[str, Any]) -> Team:
        """
        Create a new team in the database.
        
        Args:
            db: Database session
            team_data: Team data including name, region, etc.
            
        Returns:
            Created Team object
        """
        # Create the team
        team = Team(
            name=team_data.get("name"),
            tag=team_data.get("tag", team_data.get("name")[:4].upper()),
            region=team_data.get("region", "Unknown"),
            budget=team_data.get("budget", 1000000.0),
            weekly_salary_cap=team_data.get("weekly_salary_cap", 100000.0),
            reputation=team_data.get("reputation", 50.0),
            sponsor_income=team_data.get("sponsor_income", 0.0),
            merchandise_income=team_data.get("merchandise_income", 0.0),
            facility_level=team_data.get("facility_level", 1),
            training_quality=team_data.get("training_quality", 50.0),
            staff_quality=team_data.get("staff_quality", 50.0),
            playstyle=team_data.get("playstyle", {}),
            map_stats=team_data.get("map_stats", {}),
        )
        
        db.add(team)
        db.commit()
        db.refresh(team)
        
        return team
    
    @staticmethod
    def add_player_to_team(db: Session, team_id: str, player_data: Dict[str, Any]) -> Player:
        """
        Add a player to a team.
        
        Args:
            db: Database session
            team_id: ID of the team
            player_data: Player data
            
        Returns:
            Created Player object
        """
        # Create a new player
        player = Player(
            team_id=team_id,
            first_name=player_data.get("firstName"),
            last_name=player_data.get("lastName"),
            gamer_tag=player_data.get("gamerTag"),
            age=player_data.get("age"),
            nationality=player_data.get("nationality"),
            region=player_data.get("region"),
            primary_role=player_data.get("primaryRole"),
            salary=player_data.get("salary"),
            
            # Core stats
            aim=player_data.get("coreStats", {}).get("aim", 50.0),
            game_sense=player_data.get("coreStats", {}).get("gameSense", 50.0),
            movement=player_data.get("coreStats", {}).get("movement", 50.0),
            utility_usage=player_data.get("coreStats", {}).get("utilityUsage", 50.0),
            communication=player_data.get("coreStats", {}).get("communication", 50.0),
            clutch=player_data.get("coreStats", {}).get("clutch", 50.0),
            
            # Proficiencies
            role_proficiencies=player_data.get("roleProficiencies", {}),
            agent_proficiencies=player_data.get("agentProficiencies", {}),
        )
        
        db.add(player)
        db.commit()
        db.refresh(player)
        
        return player
    
    @staticmethod
    def get_teams(db: Session, skip: int = 0, limit: int = 100) -> List[Team]:
        """
        Get all teams.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of Team objects
        """
        return db.query(Team).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_team_by_id(db: Session, team_id: str) -> Optional[Team]:
        """
        Get a team by ID.
        
        Args:
            db: Database session
            team_id: ID of the team
            
        Returns:
            Team object if found, None otherwise
        """
        return db.query(Team).filter(Team.id == team_id).first()
    
    @staticmethod
    def get_team_by_name(db: Session, team_name: str) -> Optional[Team]:
        """
        Get a team by name.
        
        Args:
            db: Database session
            team_name: Name of the team
            
        Returns:
            Team object if found, None otherwise
        """
        return db.query(Team).filter(Team.name == team_name).first()
    
    @staticmethod
    def get_team_players(db: Session, team_id: str) -> List[Player]:
        """
        Get all players for a team.
        
        Args:
            db: Database session
            team_id: ID of the team
            
        Returns:
            List of Player objects
        """
        return db.query(Player).filter(Player.team_id == team_id).all()
    
    @staticmethod
    def format_team_response(team: Team, players: List[Player]) -> Dict[str, Any]:
        """
        Format team and players for API response.
        
        Args:
            team: Team object
            players: List of Player objects
            
        Returns:
            Formatted team data
        """
        return {
            "id": team.id,
            "name": team.name,
            "region": team.region,
            "reputation": team.reputation,
            "players": [p.to_dict() for p in players],
            "stats": {
                "wins": team.match_wins,
                "losses": team.match_losses,
                "tournaments_won": team.tournament_wins,
                "prize_money": 0  # Calculate from tournament participations if needed
            }
        } 