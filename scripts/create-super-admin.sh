#!/bin/bash

# Script to Create Super Admin - Pritzio Backend
# Usage: ./scripts/create-super-admin.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print with colors
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

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🚀 SUPER ADMIN CREATION - PRITZIO"
    echo "=========================================="
    echo -e "${NC}"
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql not installed. Install PostgreSQL client."
        exit 1
    fi
    
    if [ ! -f .env ]; then
        print_error ".env file not found. Create .env file with database variables."
        exit 1
    fi
    
    print_success "Dependencies verified"
}

# Function to load environment variables
load_env() {
    print_info "Loading environment variables..."
    
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Default variables if not defined
    export DATABASE_HOST=${DATABASE_HOST:-localhost}
    export DATABASE_PORT=${DATABASE_PORT:-5432}
    export DATABASE_NAME=${DATABASE_NAME:-pritzio}
    export DATABASE_USER=${DATABASE_USER:-pritzio_user}
    export DATABASE_PASSWORD=${DATABASE_PASSWORD:-pritzio_password}
    
    print_success "Environment variables loaded"
}

# Function to check database connection
check_database_connection() {
    print_info "Checking database connection..."
    
    if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database. Check credentials in .env"
        exit 1
    fi
}

# Function to check if roles exist
check_roles_exist() {
    print_info "Checking if required roles exist..."
    
    local role_count=$(PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM roles WHERE name = 'super_admin';" | tr -d ' ')
    
    if [ "$role_count" -eq "1" ]; then
        print_success "SUPER_ADMIN role exists"
    else
        print_error "SUPER_ADMIN role not found. Run first: npm run seed:auth"
        exit 1
    fi
}

# Function to create super admin
create_super_admin() {
    print_info "Creating Super Admin..."
    
    local username="${SUPER_ADMIN_USERNAME:-admin}"
    local email="${SUPER_ADMIN_EMAIL:-admin@example.com}"
    local password="${SUPER_ADMIN_PASSWORD:-admin123}"
    local first_name="${SUPER_ADMIN_FIRST_NAME:-Super}"
    local last_name="${SUPER_ADMIN_LAST_NAME:-Admin}"
    
    print_info "Super Admin configuration:"
    print_info "  Username: $username"
    print_info "  Email: $email"
    print_info "  Password: $password"
    print_info "  Name: $first_name $last_name"
    
    if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" \
        -v username="$username" \
        -v email="$email" \
        -v password="$password" \
        -v first_name="$first_name" \
        -v last_name="$last_name" \
        -f scripts/create-super-admin.sql; then
        print_success "Super Admin created successfully"
    else
        print_error "Error creating Super Admin"
        exit 1
    fi
}

# Function to verify super admin was created
verify_super_admin() {
    print_info "Verifying Super Admin creation..."
    
    local username="${SUPER_ADMIN_USERNAME:-admin}"
    
    local user_exists=$(PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM users WHERE username = '$username';" | tr -d ' ')
    
    if [ "$user_exists" -eq "1" ]; then
        print_success "Super Admin user verified"
    else
        print_error "Super Admin user was not created correctly"
        exit 1
    fi
}

# Function to show credentials
show_credentials() {
    echo -e "${GREEN}"
    echo "=========================================="
    echo "🎉 SUPER ADMIN CREATED SUCCESSFULLY!"
    echo "=========================================="
    echo ""
    echo "📋 Access Credentials:"
    echo "   👤 Username: ${SUPER_ADMIN_USERNAME:-admin}"
    echo "   📧 Email: ${SUPER_ADMIN_EMAIL:-admin@example.com}"
    echo "   🔑 Password: ${SUPER_ADMIN_PASSWORD:-admin123}"
    echo ""
    echo "🔐 This user has full system access"
    echo "⚠️  IMPORTANT: Change password after first login"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Test login with credentials"
    echo "   2. Verify access to all functionalities"
    echo "   3. Change password for security"
    echo "=========================================="
    echo -e "${NC}"
}

# Main function
main() {
    print_header
    
    print_info "Starting Super Admin creation process..."
    
    check_dependencies
    load_env
    check_database_connection
    check_roles_exist
    
    create_super_admin
    
    verify_super_admin
    
    show_credentials
}

# Execute main function
main "$@"
