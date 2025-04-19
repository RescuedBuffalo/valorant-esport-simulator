"""
Repository for match history operations.
"""
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.match_history import MatchHistory, EconomyLog, MatchPerformance

class MatchRepository:
    """Repository for match history operations."""
    
    @staticmethod
    def create_match_record(db: Session, match_data: Dict[str, Any]) -> MatchHistory:
        """
        Create a new match record.
        
        Args:
            db: Database session
            match_data: Match data including score, teams, rounds, etc.
            
        Returns:
            Created MatchHistory object
        """
        # Create match record
        match_record = MatchHistory(
            map_name=match_data.get("map", "Unknown"),
            duration=match_data.get("duration", 0),
            team_a_name=match_data.get("team_a_name", "Team A"),
            team_b_name=match_data.get("team_b_name", "Team B"),
            team_a_score=match_data.get("score", {}).get("team_a", 0),
            team_b_score=match_data.get("score", {}).get("team_b", 0),
            winner="team_a" if match_data.get("score", {}).get("team_a", 0) > match_data.get("score", {}).get("team_b", 0) else "team_b",
            mvp_id=match_data.get("mvp"),
            rounds_data=match_data.get("rounds", [])
        )
        
        db.add(match_record)
        db.commit()
        db.refresh(match_record)
        
        return match_record
    
    @staticmethod
    def add_economy_logs(db: Session, match_id: str, economy_logs: List[Dict[str, Any]]) -> List[EconomyLog]:
        """
        Add economy logs for a match.
        
        Args:
            db: Database session
            match_id: ID of the match
            economy_logs: List of economy log data
            
        Returns:
            List of created EconomyLog objects
        """
        created_logs = []
        
        for log_data in economy_logs:
            log = EconomyLog(
                match_id=match_id,
                round_number=log_data.get("round_number", 0),
                team_a_economy_start=log_data.get("team_a_start", 0),
                team_b_economy_start=log_data.get("team_b_start", 0),
                team_a_economy_end=log_data.get("team_a_end", 0),
                team_b_economy_end=log_data.get("team_b_end", 0),
                team_a_spend=log_data.get("team_a_spend", 0),
                team_b_spend=log_data.get("team_b_spend", 0),
                team_a_reward=log_data.get("team_a_reward", 0),
                team_b_reward=log_data.get("team_b_reward", 0),
                winner=log_data.get("winner", ""),
                spike_planted=log_data.get("spike_planted", False),
                notes=log_data.get("notes", "")
            )
            
            db.add(log)
            created_logs.append(log)
        
        db.commit()
        
        return created_logs
    
    @staticmethod
    def add_player_performances(db: Session, match_id: str, performances: List[Dict[str, Any]]) -> List[MatchPerformance]:
        """
        Add player performances for a match.
        
        Args:
            db: Database session
            match_id: ID of the match
            performances: List of player performance data
            
        Returns:
            List of created MatchPerformance objects
        """
        created_performances = []
        
        for perf_data in performances:
            performance = MatchPerformance(
                match_id=match_id,
                player_id=perf_data.get("player_id", ""),
                team_name=perf_data.get("team_name", ""),
                player_name=f"{perf_data.get('first_name', '')} {perf_data.get('last_name', '')}",
                player_role=perf_data.get("role", ""),
                kills=perf_data.get("kills", 0),
                deaths=perf_data.get("deaths", 0),
                assists=perf_data.get("assists", 0),
                first_bloods=perf_data.get("first_bloods", 0),
                clutches=perf_data.get("clutches", 0),
                damage=perf_data.get("damage", 0),
                money_spent=perf_data.get("money_spent", 0),
                utility_usage=perf_data.get("utility_usage", 0)
            )
            
            db.add(performance)
            created_performances.append(performance)
        
        db.commit()
        
        return created_performances
        
    @staticmethod
    def get_match_by_id(db: Session, match_id: str) -> Optional[MatchHistory]:
        """
        Get a match by ID.
        
        Args:
            db: Database session
            match_id: ID of the match
            
        Returns:
            MatchHistory object if found, None otherwise
        """
        return db.query(MatchHistory).filter(MatchHistory.id == match_id).first()
    
    @staticmethod
    def get_match_economy_logs(db: Session, match_id: str) -> List[EconomyLog]:
        """
        Get economy logs for a match.
        
        Args:
            db: Database session
            match_id: ID of the match
            
        Returns:
            List of EconomyLog objects
        """
        return db.query(EconomyLog).filter(EconomyLog.match_id == match_id).order_by(EconomyLog.round_number).all()
    
    @staticmethod
    def get_recent_matches(db: Session, limit: int = 10) -> List[MatchHistory]:
        """
        Get recent matches.
        
        Args:
            db: Database session
            limit: Maximum number of matches to return
            
        Returns:
            List of MatchHistory objects
        """
        return db.query(MatchHistory).order_by(MatchHistory.match_date.desc()).limit(limit).all() 