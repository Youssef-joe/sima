#!/bin/bash

# Add user to docker group if not already
if ! groups $USER | grep -q docker; then
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "Please logout and login again, then run this script"
    exit 1
fi

# Start the services
echo "Starting SIMA AI services..."
docker compose -f docker-compose.simple.yml down
docker compose -f docker-compose.simple.yml up --build -d

echo "Services starting..."
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:8080"
echo "API Docs: http://localhost:8080/docs"

# Check status
sleep 5
docker compose -f docker-compose.simple.yml ps