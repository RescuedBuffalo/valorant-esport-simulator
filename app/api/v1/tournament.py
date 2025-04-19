from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

@router.get("/")
async def list_tournaments():
    """List all tournaments."""
    # TODO: Implement tournament system
    return {"tournaments": []} 