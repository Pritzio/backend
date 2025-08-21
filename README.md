# 🏷️ Pritzio Backend

[![Node.js](https://img.shields.io/badge/node-24.6.0-brightgreen.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-10.x-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Backend for Pritzio - Price comparison platform with geolocation and social features**

## 🚀 **Quick Start**

### **1. Prerequisites**
- **Node.js** >= 24.6.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0

### **2. Setup**
```bash
# Clone and install
git clone <https://github.com/Pritzio/backend.git>
cd backend
npm install

# Environment configuration
cp env.example .env
# Edit .env with your settings

# Start services
./docker/scripts/docker-commands.sh dev

# Run application
npm run start:dev
```

### **3. Verify**
- **Backend**: http://localhost:3000/api/v1/health
- **Swagger**: http://localhost:3000/api/docs

## 🛠️ **Development**

### **Available Scripts**
```bash
npm run start:dev      # Development with hot reload
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Lint code
```

### **Production Deployment**
```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh
```

## 🏗️ **Architecture**

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI

## 📚 **Documentation**

- **Module Documentation**: [`.docs/README.md`](.docs/README.md)
- **Authentication Module**: [`.docs/modules/authentication.md`](.docs/modules/authentication.md) ✅ **COMPLETADO Y PROBADO**
- **API Reference**: [Swagger UI](http://localhost:3000/api/docs)

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details
