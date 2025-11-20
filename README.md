# Visioneer App

A mobile application for interior design with AI-powered recommendations, 3D visualization, and AR capabilities.

## Architecture

- **Mobile App**: React Native with Unity integration
- **Backend**: Express.js server (TypeScript)
- **Database**: MongoDB (local instance)
- **Storage**: Local file system
- **AI Services**: Mock recommendations and vision analysis (no cloud required!)

## Project Structure

```
visioneerapp/
├── mobile/              # React Native mobile app
├── backend/             # Azure Functions backend
└── shared/              # Shared types and utilities
```

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

**TL;DR:**
1. Start backend: `cd backend && npm install && npm run build && npm start`
2. Start mobile: `cd mobile && npm install && npm run ios` (or `android`)

**No Azure credentials needed!** Everything runs locally for free.

## Configuration

### Backend

No configuration needed! The server runs on `http://localhost:3000` by default.

### Mobile

The mobile app is configured to connect to `http://localhost:3000/api` in development mode.

For Android emulator, update `mobile/src/services/api.ts` to use `http://10.0.2.2:3000/api`.

## Features

- Product catalog browsing
- AI-powered recommendations
- Room photo analysis
- 3D model visualization
- AR furniture placement
- Tile calculator
- Furniture layout tools

## Deployment

### Azure Functions

```bash
cd backend
func azure functionapp publish <function-app-name>
```

### Mobile App

- iOS: Build via Xcode
- Android: Build via Android Studio or `cd android && ./gradlew assembleRelease`

