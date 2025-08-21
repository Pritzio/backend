# ⚙️ Environment Configuration - Pritzio Backend

## 📋 **Overview**

This guide helps you configure the Pritzio Backend application using environment variables. These settings control how the application behaves in different environments (development, staging, production).

## 🚀 **Quick Start**

### **1. Copy the Example File**
```bash
cp env.example .env
```

### **2. Edit Your Configuration**
```bash
nano .env  # or use your preferred editor
```

### **3. Verify Configuration**
```bash
npm run security:verify
```

## 🔧 **Configuration Categories**

### **🌐 Application Settings**

#### **Server Configuration**
```bash
# Port where the application runs
BACKEND_PORT=3000

# API route prefix (optional)
API_PREFIX=api/v1
```

**What this means:**
- Your API will be available at `http://localhost:3000/api/v1`
- Change `BACKEND_PORT` if port 3000 is already in use
- Remove `API_PREFIX` if you don't want a prefix

#### **Documentation**
```bash
# Enable Swagger API documentation
ENABLE_SWAGGER=true
```

**What this means:**
- Visit `http://localhost:3000/api/docs` to see API documentation
- Set to `false` in production for security

### **🗄️ Database Settings**

```bash
# PostgreSQL Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pritzio_user
DB_PASSWORD=your_secure_password
DB_NAME=pritzio
```

**What you need to know:**
- These settings connect to your PostgreSQL database
- Make sure PostgreSQL is running before starting the app
- Use different credentials for each environment
- **Never share your database password**

### **🔴 Redis Settings**

```bash
# Redis Cache Connection
REDIS_HOST=localhost
REDIS_PORT=6379
```

**What this does:**
- Connects to Redis for caching and session storage
- Make sure Redis is running before starting the app
- Usually runs on port 6379 by default

### **🔐 Security Configuration**

#### **JWT Authentication**
```bash
# JWT Token Settings
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-different-refresh-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

**Important:**
- `JWT_SECRET` must be at least 32 characters long
- Use different secrets for access and refresh tokens
- `15m` = 15 minutes, `7d` = 7 days
- **Keep these secrets safe and unique per environment**

#### **Password Security**
```bash
# Password Hashing Strength
BCRYPT_ROUNDS=12
```

**What this means:**
- Higher numbers = more secure but slower
- 12 is a good balance for most applications
- Don't go below 10 or above 15

#### **API Protection**
```bash
# API Keys for Protected Endpoints
VALID_API_KEYS=pritzio-dev-key,pritzio-prod-key
```

**How to use:**
- Create unique keys for different clients/environments
- Separate multiple keys with commas
- Include in requests as `X-API-Key` header
- **Rotate these keys regularly**

### **🛡️ Security Features**

#### **Request Limits**
```bash
# Protect against abuse
MAX_PAYLOAD_SIZE=10485760      # 10MB maximum request size
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests per 15 minutes per IP
```

**What this protects against:**
- Large file uploads that could crash the server
- Too many requests from the same IP address
- Denial of service attacks

**Adjust if needed:**
- Increase `MAX_PAYLOAD_SIZE` if you need larger uploads
- Decrease `RATE_LIMIT_MAX_REQUESTS` for stricter limits
- Increase for APIs with heavy usage

#### **Security Logging**
```bash
# Monitor security events
ENABLE_SECURITY_LOGGING=true
SECURITY_LOG_LEVEL=info
```

**Logging levels (from least to most verbose):**
- `error`: Only security errors
- `warn`: Errors + warnings
- `info`: Errors + warnings + general events
- `debug`: All above + debug information
- `verbose`: Everything (very detailed)

**Recommendations:**
- Use `info` for production
- Use `debug` or `verbose` for troubleshooting
- Set to `error` if logs are too noisy

### **📝 Application Logging**

```bash
# Control application logs
ENABLE_LOGGING=true
NESTJS_LOG_LEVELS=error,warn,log,debug,verbose
TYPEORM_LOGGING=false
```

**What each does:**
- `ENABLE_LOGGING`: Turn all NestJS logs on/off
- `NESTJS_LOG_LEVELS`: Which types of logs to show
- `TYPEORM_LOGGING`: Show database queries (useful for debugging)

**Recommendations:**
- Keep `TYPEORM_LOGGING=false` in production (too verbose)
- Use `error,warn,log` for production
- Add `debug,verbose` when troubleshooting

### **🌐 CORS Settings**

```bash
# Allow requests from these domains
CORS_ORIGINS=http://localhost:3000,https://myapp.com
```

**What this means:**
- Only listed domains can make requests to your API
- Separate multiple domains with commas
- Include your frontend application's URL
- **Important for security in production**

## 🏗️ **Environment-Specific Configurations**

### **🛠️ Development Environment**
```bash
# .env (for local development)
BACKEND_PORT=3000
ENABLE_SWAGGER=true
ENABLE_LOGGING=true
NESTJS_LOG_LEVELS=error,warn,log,debug
TYPEORM_LOGGING=false
SECURITY_LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=200
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **🧪 Staging Environment**
```bash
# .env.staging
BACKEND_PORT=3001
ENABLE_SWAGGER=true
ENABLE_LOGGING=true
NESTJS_LOG_LEVELS=error,warn,log
TYPEORM_LOGGING=false
SECURITY_LOG_LEVEL=info
RATE_LIMIT_MAX_REQUESTS=150
# Use staging database and Redis
```

