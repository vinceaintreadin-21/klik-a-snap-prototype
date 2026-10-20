FROM python:3.12-slim

# ── Environment ────────────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ── System dependencies ────────────────────────────────────────────────────────
# libpq-dev      → psycopg2 (PostgreSQL, used on Render)
# libgl1 / libglib2.0-0 → OpenCV runtime libs
# libusb-1.0-0   → MediaPipe
# gcc / g++ / pkg-config / build-essential → compiling any C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
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
# Upgrade build tooling first: Python 3.12 no longer ships setuptools/distutils
# by default, which is a common cause of "Getting requirements to build wheel"
# failures.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ── Application code ───────────────────────────────────────────────────────────
COPY . .

# ── Static files (collected at build time) ─────────────────────────────────────
# Render needs STATIC_ROOT populated before the service starts.
# A dummy SECRET_KEY and SQLite stub let collectstatic run without real env vars.
RUN DATABASE_URL="sqlite:////tmp/build.db" \
    SECRET_KEY="placeholder-for-build-only" \
    python manage.py collectstatic --noinput

# ── Runtime port ───────────────────────────────────────────────────────────────
# Render injects $PORT at runtime. 8000 is the fallback for local docker runs.
EXPOSE 8000

# ── Startup ────────────────────────────────────────────────────────────────────
# 1. migrate  → applies pending migrations (idempotent)
# 2. seed     → creates demo data if missing (idempotent via get_or_create)
# 3. daphne   → ASGI server (HTTP + WebSocket) on $PORT or 8000
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_admin_demo && daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application"]