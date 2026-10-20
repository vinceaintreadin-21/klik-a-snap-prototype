FROM python:3.12-slim

# ── System dependencies ────────────────────────────────────────────────────────
# libpq-dev     → psycopg2 (PostgreSQL, used on Render)
# libgl1 / libglib2.0-0 → OpenCV (face detection pipeline)
# libusb-1.0-0  → MediaPipe
# gcc / g++     → compiling any C extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    g++ \
    pkg-config \
    libgl1 \
    libglib2.0-0 \
    libusb-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies (cached layer) ────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ───────────────────────────────────────────────────────────
COPY . .

# ── Static files (collected at build time) ─────────────────────────────────────
# Render needs STATIC_ROOT populated before the dyno starts.
# We supply a dummy SECRET_KEY and a SQLite stub so collectstatic
# doesn't fail while env vars aren't available yet.
RUN DATABASE_URL="sqlite:////tmp/build.db" \
    SECRET_KEY="placeholder-for-build-only" \
    python manage.py collectstatic --noinput

# ── Runtime port ───────────────────────────────────────────────────────────────
# Render injects $PORT at runtime (usually 10000). We expose 8000 as default
# for local docker runs; the CMD below reads $PORT with a fallback.
EXPOSE 8000

# ── Startup ────────────────────────────────────────────────────────────────────
# 1. migrate   — applies any pending migrations (idempotent)
# 2. seed      — creates demo data if it doesn't already exist (idempotent via get_or_create)
# 3. daphne    — ASGI server (HTTP + WebSocket) on $PORT (Render) or 8000 (local)
CMD ["sh", "-c", \
     "python manage.py migrate && \
      python manage.py seed_admin_demo && \
      daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application"]
