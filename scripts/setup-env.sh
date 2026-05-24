#!/usr/bin/env bash
set -euo pipefail

# First-time environment setup script
# Installs all dependencies and sets up .env files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setting up Recipe App environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not found"; exit 1; }

echo "📦 Installing API dependencies..."
cd "$PROJECT_ROOT/api" && npm install

echo "📦 Installing mobile app dependencies..."
cd "$PROJECT_ROOT/apps/mobile" && npm install

# Copy env files if they don't exist
if [[ ! -f "$PROJECT_ROOT/api/.env" ]]; then
  cp "$PROJECT_ROOT/api/.env.example" "$PROJECT_ROOT/api/.env"
  echo "📝 Created api/.env — fill in your Supabase and Anthropic credentials"
fi

if [[ ! -f "$PROJECT_ROOT/apps/mobile/.env" ]]; then
  cp "$PROJECT_ROOT/apps/mobile/.env.example" "$PROJECT_ROOT/apps/mobile/.env"
  echo "📝 Created apps/mobile/.env — fill in your Supabase credentials and API URL"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo "   1. Fill in api/.env with your Supabase URL, service role key, and Anthropic API key"
echo "   2. Fill in apps/mobile/.env with your Supabase URL and anon key"
echo "   3. Run: ./scripts/deploy-db.sh --local    (start local Supabase)"
echo "   4. Run: cd api && npm run dev              (start API)"
echo "   5. Run: cd apps/mobile && npx expo start  (start mobile app)"
