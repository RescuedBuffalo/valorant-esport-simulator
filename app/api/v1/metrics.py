"""
Endpoints for receiving metrics from the frontend.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from prometheus_client import Histogram, Counter
import logging

from app.core.prometheus import observe_page_load_time, ERROR_COUNT, REQUEST_LATENCY

router = APIRouter()

# Create metrics for franchise dashboard
COMPONENT_RENDER_TIME = Histogram(
    "app_component_render_time_seconds",
    "Component render time in seconds",
    ["component"]
)

FRANCHISE_INTERACTION_COUNT = Counter(
    "app_franchise_interaction_count",
    "Number of interactions with franchise features",
    ["action", "component"]
)

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

class CustomMetric(BaseModel):
    """Custom metric data for extended tracking."""
    metric_name: str
    component: str
    duration_seconds: Optional[float] = None
    count: Optional[int] = None
    labels: Optional[Dict[str, str]] = None

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
    
    # For franchise interactions, we'll track them separately
    if metric.component.startswith('Franchise'):
        FRANCHISE_INTERACTION_COUNT.labels(
            action=metric.action,
            component=metric.component
        ).inc()
        
    return {"status": "ok"}

@router.post("/custom")
async def track_custom_metric(metric: CustomMetric):
    """
    Track custom metrics from frontend components.
    """
    try:
        if metric.metric_name == "component_render_time" and metric.duration_seconds is not None:
            COMPONENT_RENDER_TIME.labels(component=metric.component).observe(metric.duration_seconds)
            return {"status": "ok"}
        
        # Handle other custom metrics as needed
        logging.warning(f"Unhandled custom metric: {metric.metric_name}")
        return {"status": "unknown_metric", "message": f"Metric type {metric.metric_name} not configured"}
    
    except Exception as e:
        logging.error(f"Error processing custom metric {metric.metric_name}: {str(e)}")
        return {"status": "error", "message": str(e)} 