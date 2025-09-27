FROM node:24.6.0-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM node:24.6.0-alpine AS dev-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile

FROM node:24.6.0-alpine AS builder

WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:24.6.0-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production --frozen-lockfile

FROM node:24.6.0-alpine AS prod

# Install only essential dependencies for Playwright
RUN apk add --no-cache \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

EXPOSE ${BACKEND_PORT}

# Copy production dependencies and built application
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user before installing Playwright browsers
USER nestjs

# Install Playwright browsers as the nestjs user
RUN npx playwright install chromium

# Health check using wget (available in Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${BACKEND_PORT}/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
