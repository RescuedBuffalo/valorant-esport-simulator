"""
Prometheus metrics for monitoring application performance.
"""
from prometheus_client import Counter, Histogram, Gauge
import time
from typing import Callable
from functools import wraps
from prometheus_fastapi_instrumentator import Instrumentator

# Initialize Prometheus metrics
REQUEST_COUNT = Counter(
    "app_request_count",
    "Number of requests received",
    ["method", "endpoint", "status_code"]
)

REQUEST_LATENCY = Histogram(
    "app_request_latency_seconds",
    "Request latency in seconds",
    ["method", "endpoint"]
)

DB_QUERY_LATENCY = Histogram(
    "app_db_query_latency_seconds",
    "Database query latency in seconds",
    ["operation", "table"]
)

ACTIVE_USERS = Gauge(
    "app_active_users",
    "Number of active users"
)

PAGE_LOAD_TIME = Histogram(
    "app_frontend_page_load_seconds",
    "Frontend page load time in seconds",
    ["page"]
)

ERROR_COUNT = Counter(
    "app_error_count",
    "Number of errors",
    ["type", "location"]
)

# Initialize instrumentator
instrumentator = Instrumentator()

def track_db_operation(operation: str, table: str):
    """
    Decorator to track database operation latency.
    
    Args:
        operation: Type of operation (e.g., "select", "insert", "update", "delete")
        table: Name of the database table
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                DB_QUERY_LATENCY.labels(operation=operation, table=table).observe(duration)
        return wrapper
    return decorator

def increment_error_count(error_type: str, location: str = "unknown"):
    """
    Increment the error counter.
    
    Args:
        error_type: Type of error
        location: Where the error occurred
    """
    ERROR_COUNT.labels(type=error_type, location=location).inc()

def observe_page_load_time(page: str, duration: float):
    """
    Track frontend page load time.
    
    Args:
        page: Page name
        duration: Load time in seconds
    """
    PAGE_LOAD_TIME.labels(page=page).observe(duration)

def setup_instrumentator(app):
    """
    Setup the Prometheus instrumentator with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    # Configure instrumentator with custom metrics
    instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=True) 