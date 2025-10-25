#!/usr/bin/env bash
set -euo pipefail
USER="${1:-sima_device}"
PASS="${2:-changeme}"
PWDF="mosquitto/config/passwords"
mkdir -p "$(dirname "$PWDF")"
if [ ! -f "$PWDF" ]; then
  mosquitto_passwd -c -b "$PWDF" "$USER" "$PASS"
else
  mosquitto_passwd -b "$PWDF" "$USER" "$PASS"
fi
echo "User $USER updated in $PWDF"
