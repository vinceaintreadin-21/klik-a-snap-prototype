FROM python:3.12-slim

# ── Environment ────────────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ── System dependencies ────────────────────────────────────────────────────────
# libpq-dev                    → psycopg2 (PostgreSQL, used on Render)
# default-libmysqlclient-dev   → mysqlclient (MySQL/MariaDB headers + pkg-config)
# libgl1 / libglib2.0-0        → OpenCV runtime libs
# libusb-1.0-0                 → MediaPipe
# build-essential / pkg-config → compiling C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libpq-dev \
    default-libmysqlclient-dev \
    libgl1 \
    libglib2.0-0 \
    libusb-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies (cached layer) ────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ── Application code ───────────────────────────────────────────────────────────
COPY . .

# ── Static files (collected at build time) ─────────────────────────────────────
RUN DATABASE_URL="sqlite:////tmp/build.db" \
    SECRET_KEY="placeholder-for-build-only" \
    python manage.py collectstatic --noinput

# ── Runtime port ───────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Startup ────────────────────────────────────────────────────────────────────
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_admin_demo && daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application"]