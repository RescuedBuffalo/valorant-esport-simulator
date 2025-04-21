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

# Create metrics specifically for MapBuilder
MAP_BUILDER_ACTION_COUNT = Counter(
    "app_map_builder_action_count",
    "Number of MapBuilder actions by type and entity",
    ["action", "entity_type"]
)

class PageLoadTimeMetric(BaseModel):
    """Page load time metric data."""
    page: str
    duration_seconds: float


class ComponentRenderTimeMetric(BaseModel):
    """Component render time metric data."""
    component: str
    duration_seconds: float


class UserInteractionMetric(BaseModel):
    """User interaction metric data."""
    component: str
    action: str
    data: Optional[Dict[str, Any]] = None


class FrontendErrorMetric(BaseModel):
    """Frontend error metric data."""
    error_type: str
    location: str
    message: str


class MapBuilderActionMetric(BaseModel):
    """MapBuilder action metric data."""
    action: str
    entity_type: str
    count: int = 1


@router.post("/page_load")
async def track_page_load(metric: PageLoadTimeMetric):
    """
    Track page load time.
    """
    observe_page_load_time(metric.page, metric.duration_seconds)
    return {"status": "ok"}


@router.post("/component_render")
async def track_component_render(metric: ComponentRenderTimeMetric):
    """
    Track component render time.
    """
    COMPONENT_RENDER_TIME.labels(component=metric.component).observe(metric.duration_seconds)
    return {"status": "ok"}


@router.post("/frontend_error")
async def track_frontend_error(metric: FrontendErrorMetric):
    """
    Track frontend errors.
    """
    # Increment the error counter in Prometheus
    ERROR_COUNT.labels(
        type=metric.error_type,
        location=f"frontend:{metric.location}"
    ).inc()
    
    # Log the error for server-side tracking
    logging.error(
        f"Frontend error: {metric.error_type} in {metric.location}: {metric.message}"
    )
    
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


@router.post("/map_builder_action")
async def track_map_builder_action(metric: MapBuilderActionMetric):
    """
    Track MapBuilder-specific actions.
    """
    MAP_BUILDER_ACTION_COUNT.labels(
        action=metric.action,
        entity_type=metric.entity_type
    ).inc(metric.count)
    
    # Log for debugging if needed
    logging.debug(
        f"MapBuilder action: {metric.action} on {metric.entity_type} (count: {metric.count})"
    )
    
    return {"status": "ok"} 