#!/usr/bin/env bash

set -euo pipefail

# This script runs before dependencies are installed during EAS Build
# It copies the google-services.json from the environment variable to the project root

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "📦 Copying google-services.json from EAS Secret..."
  echo "$GOOGLE_SERVICES_JSON" > "$EAS_BUILD_WORKINGDIR/google-services.json"
  echo "✅ google-services.json has been created"
else
  echo "⚠️  GOOGLE_SERVICES_JSON environment variable not found"
  exit 1
fi
