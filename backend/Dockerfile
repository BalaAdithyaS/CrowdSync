# CrowdSync Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and migrations
COPY backend /app/backend
COPY scripts /app/scripts
COPY alembic.ini /app/alembic.ini

# Set environment
ENV PYTHONPATH=/app/backend:/app
ENV PORT=8000

EXPOSE 8000

# Run database migrations and start server (seed demo if database is empty)
CMD ["sh", "-c", "alembic upgrade head && python scripts/seed_demo.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
