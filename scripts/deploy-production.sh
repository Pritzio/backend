#!/bin/bash

set -e

echo "🚀 Starting Pritzio Backend Production Deployment..."

# Check if .env.production exists
if [ ! -f "env.production" ]; then
    echo "❌ Error: env.production file not found!"
    echo "Please create env.production with production configuration"
    exit 1
fi

# Load production environment
echo "📋 Loading production environment..."
export $(cat env.production | xargs)

# Validate required environment variables
echo "🔍 Validating environment variables..."
required_vars=(
    "DATABASE_HOST"
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "REDIS_HOST"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "CORS_ORIGIN"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in env.production"
        exit 1
    fi
done

# Build production image
echo "🏗️ Building production Docker image..."
docker build --target production -t pritzio-backend:production .

# Stop existing containers
echo "🛑 Stopping existing production containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:${BACKEND_PORT:-3000}/api/v1/health > /dev/null 2>&1; then
    echo "✅ Production deployment successful!"
    echo "🌐 Backend running on port: ${BACKEND_PORT:-3000}"
    echo "📊 Health check: http://localhost:${BACKEND_PORT:-3000}/api/v1/health"
else
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
