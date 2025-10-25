#!/usr/bin/env bash
# Usage: ./scripts/seed_dasc.sh <TOKEN> <REGION> <PDF_PATH>
set -euo pipefail
TOKEN="${1:-}"
REGION="${2:-Najdi}"
PDF="${3:-}"
if [ -z "$TOKEN" ] || [ -z "$PDF" ]; then
  echo "Usage: $0 <TOKEN> <REGION> <PDF_PATH>"
  exit 1
fi
curl -s -X POST "http://localhost:8080/v1/dasc/extract?region=${REGION}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@${PDF}" | jq .
echo "Seeded DASC for ${REGION} from ${PDF}"
