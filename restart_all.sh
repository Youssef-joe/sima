#!/bin/bash
cd "/media/youssef/New Volume/Projects/Freelance/مشروع الذكاء المعماري/SIMA_AI_UNIFIED_V1p1"

echo "🔄 Stopping all containers..."
docker-compose down

echo "🧹 Cleaning up..."
docker system prune -f

echo "🚀 Starting all services..."
docker-compose up --build -d

echo "📊 Checking status..."
docker-compose ps

echo "✅ All services restarted!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"