# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching — only re-runs when package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# VITE_* env vars must be available at build time (they're baked into the bundle).
# Pass them as build args so Render's "Build Environment Variables" work correctly.
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy the Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: serve the SPA, redirect all routes to index.html
# (required for React Router — without this, direct URL access returns 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
