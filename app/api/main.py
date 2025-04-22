"""
DEPRECATED: This file is kept for backward compatibility but is no longer used.

The functionality from this API has been consolidated into the main FastAPI application
in app.main:app. Please update your code to point to the main application.

For more information, see the start.sh script for how to start the application properly.
"""

import logging
from fastapi import FastAPI

# Log a warning
logging.warning(
    "The app.api.main:app FastAPI application is DEPRECATED. "
    "All functionality has been moved to app.main:app. "
    "Please update your code to use the main application instead."
)

# Create a minimal app that just returns a deprecation notice
app = FastAPI(title="DEPRECATED: Valorant Simulation API")

@app.get("/")
async def root():
    """Health check endpoint that indicates the API is deprecated."""
    return {
        "status": "deprecated",
        "message": "This API is deprecated. Please use the main API at app.main:app instead.",
        "migration_path": "Update start.sh to use 'uvicorn app.main:app' instead of 'uvicorn app.api.main:app'"
    } 