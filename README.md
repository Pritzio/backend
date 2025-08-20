# 🏷️ Pritzio Backend

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![NestJS Version](https://img.shields.io/badge/nestjs-10.x-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-24.x-blue.svg)](https://www.docker.com/)

> **Backend for Pritzio - Price comparison platform with geolocation and social features**

## 📋 **Table of Contents**

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Docker](#-docker)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Support](#-support)

## 🌟 **Overview**

Pritzio is a revolutionary price comparison application designed to democratize access to price information, empowering consumers to make informed purchasing decisions. The platform features geolocated price comparison, premium subscriptions, smart advertising, small business inclusion, and social dynamics.

### **Key Features**
- **Geolocated Price Comparison** - Find the best prices near you
- **Premium Subscriptions** - Price history, alerts, and personalized reminders
- **Smart Advertising** - Non-intrusive ads with brand management portal
- **Small Business Integration** - Community-validated local commerce
- **Social Dynamics** - Comments, ratings, and gamification system

## 🚀 **Features**

- **Authentication & Authorization** - JWT-based security with role management
- **Geolocation Services** - Location-based price searching and filtering
- **Real-time Price Updates** - Live price monitoring and notifications
- **Social Features** - User interactions, ratings, and community validation
- **Analytics Dashboard** - Business insights and performance metrics
- **Mobile-First API** - Optimized for mobile and web applications
- **Scalable Architecture** - Monolithic modular design for future growth

## 🛠️ **Tech Stack**

### **Backend Framework**
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment

### **Database & Cache**
- **PostgreSQL** - Primary relational database
- **Redis** - Caching and session management
- **TypeORM** - Object-relational mapping

### **Infrastructure**
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Health Checks** - Service monitoring

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Swagger** - API documentation

## 📋 **Prerequisites**

### **Required Software**
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0

### **System Requirements**
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **OS**: macOS 10.15+, Ubuntu 20.04+, Windows 10+

### **Verify Installation**
```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version   # Should be >= 9.0.0

# Check Docker version
docker --version # Should be >= 24.0.0

# Check Docker Compose version
docker-compose --version # Should be >= 2.20.0
```

## 🚀 **Quick Start**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-org/pritzio-backend.git
cd pritzio-backend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
```bash
# Copy environment file
cp env.example .env

# Edit with your configuration
nano .env
```

### **4. Start Services with Docker**
```bash
# Start PostgreSQL and Redis
./docker/scripts/docker-commands.sh dev

# Or manually
docker-compose up -d postgres redis
```

### **5. Run the Application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### **6. Verify Installation**
```bash
# Check if app is running
curl http://localhost:3000

# Expected response: "Hello World!"
```

## 👨‍💻 **Development**

### **Available Scripts**
```bash
# Development
npm run start:dev      # Start in watch mode
npm run start:debug    # Start in debug mode
npm run start:prod     # Start in production mode

# Building
npm run build          # Build the application
npm run build:prod     # Build for production

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run e2e tests
npm run test:cov       # Run tests with coverage
npm run test:debug     # Run tests in debug mode

# Linting & Formatting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier

# Version Management
npm run version:internal    # Create internal development version
npm run version:release     # Create official release version
```

### **Development Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
npm run test
npm run lint

# 3. Create internal version
npm run version:internal

# 4. Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name

# 5. When ready for release
npm run version:release
```

## 🐳 **Docker**

### **Quick Docker Commands**
```bash
# Start development environment
./docker/scripts/docker-commands.sh dev

# Start full environment
./docker/scripts/docker-commands.sh dev-build

# View logs
./docker/scripts/docker-commands.sh logs

# Check status
./docker/scripts/docker-commands.sh status

# Stop services
./docker/scripts/docker-commands.sh dev-stop

# Clean up
./docker/scripts/docker-commands.sh clean
```

### **Manual Docker Commands**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Access containers
docker-compose exec postgres psql -U pritzio_user -d pritzio
docker-compose exec redis redis-cli
```

### **Docker Services**
- **Backend** - NestJS application (port 3000)
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache and sessions (port 6379)

## 📚 **API Documentation**

### **Swagger UI**
Once the application is running, access the interactive API documentation:

```
http://localhost:3000/api/docs
```

### **API Endpoints**
- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Users**: `GET /users`, `POST /users`, `PUT /users/:id`
- **Products**: `GET /products`, `POST /products`, `PUT /products/:id`
- **Prices**: `GET /prices`, `POST /prices`, `GET /prices/compare`

### **Authentication**
The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 🧪 **Testing**

### **Running Tests**
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### **Test Structure**
```
test/
├── app.e2e-spec.ts          # E2E tests
├── jest-e2e.json            # E2E Jest configuration
└── unit/                    # Unit tests
    ├── auth/
    ├── users/
    └── products/
```

### **Test Database**
Tests use a separate test database. Ensure your `.env.test` file is configured:

```bash
# .env.test
DATABASE_NAME=pritzio_test
DATABASE_USER=pritzio_test_user
DATABASE_PASSWORD=pritzio_test_password
```

## 🚀 **Deployment**

### **Production Build**
```bash
# Build the application
npm run build:prod

# Start production server
npm run start:prod
```

### **Docker Production**
```bash
# Build production image
docker build -t pritzio-backend:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  --name pritzio-backend \
  --env-file .env.prod \
  pritzio-backend:latest
```

### **Environment Variables**
Ensure these production variables are set:
```bash
NODE_ENV=production
JWT_SECRET=<strong-secret-key>
DATABASE_HOST=<production-db-host>
DATABASE_PASSWORD=<strong-db-password>
REDIS_PASSWORD=<strong-redis-password>
```

## 📁 **Project Structure**

```
src/
├── app.controller.ts         # Main application controller
├── app.module.ts            # Root application module
├── app.service.ts           # Main application service
├── main.ts                  # Application entry point
├── modules/                 # Feature modules
│   ├── auth/               # Authentication module
│   ├── users/              # Users management
│   ├── products/           # Products catalog
│   ├── prices/             # Price management
│   ├── locations/          # Geolocation services
│   ├── social/             # Social features
│   └── notifications/      # Notification system
├── shared/                  # Shared resources
│   ├── database/           # Database configuration
│   ├── entities/           # Base entities
│   ├── interfaces/         # Common interfaces
│   ├── decorators/         # Custom decorators
│   ├── guards/             # Authentication guards
│   ├── interceptors/       # Request/response interceptors
│   └── pipes/              # Validation pipes
└── config/                  # Configuration files
    ├── database.config.ts  # Database configuration
    ├── redis.config.ts     # Redis configuration
    └── app.config.ts       # Application configuration

docker/                      # Docker configuration
├── README.md               # Docker documentation
├── scripts/                # Docker utility scripts
└── volumes/                # Persistent volumes

.dev/                       # Development documentation
├── README.md               # Main documentation index
├── DOCUMENTATION_INDEX.md  # Complete documentation index
├── architecture/           # Architecture documentation
├── development/            # Development guidelines
├── setup/                  # Setup instructions
├── decisions/              # Architecture decision records
└── version-control/        # Version management system
```

## 🤝 **Contributing**

### **Development Guidelines**
1. **Code Style** - Follow ESLint and Prettier configuration
2. **Testing** - Write tests for new features
3. **Documentation** - Update relevant documentation
4. **Commits** - Use conventional commit messages
5. **Branches** - Create feature branches for new work

### **Commit Message Format**
```bash
# Format: type(scope): description
feat(auth): add JWT authentication
fix(users): resolve user creation bug
docs(api): update API documentation
style(global): fix code formatting
refactor(database): optimize database queries
test(products): add product validation tests
chore(deps): update dependencies
```

### **Pull Request Process**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Ensure all tests pass
6. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **NestJS Team** - For the amazing framework
- **PostgreSQL** - For the robust database
- **Redis** - For the fast caching solution
- **Docker** - For the containerization platform
- **Open Source Community** - For the tools and libraries

---

**Made with ❤️ by the Pritzio Development Team**

*Empowering consumers through transparent pricing information*
