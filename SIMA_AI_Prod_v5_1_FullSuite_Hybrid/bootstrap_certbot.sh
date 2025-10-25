#!/usr/bin/env bash
set -euo pipefail
DOMAIN="${1:-}"
EMAIL="${2:-}"
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  exit 1
fi
export DOMAIN
echo "[+] Bringing up nginx (port 80) for ACME challenge..."
docker compose -f infra/docker-compose.prod.yml up -d nginx
echo "[+] Requesting Let's Encrypt certificate for $DOMAIN ..."
docker compose -f infra/docker-compose.prod.yml run --rm certbot certonly --webroot       --webroot-path /var/www/certbot -d "$DOMAIN" -m "$EMAIL" --agree-tos --no-eff-email
echo "[+] Certificate obtained. Restarting nginx with TLS..."
docker compose -f infra/docker-compose.prod.yml restart nginx
echo "[✓] Done. Certificates at /etc/letsencrypt/live/$DOMAIN"
