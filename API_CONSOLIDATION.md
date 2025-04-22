# API Consolidation

## Overview

We've consolidated the two separate FastAPI applications (`app.main:app` and `app.api.main:app`) into a single unified application. This resolves issues with endpoint discovery and simplifies the architecture.

## Changes Made

1. **Single Entry Point**: All API routes are now served from a single FastAPI application (`app.main:app`)
2. **Proper Organization**: All routes are properly versioned under `/api/v1/`
3. **Backward Compatibility**: Legacy endpoints from the old API structure are preserved for backward compatibility
4. **Improved Documentation**: All endpoints now show up in the same Swagger UI
5. **Deprecation Notice**: The old API entry point displays a deprecation notice

## How to Start the Application

The `start.sh` script has been updated to use the consolidated API:

```bash
# Start the backend server
PYTHONPATH=$SCRIPT_DIR uvicorn app.main:app --reload --port 8000
```

If you're starting the server manually, make sure to use:

```bash
uvicorn app.main:app --reload --port 8000
```

Instead of the old method (`uvicorn app.api.main:app`).

## API Endpoints

### Main API Routes (Recommended)

- `/api/v1/teams` - Team management
- `/api/v1/players` - Player management 
- `/api/v1/matches` - Match simulation
- `/api/v1/tournaments` - Tournament management
- `/api/v1/maps` - Map management
- `/api/v1/metrics` - Application metrics

### Legacy Routes (Deprecated but supported)

The following routes are maintained for backward compatibility but should be migrated to their `/api/v1/` equivalents:

- `/teams/` - Team management (deprecated)
- `/matches/` - Match simulation (deprecated)
- `/regions/` - Region listing (deprecated)
- `/maps/` - Map listing (deprecated)

## Troubleshooting

If you encounter any issues after this consolidation:

1. Make sure you're starting the correct application (`app.main:app`)
2. Check that your frontend is connecting to the right endpoints
3. Verify that the database is properly initialized

## Future Improvements

In the future, we plan to:

1. Fully deprecate the legacy routes
2. Improve API documentation
3. Add more comprehensive testing for all endpoints 