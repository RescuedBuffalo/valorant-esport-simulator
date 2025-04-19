"""
Main application entry point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.analytics import Analytics
from app.core.config import settings

app = FastAPI(
    title="Valorant Esports Simulator",
    description="A management simulation game for Valorant esports",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analytics
analytics = Analytics(
    mixpanel_token=settings.MIXPANEL_TOKEN,
    environment=settings.ENVIRONMENT
)

@app.middleware("http")
async def track_requests(request: Request, call_next):
    """Middleware to track all requests."""
    response = await call_next(request)
    
    if hasattr(request.state, "user_id"):
        analytics.track_user_session(
            user_id=request.state.user_id,
            session_id=request.session.get("session_id"),
            request=request
        )
    
    return response

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Valorant Esports Simulator API"}

# Import and include routers
from app.api.v1 import team, player, match, tournament

app.include_router(team.router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(player.router, prefix="/api/v1/players", tags=["players"])
app.include_router(match.router, prefix="/api/v1/matches", tags=["matches"])
app.include_router(tournament.router, prefix="/api/v1/tournaments", tags=["tournaments"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    ) 