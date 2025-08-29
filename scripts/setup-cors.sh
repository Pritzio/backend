#!/bin/bash

# Script to Configure CORS - Pritzio Backend
# Usage: ./scripts/setup-cors.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🌐 CORS CONFIGURATION - PRITZIO BACKEND"
    echo "=========================================="
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header

print_info "This script will help you configure CORS to allow frontend on localhost:4200"

# Check if .env file exists
if [ -f .env ]; then
    print_success ".env file found"
    
    if grep -q "CORS_ORIGINS" .env; then
        print_info "CORS_ORIGINS already configured in .env"
        grep "CORS_ORIGINS" .env
    else
        print_warning "CORS_ORIGINS not configured in .env"
    fi
else
    print_warning ".env file not found"
fi

echo ""
print_info "To resolve CORS issue, you need to:"
echo ""

echo "1️⃣ Create or update your .env file with:"
echo -e "${GREEN}"
echo "CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:3001"
echo -e "${NC}"
echo ""

echo "2️⃣ Or manually add this line to your .env file:"
echo -e "${YELLOW}"
echo "CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:3001"
echo -e "${NC}"
echo ""

echo "3️⃣ Restart backend after making changes"
echo ""

# Check if backend is running
if pgrep -f "nest start" > /dev/null; then
    print_warning "Backend is running. You will need to restart it after changes."
    echo ""
    echo "To restart:"
    echo "1. Stop backend (Ctrl+C)"
    echo "2. Make changes in .env"
    echo "3. Run: npm run start:dev"
else
    print_info "Backend is not running. You can make changes and then start it."
fi

echo ""
print_info "Recommended configuration for development:"
echo -e "${GREEN}"
echo "NODE_ENV=development"
echo "BACKEND_PORT=3000"
echo "CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:3001"
echo -e "${NC}"

echo ""
print_info "After configuring .env, frontend on localhost:4200 should be able to connect to backend."
echo ""

print_success "Script completed. Review instructions above."
