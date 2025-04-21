#!/bin/bash

# Create necessary directories
mkdir -p prometheus

# Start the monitoring stack
echo "Starting monitoring stack (Prometheus, Grafana, etc.)..."
docker-compose -f docker-compose.monitoring.yml up -d

# Display status
echo "Monitoring stack started!"
echo ""
echo "Prometheus UI: http://localhost:9090"
echo "Grafana UI:    http://localhost:3000 (admin/admin)"
echo "cAdvisor UI:   http://localhost:8080"
echo ""
echo "Note: For monitoring to work correctly, ensure the Valorant Sim API is running"
echo "and is configured to expose metrics at the /metrics endpoint."
echo ""
echo "To stop the monitoring stack, run: docker-compose -f docker-compose.monitoring.yml down" 