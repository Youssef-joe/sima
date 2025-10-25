#!/usr/bin/env bash
set -e
mkdir -p mosquitto/certs mosquitto/config
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout mosquitto/certs/server.key -out mosquitto/certs/server.crt -subj "/CN=localhost"
cp mosquitto/certs/server.crt mosquitto/certs/ca.crt
touch mosquitto/config/passwd mosquitto/config/acl
echo "TLS files generated. Switch docker-compose to mosquitto_tls service and set MQTT_HOST=mosquitto_tls MQTT_PORT=8883."
