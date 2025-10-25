#!/usr/bin/env bash
set -euo pipefail
DIR="${1:-mosquitto/certs}"
mkdir -p "$DIR"
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout "$DIR/ca.key" -out "$DIR/ca.crt" -subj "/CN=SIMA-CA"
openssl req -new -nodes -newkey rsa:2048 -keyout "$DIR/server.key" -out "$DIR/server.csr" -subj "/CN=localhost"
openssl x509 -req -in "$DIR/server.csr" -CA "$DIR/ca.crt" -CAkey "$DIR/ca.key" -CAcreateserial -out "$DIR/server.crt" -days 3650
echo ">> Certs created under $DIR"
