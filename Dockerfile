# CrowdSync Backend Dockerfile (Context: Repository Root)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including libpq for PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code, migrations, alembic configuration, and scripts
COPY backend/app ./app
COPY backend/migrations ./migrations
COPY backend/alembic.ini ./alembic.ini
COPY backend/scripts ./scripts

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 and the PORT environment variable provided by Render.
# Migrations and seeding should run in the Render Pre-Deploy Command (or release phase).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
