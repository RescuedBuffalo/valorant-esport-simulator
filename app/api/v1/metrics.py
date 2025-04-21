"""
Endpoints for receiving metrics from the frontend.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from prometheus_client import Histogram, Counter, Gauge
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

# New MapBuilder performance metrics
MAP_BUILDER_OPERATION_LATENCY = Histogram(
    "app_map_builder_operation_latency_seconds",
    "MapBuilder operation latency in seconds",
    ["operation_type"]
)

MAP_BUILDER_OBJECT_COUNT = Gauge(
    "app_map_builder_object_count",
    "Number of objects in the map by type",
    ["object_type"]
)

MAP_BUILDER_COLLISION_CHECK_COUNT = Counter(
    "app_map_builder_collision_check_count",
    "Number of collision detection checks performed",
    ["result"]  # "hit" or "miss"
)

MAP_BUILDER_PATHFINDING_TIME = Histogram(
    "app_map_builder_pathfinding_time_seconds",
    "Time taken to calculate pathfinding",
    ["algorithm", "complexity"]
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


class MapBuilderPerformanceMetric(BaseModel):
    """MapBuilder performance metric data."""
    operation_type: str
    duration_seconds: float


class MapBuilderCollisionMetric(BaseModel):
    """MapBuilder collision detection metric data."""
    result: str  # "hit" or "miss"
    count: int = 1


class MapBuilderObjectCountMetric(BaseModel):
    """MapBuilder object count metric data."""
    object_counts: Dict[str, int]


class MapBuilderPathfindingMetric(BaseModel):
    """MapBuilder pathfinding performance metric data."""
    algorithm: str
    complexity: str  # "low", "medium", "high" based on number of obstacles and distance
    duration_seconds: float


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


@router.post("/map_builder_performance")
async def track_map_builder_performance(metric: MapBuilderPerformanceMetric):
    """
    Track MapBuilder operation performance.
    """
    MAP_BUILDER_OPERATION_LATENCY.labels(
        operation_type=metric.operation_type
    ).observe(metric.duration_seconds)
    
    return {"status": "ok"}


@router.post("/map_builder_collision")
async def track_map_builder_collision(metric: MapBuilderCollisionMetric):
    """
    Track MapBuilder collision detection checks.
    """
    MAP_BUILDER_COLLISION_CHECK_COUNT.labels(
        result=metric.result
    ).inc(metric.count)
    
    return {"status": "ok"}


@router.post("/map_builder_object_count")
async def track_map_builder_object_count(metric: MapBuilderObjectCountMetric):
    """
    Track the number of objects in the MapBuilder by type.
    """
    for obj_type, count in metric.object_counts.items():
        MAP_BUILDER_OBJECT_COUNT.labels(object_type=obj_type).set(count)
    
    return {"status": "ok"}


@router.post("/map_builder_pathfinding")
async def track_map_builder_pathfinding(metric: MapBuilderPathfindingMetric):
    """
    Track MapBuilder pathfinding performance.
    """
    MAP_BUILDER_PATHFINDING_TIME.labels(
        algorithm=metric.algorithm,
        complexity=metric.complexity
    ).observe(metric.duration_seconds)
    
    return {"status": "ok"} 