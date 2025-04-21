"""
Repository for team and player database operations.
"""
from typing import Dict, List, Optional, Any, Union
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
    def update_team(db: Session, team_id: str, team_data: Dict[str, Any]) -> Team:
        """
        Update an existing team in the database.
        
        Args:
            db: Database session
            team_id: ID of the team to update
            team_data: Updated team data
            
        Returns:
            Updated Team object
        """
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return None
            
        # Update fields that are provided
        if "name" in team_data:
            team.name = team_data["name"]
        
        if "tag" in team_data:
            team.tag = team_data["tag"]
            
        if "region" in team_data:
            team.region = team_data["region"]
            
        if "reputation" in team_data:
            team.reputation = team_data["reputation"]
            
        if "facility_level" in team_data:
            team.facility_level = team_data["facility_level"]
            
        if "training_quality" in team_data:
            team.training_quality = team_data["training_quality"]
            
        if "staff_quality" in team_data:
            team.staff_quality = team_data["staff_quality"]
            
        if "playstyle" in team_data:
            team.playstyle = team_data["playstyle"]
            
        if "budget" in team_data:
            team.budget = team_data["budget"]
            
        if "weekly_salary_cap" in team_data:
            team.weekly_salary_cap = team_data["weekly_salary_cap"]
        
        db.commit()
        db.refresh(team)
        
        return team
        
    @staticmethod
    def update_player(db: Session, player_id: str, player_data: Dict[str, Any]) -> Player:
        """
        Update an existing player in the database.
        
        Args:
            db: Database session
            player_id: ID of the player to update
            player_data: Updated player data
            
        Returns:
            Updated Player object
        """
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            return None
            
        try:
            # Update basic player information
            if "firstName" in player_data:
                player.first_name = player_data["firstName"]
                
            if "lastName" in player_data:
                player.last_name = player_data["lastName"]
                
            if "gamerTag" in player_data:
                player.gamer_tag = player_data["gamerTag"]
                
            if "age" in player_data:
                player.age = player_data["age"]
                
            if "nationality" in player_data:
                player.nationality = player_data["nationality"]
                
            if "region" in player_data:
                player.region = player_data["region"]
                
            if "primaryRole" in player_data:
                player.primary_role = player_data["primaryRole"]
                
            if "salary" in player_data:
                player.salary = player_data["salary"]
                
            if "isStarter" in player_data:
                player.is_starter = player_data["isStarter"]
                
            # Update core stats
            if "coreStats" in player_data:
                core_stats = player_data["coreStats"]
                
                if "aim" in core_stats:
                    player.aim = float(core_stats["aim"])
                    
                if "gameSense" in core_stats:
                    player.game_sense = float(core_stats["gameSense"])
                    
                if "movement" in core_stats:
                    player.movement = float(core_stats["movement"])
                    
                if "utilityUsage" in core_stats:
                    player.utility_usage = float(core_stats["utilityUsage"])
                    
                if "communication" in core_stats:
                    player.communication = float(core_stats["communication"])
                    
                if "clutch" in core_stats:
                    player.clutch = float(core_stats["clutch"])
            
            # Update proficiencies
            if "roleProficiencies" in player_data:
                player.role_proficiencies = player_data["roleProficiencies"]
                
            if "agentProficiencies" in player_data:
                player.agent_proficiencies = player_data["agentProficiencies"]
            
            db.commit()
            db.refresh(player)
            return player
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def remove_player_from_team(db: Session, player_id: str) -> bool:
        """
        Remove a player from their team.
        
        Args:
            db: Database session
            player_id: ID of the player to remove
            
        Returns:
            True if successful, False otherwise
        """
        try:
            player = db.query(Player).filter(Player.id == player_id).first()
            if not player:
                return False
                
            # Set team_id to None to remove from team
            player.team_id = None
            db.commit()
            
            return True
        except Exception as e:
            db.rollback()
            print(f"Error removing player from team: {str(e)}")
            return False
    
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
    def get_player_by_id(db: Session, player_id: str) -> Optional[Player]:
        """
        Get a player by ID.
        
        Args:
            db: Database session
            player_id: ID of the player
            
        Returns:
            Player object if found, None otherwise
        """
        return db.query(Player).filter(Player.id == player_id).first()
    
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
            "facility_level": team.facility_level,
            "training_quality": team.training_quality,
            "staff_quality": team.staff_quality,
            "playstyle": team.playstyle,
            "players": [p.to_dict() for p in players],
            "stats": {
                "wins": team.match_wins,
                "losses": team.match_losses,
                "tournaments_won": team.tournament_wins,
                "prize_money": 0  # Calculate from tournament participations if needed
            }
        } 