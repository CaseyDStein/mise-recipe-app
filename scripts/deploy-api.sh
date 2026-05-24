#!/usr/bin/env bash
set -euo pipefail

# Deploy the backend API to Railway
# Prerequisites: Railway CLI installed and logged in (railway login)
# Usage: ./scripts/deploy-api.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🏗  Building API..."
cd "$PROJECT_ROOT/api"
npm ci
npm run build

echo "🚀 Deploying to Railway..."
railway up --service api

echo "✅ API deployed. Run 'railway status' to check the deployment."
