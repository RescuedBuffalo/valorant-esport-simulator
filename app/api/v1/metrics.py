"""
Endpoints for receiving metrics from the frontend.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.core.prometheus import observe_page_load_time, ERROR_COUNT, REQUEST_LATENCY

router = APIRouter()

class PageLoadTimeMetric(BaseModel):
    """Page load time metric data."""
    page: str
    duration_seconds: float

class ApiCallMetric(BaseModel):
    """API call metric data."""
    endpoint: str
    method: str
    duration_seconds: float
    status: int

class ErrorMetric(BaseModel):
    """Error metric data."""
    error_type: str
    message: str
    location: str

class UserInteractionMetric(BaseModel):
    """User interaction metric data."""
    component: str
    action: str
    details: Optional[Dict[str, Any]] = None

@router.post("/page_load_time")
async def track_page_load_time(metric: PageLoadTimeMetric):
    """
    Track frontend page load time.
    """
    observe_page_load_time(metric.page, metric.duration_seconds)
    return {"status": "ok"}

@router.post("/api_call")
async def track_api_call(metric: ApiCallMetric):
    """
    Track API call metrics from the frontend.
    """
    REQUEST_LATENCY.labels(
        method=metric.method,
        endpoint=metric.endpoint
    ).observe(metric.duration_seconds)
    return {"status": "ok"}

@router.post("/error")
async def track_error(metric: ErrorMetric):
    """
    Track frontend errors.
    """
    ERROR_COUNT.labels(
        type=metric.error_type,
        location=f"frontend:{metric.location}"
    ).inc()
    return {"status": "ok"}

@router.post("/user_interaction")
async def track_user_interaction(metric: UserInteractionMetric):
    """
    Track user interactions.
    """
    # We don't directly use this in Prometheus, but could extend to store in a database
    # or expand the metrics to include user interactions if needed
    return {"status": "ok"} 