# Visioneer Backend (Local)

Local Express server with MongoDB database - no Azure services required!

## Prerequisites

Install MongoDB locally:

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

## Setup

```bash
npm install
npm run build
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Features

- **MongoDB Database**: NoSQL database perfect for product catalogs
- **Local File Storage**: Uploads stored in `data/uploads/`
- **Mock AI Recommendations**: Smart filtering based on user preferences
- **Mock Vision Analysis**: Returns sample room analysis data
- **No Azure Required**: Everything runs locally for free!

## Configuration

Create a `.env` file in the backend directory with the following variables:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=visioneer
PORT=3000

AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account-name;AccountKey=your-account-key;EndpointSuffix=core.windows.net
```

**Note:** For Azure Blob Storage, you can use either:
- `AZURE_STORAGE_ACCOUNT_NAME` + `AZURE_STORAGE_ACCOUNT_KEY`, OR
- `AZURE_STORAGE_CONNECTION_STRING` (which includes both)

## API Endpoints

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/recommend` - Get recommendations
- `POST /api/room/analyze` - Analyze room photo
- `POST /api/room/upload` - Upload room photo
- `GET /api/models/:id` - Get 3D model URL
- `POST /api/tools/tile-calculator` - Calculate tiles
- `POST /api/models/glb/:container/:filename` - Upload GLB file to Azure Blob Storage (multipart/form-data with `file` field)
- `GET /api/models/glb/:container/:filename` - Download GLB file from Azure Blob Storage
- `GET /api/models/glb/:container/:filename/url` - Get direct URL to GLB file in Azure Blob Storage
- `GET /api/models/glb/:container` - List all GLB files in a container (optional `?prefix=` query param)

## Data Storage

- Database: MongoDB (local instance)
- Uploads: `data/uploads/` (images and files)

Sample products are automatically created on first run.

