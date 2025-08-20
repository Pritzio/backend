export const appConfig = {
  port: parseInt(process.env.BACKEND_PORT) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableLogging: process.env.ENABLE_LOGGING !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
};
