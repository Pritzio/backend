#!/bin/bash

set -e

echo "🧪 Starting Pritzio Backend Staging Deployment..."

# Check if env.staging exists
if [ ! -f "env.staging" ]; then
    echo "❌ Error: env.staging file not found!"
    echo "Please create env.staging with staging configuration"
    exit 1
fi

# Load staging environment
echo "📋 Loading staging environment..."
export $(cat env.staging | xargs)

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
        echo "❌ Error: $var is not set in env.staging"
        exit 1
    fi
done

# Build staging image
echo "🏗️ Building staging Docker image..."
docker build --target production -t pritzio-backend:staging .

# Stop existing containers
echo "🛑 Stopping existing staging containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Start staging services
echo "🚀 Starting staging services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:${BACKEND_PORT:-3000}/api/v1/health > /dev/null 2>&1; then
    echo "✅ Staging deployment successful!"
    echo "🌐 Backend running on port: ${BACKEND_PORT:-3000}"
    echo "📊 Health check: http://localhost:${BACKEND_PORT:-3000}/api/v1/health"
    echo "📚 Swagger docs: http://localhost:${BACKEND_PORT:-3000}/api/docs"
else
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

echo "🎉 Staging deployment completed successfully!"
