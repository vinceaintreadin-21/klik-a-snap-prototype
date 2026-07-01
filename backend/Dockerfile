FROM python:3.12-slim

# System dependencies for mysqlclient, OpenCV, and mediapipe
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    g++ \
    pkg-config \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Run with Daphne (ASGI) to support both HTTP and WebSocket
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]