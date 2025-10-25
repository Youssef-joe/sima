#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-local}"
DOMAIN="${2:-}"
EMAIL="${3:-}"
if [ "$MODE" = "local" ]; then
  echo "[Sima AI] Starting LOCAL stack..."
  docker compose -f infra/docker-compose.local.yml up -d --build
  echo "[Sima AI] Local: http://localhost (web:3000, api:8080, grafana:3001)"
elif [ "$MODE" = "prod" ]; then
  if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 prod <domain> <email>"
    exit 1
  fi
  export DOMAIN
  export DB_PASSWORD=${DB_PASSWORD:-CHANGE_ME_STRONG}
  export KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-admin}
  export KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-admin}
  echo "[Sima AI] Bootstrapping certificates for $DOMAIN ..."
  ./bootstrap_certbot.sh "$DOMAIN" "$EMAIL"
  echo "[Sima AI] Starting PRODUCTION stack..."
  docker compose -f infra/docker-compose.prod.yml up -d --build
  echo "[Sima AI] Production: https://$DOMAIN (Grafana via reverse proxy or port mapping)"
else
  echo "Unknown mode: $MODE"
  exit 1
fi
