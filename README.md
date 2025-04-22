# Valorant-Sim

A management simulation game for Valorant esports, where you can run a professional team, compete in tournaments, and build your own esports dynasty.

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 14 or higher
- PostgreSQL 13 or higher
- pip and npm package managers

### Installation

1. Clone this repository
2. Install backend dependencies:
   ```
   pip install -e .
   ```
3. Install frontend dependencies:
   ```
   cd app/frontend
   npm install --legacy-peer-deps
   ```

### Running the Application

Use the provided start script to run both the backend and frontend:

```
./start.sh
```

The backend API will be available at http://localhost:8000 and the frontend at http://localhost:3001.

> **Note:** We recently consolidated our API structure. The backend FastAPI application now runs from `app.main:app` instead of `app.api.main:app`. See [API_CONSOLIDATION.md](./API_CONSOLIDATION.md) for details.

## Features

- Create and manage Valorant esports teams
- Simulate matches with detailed round-by-round play
- Player development and transfer market
- Tournament and league competitions
- Team facilities and staff management
- Financial management
- Statistical tracking and analysis

## Implementation

The application is built using:

- **Backend**: FastAPI + SQLAlchemy
- **Frontend**: React + TypeScript + Material UI
- **Database**: PostgreSQL
- **Monitoring**: Prometheus + Grafana 

## API Documentation

Once the application is running, you can access the API documentation at:

- http://localhost:8000/docs - Swagger UI
- http://localhost:8000/redoc - ReDoc

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 