# Recipe App

A cross-platform mobile app (iOS + Android) that imports recipes from any URL, normalizes them, and stores them in the cloud.

## Architecture

```
recipe-app/
├── apps/mobile/        # React Native + Expo app (TypeScript)
├── api/                # Node.js + Express backend (TypeScript)
├── supabase/           # Database migrations and config
├── packages/shared/    # Shared TypeScript types
└── scripts/            # Deployment scripts
```

## Tech Stack

- **Mobile**: React Native + Expo + Expo Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL + Auth)
- **Recipe Parsing**: Schema.org JSON-LD → Claude AI fallback
- **Tests**: Vitest (API) + Jest + Testing Library (mobile)
- **Deployment**: Railway (API) + Supabase Cloud + EAS (mobile)

## Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- Railway CLI (for API deployment)

## Quick Start

### 1. Install dependencies
```bash
npm install
cd api && npm install
cd ../apps/mobile && npm install
```

### 2. Set up environment variables
```bash
cp api/.env.example api/.env
cp apps/mobile/.env.example apps/mobile/.env
```
Fill in your Supabase URL, anon key, and Anthropic API key.

### 3. Set up the database
```bash
cd supabase
supabase db reset  # applies all migrations
```

### 4. Start the API
```bash
cd api && npm run dev
```

### 5. Start the mobile app
```bash
cd apps/mobile && npx expo start
```
Scan the QR code with the Expo Go app on your phone.

## Deployment

See `scripts/` for deployment automation:
- `scripts/deploy-api.sh` — deploy API to Railway
- `scripts/deploy-db.sh` — apply Supabase migrations
- `scripts/deploy-mobile.sh` — build and submit via EAS
