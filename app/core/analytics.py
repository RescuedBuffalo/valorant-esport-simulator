"""
Analytics module for tracking user engagement and game events.
"""
from datetime import datetime
from typing import Any, Dict, Optional

import mixpanel
import sentry_sdk
from fastapi import Request

class Analytics:
    def __init__(self, mixpanel_token: str, environment: str = "development"):
        self.mp = mixpanel.Mixpanel(mixpanel_token)
        self.environment = environment
        self.mixpanel_token = mixpanel_token
        
        # Initialize Sentry only if DSN is provided
        if sentry_sdk.Hub.current.client is None and environment == "production":
            dsn = "YOUR_SENTRY_DSN"  # Replace with actual DSN in production
            if dsn and dsn != "YOUR_SENTRY_DSN":
                sentry_sdk.init(
                    dsn=dsn,
                    environment=environment,
                    traces_sample_rate=1.0,
                )

    def track_game_event(
        self,
        user_id: str,
        event_name: str,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track a game-related event."""
        if properties is None:
            properties = {}
            
        properties.update({
            "timestamp": datetime.utcnow().isoformat(),
            "environment": self.environment,
        })
        
        if self.mixpanel_token:
            self.mp.track(user_id, event_name, properties)

    def track_match_result(
        self,
        user_id: str,
        match_id: str,
        team_a_score: int,
        team_b_score: int,
        map_name: str,
        duration_seconds: int,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track match results and statistics."""
        if properties is None:
            properties = {}
            
        properties.update({
            "match_id": match_id,
            "team_a_score": team_a_score,
            "team_b_score": team_b_score,
            "map_name": map_name,
            "duration_seconds": duration_seconds,
        })
        
        self.track_game_event(user_id, "match_completed", properties)

    def track_player_transaction(
        self,
        user_id: str,
        player_id: str,
        transaction_type: str,
        amount: float,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track player transfers and contract negotiations."""
        if properties is None:
            properties = {}
            
        properties.update({
            "player_id": player_id,
            "transaction_type": transaction_type,
            "amount": amount,
        })
        
        self.track_game_event(user_id, "player_transaction", properties)

    def track_team_progress(
        self,
        user_id: str,
        team_id: str,
        reputation: float,
        budget: float,
        tournament_wins: int,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track team progression metrics."""
        if properties is None:
            properties = {}
            
        properties.update({
            "team_id": team_id,
            "reputation": reputation,
            "budget": budget,
            "tournament_wins": tournament_wins,
        })
        
        self.track_game_event(user_id, "team_progress", properties)

    def track_user_session(
        self,
        user_id: str,
        session_id: str,
        request: Request
    ):
        """Track user session information."""
        if not self.mixpanel_token:
            return  # Skip tracking if no token is configured
        
        properties = {
            "session_id": session_id,
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent"),
            "referrer": request.headers.get("referer"),
        }
        
        self.track_game_event(user_id, "session_start", properties)

    def track_feature_usage(
        self,
        user_id: str,
        feature_name: str,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track usage of specific game features."""
        if properties is None:
            properties = {}
            
        properties.update({
            "feature_name": feature_name,
        })
        
        self.track_game_event(user_id, "feature_used", properties) 