FROM node:24.6.0-alpine3.18 as dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM node:24.6.0-alpine3.18 as dev-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile

FROM node:24.6.0-alpine3.18 as builder

WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:24.6.0-alpine3.18 as prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production --frozen-lockfile

FROM node:24.6.0-alpine3.18 as prod

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Set environment variables
#ENV NODE_ENV=production
#ENV BACKEND_PORT=3000
#ENV API_PREFIX=/api/v1

EXPOSE ${BACKEND_PORT}

# Copy production dependencies and built application
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Health check using wget (available in Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${BACKEND_PORT}/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
