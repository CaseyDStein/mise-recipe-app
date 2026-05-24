#!/usr/bin/env bash
set -euo pipefail

# Deploy/update Supabase database schema
# Usage: ./scripts/deploy-db.sh [--local]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

LOCAL_FLAG="${1:-}"

cd "$PROJECT_ROOT/supabase"

if [[ "$LOCAL_FLAG" == "--local" ]]; then
  echo "🔄 Starting local Supabase instance..."
  supabase start
  echo "✅ Local Supabase running. Dashboard: http://localhost:54323"
else
  echo "🔄 Pushing migrations to remote Supabase..."
  supabase db push
  echo "✅ Database migrations applied."
fi
