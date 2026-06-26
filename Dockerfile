# --- Build Frontend Stage ---
FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime Stage ---
FROM python:3.11-slim

# Install system dependencies & Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy built frontend assets and backend server files
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server ./server
COPY --from=frontend-builder /app/shared ./shared
COPY --from=frontend-builder /app/package.json /app/package-lock.json ./

# Install production node dependencies
RUN npm ci --only=production

# Set production env
ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHON_PORT=8001

EXPOSE 5000

# Start script
COPY start-production.sh ./
RUN chmod +x start-production.sh

CMD ["./start-production.sh"]