### **🚀 Production Environment**
```bash
# .env.production
BACKEND_PORT=8080
ENABLE_SWAGGER=false
ENABLE_LOGGING=true
NESTJS_LOG_LEVELS=error,warn
TYPEORM_LOGGING=false
SECURITY_LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=100
# Use production database and Redis
# Use strong, unique secrets
```

## 🔐 **Security Best Practices**

### **✅ DO**
- Use different secrets for each environment
- Keep production secrets secure and private
- Rotate API keys regularly
- Use strong, random JWT secrets
- Enable security logging in production
- Restrict CORS origins in production

### **❌ DON'T**
- Commit `.env` files to version control
- Use the same secrets across environments
- Share production credentials
- Use weak or predictable secrets
- Disable security features in production
- Allow all CORS origins (`*`) in production

## 🛠️ **Common Configuration Issues**

### **🔧 Application Won't Start**

**Error: "Port already in use"**
```bash
# Change the port
BACKEND_PORT=3001
```

**Error: "Database connection failed"**
```bash
# Check your database settings
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# Make sure PostgreSQL is running
./docker/scripts/docker-commands.sh dev
```

**Error: "Redis connection failed"**
```bash
# Check Redis settings
REDIS_HOST=localhost
REDIS_PORT=6379

# Make sure Redis is running
./docker/scripts/docker-commands.sh dev
```

### **🔧 Authentication Issues**

**Error: "JWT secret not configured"**
```bash
# Add a strong JWT secret
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
```

**Error: "Invalid API key"**
```bash
# Make sure API keys are configured
VALID_API_KEYS=your-api-key-1,your-api-key-2

# Include in requests as header
X-API-Key: your-api-key-1
```

### **🔧 Performance Issues**

**Too many rate limit errors**
```bash
# Increase limits if needed
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
```

**Large file upload errors**
```bash
# Increase payload size if needed
MAX_PAYLOAD_SIZE=52428800  # 50MB
```

## 📊 **Configuration Validation**

### **Check Your Configuration**
```bash
# Verify all security settings
npm run security:verify

# Check if all required variables are set
npm run start:dev
```

### **Test Your API**
```bash
# Test basic connectivity
curl http://localhost:3000/

# Test with API key
curl -H "X-API-Key: your-api-key" http://localhost:3000/protected-endpoint
```

## 🆘 **Getting Help**

### **Common Commands**
```bash
# Start the application
npm run start:dev

# Check configuration
npm run security:verify

# View logs
npm run logs:status

# Start database and Redis
./docker/scripts/docker-commands.sh dev
```

### **Documentation Links**
- [Docker Setup](./docker-setup.md) - Setting up the development environment
- [Security Setup](./security-setup.md) - Understanding the security system
- [Authentication Guide](../modules/authentication.md) - Using the auth system

---

**Need help?** Check the troubleshooting sections in our other guides or review the example configuration in `env.example`.

**Last Updated**: 2025-08-21  
**Status**: ✅ Ready for Use
