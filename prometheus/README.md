# Prometheus Monitoring for Valorant Simulator

This directory contains configuration for monitoring the Valorant Simulator application with Prometheus and Grafana.

## Components

1. **Prometheus** - Time series database for metrics storage
2. **Grafana** - Visualization and dashboarding
3. **Node Exporter** - Host-level metrics collection
4. **cAdvisor** - Container metrics collection

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Running instance of the Valorant Simulator application

### Starting the Monitoring Stack

Run the provided script:

```bash
./start-monitoring.sh
```

Or manually:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access the Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (default login: admin/admin)
- **cAdvisor**: http://localhost:8080

## Metrics

The Valorant Simulator exposes the following metrics:

1. **API Metrics**
   - Request count by endpoint and status
   - Request latency distributions
   - Active sessions

2. **Database Metrics**
   - Query latency by operation and table
   - Transaction count

3. **Frontend Metrics**
   - Page load time
   - API call latency
   - User interactions
   - Error counts

## Grafana Dashboards

After setting up Grafana, you can import the following dashboards:

1. Add Prometheus as a data source (Configuration > Data Sources > Add data source)
2. Import dashboards from the Grafana marketplace or from JSON files

## Troubleshooting

- Ensure the API metrics endpoint is accessible at http://localhost:8000/metrics
- Check Prometheus targets at http://localhost:9090/targets to verify all components are up
- Verify docker-compose is running all services with `docker-compose -f docker-compose.monitoring.yml ps` 