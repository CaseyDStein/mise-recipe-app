#!/usr/bin/env bash
set -euo pipefail

# Build and submit the mobile app via Expo Application Services (EAS)
# Prerequisites: eas-cli installed (npm install -g eas-cli) and logged in (eas login)
# Usage: ./scripts/deploy-mobile.sh [ios|android|all] [preview|production]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

PLATFORM="${1:-all}"       # ios | android | all
PROFILE="${2:-preview}"    # preview | production

cd "$PROJECT_ROOT/apps/mobile"

echo "📱 Building for platform: $PLATFORM, profile: $PROFILE"
eas build --platform "$PLATFORM" --profile "$PROFILE"

if [[ "$PROFILE" == "production" ]]; then
  echo "🚀 Submitting to app stores..."
  eas submit --platform "$PLATFORM" --latest
fi

echo "✅ Mobile build complete."
