#!/bin/bash

echo "Starting Prometheus locally with config from prometheus/prometheus.local.yml"
echo "Note: You must have Prometheus installed on your system for this to work"
echo ""

# Check if prometheus is installed
if ! command -v prometheus &> /dev/null; then
    echo "Error: Prometheus is not installed or not in your PATH."
    echo "Please install Prometheus first. You can do this with:"
    echo "  - macOS: brew install prometheus"
    echo "  - Linux: Check your distribution's package manager"
    echo "  - Or download from https://prometheus.io/download/"
    exit 1
fi

# Start Prometheus with the local config
prometheus --config.file=prometheus/prometheus.local.yml 