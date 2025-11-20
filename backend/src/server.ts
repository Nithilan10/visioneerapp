import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import {initSampleData, getMongoClient} from './services/database';
import {getProducts, getProductById} from './services/database';
import {getRecommendations} from './services/openai';
import {analyzeRoom} from './services/vision';
import {uploadFile, getFilePath} from './services/storage';
import {getGLBFile, getGLBFileUrl, listGLBFiles, uploadGLBFile} from './services/blobStorage';
import {ApiResponse, Product, Recommendation, RoomAnalysis, TileCalculation} from './types';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

const upload = multer({storage: multer.memoryStorage()});

initSampleData();

app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const styleTags = req.query.styleTags ? (req.query.styleTags as string).split(',') : undefined;

    const products = await getProducts({category: category as any, styleTags, search, limit, offset});

    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch products',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Product not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch product',
    };
    res.status(500).json(response);
  }
});

app.post('/api/recommend', async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.body);

    const response: ApiResponse<Recommendation[]> = {
      success: true,
      data: recommendations,
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get recommendations',
    };
    res.status(500).json(response);
  }
});

app.post('/api/room/analyze', async (req, res) => {
  try {
    const {photoUrl} = req.body;
    if (!photoUrl) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Photo URL is required',
      };
      return res.status(400).json(response);
    }

    const analysis = await analyzeRoom(photoUrl);

    const response: ApiResponse<RoomAnalysis> = {
      success: true,
      data: analysis,
    };

    res.json(response);
  } catch (error) {
    console.error('Error analyzing room:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to analyze room',
    };
    res.status(500).json(response);
  }
});

app.post('/api/room/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Photo file is required',
      };
      return res.status(400).json(response);
    }

    const url = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const fullUrl = `http://localhost:${port}${url}`;

    const response: ApiResponse<{url: string}> = {
      success: true,
      data: {url: fullUrl},
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading room photo:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to upload room photo',
    };
    res.status(500).json(response);
  }
});

app.get('/api/models/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Product not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<{url: string}> = {
      success: true,
      data: {url: product.model3DUrl || ''},
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching model URL:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch model URL',
    };
    res.status(500).json(response);
  }
});

app.post('/api/tools/tile-calculator', async (req, res) => {
  try {
    const {roomLength, roomWidth, tileLength, tileWidth, unit} = req.body;

    if (!roomLength || !roomWidth || !tileLength || !tileWidth) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'All dimensions are required',
      };
      return res.status(400).json(response);
    }

    function convertToFeet(value: number, unit: 'cm' | 'in' | 'ft'): number {
      switch (unit) {
        case 'cm':
          return value / 30.48;
        case 'in':
          return value / 12;
        case 'ft':
          return value;
      }
    }

    const roomLengthFt = convertToFeet(roomLength, unit);
    const roomWidthFt = convertToFeet(roomWidth, unit);
    const tileLengthFt = convertToFeet(tileLength, unit);
    const tileWidthFt = convertToFeet(tileWidth, unit);

    const roomArea = roomLengthFt * roomWidthFt;
    const tileArea = tileLengthFt * tileWidthFt;
    const tilesNeeded = Math.ceil(roomArea / tileArea);
    const wastagePercent = 10;
    const wastageCount = Math.ceil(tilesNeeded * (wastagePercent / 100));
    const totalTiles = tilesNeeded + wastageCount;

    const calculation: TileCalculation = {
      roomLength: roomLengthFt,
      roomWidth: roomWidthFt,
      tileSize: {
        length: tileLengthFt,
        width: tileWidthFt,
        unit: 'ft',
      },
      tilesNeeded,
      wastagePercent,
      wastageCount,
      totalTiles,
      priceEstimate: 0,
    };

    const response: ApiResponse<TileCalculation> = {
      success: true,
      data: calculation,
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating tiles:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to calculate tiles',
    };
    res.status(500).json(response);
  }
});

app.get('/api/models/glb/:container/:filename', async (req, res) => {
  try {
    const {container, filename} = req.params;

    if (!filename.endsWith('.glb')) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'File must be a .glb file',
      };
      return res.status(400).json(response);
    }

    const fileBuffer = await getGLBFile(container, filename);

    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Error retrieving GLB file:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to retrieve GLB file',
    };
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

app.get('/api/models/glb/:container/:filename/url', async (req, res) => {
  try {
    const {container, filename} = req.params;

    if (!filename.endsWith('.glb')) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'File must be a .glb file',
      };
      return res.status(400).json(response);
    }

    const url = await getGLBFileUrl(container, filename);

    const response: ApiResponse<{url: string}> = {
      success: true,
      data: {url},
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error getting GLB file URL:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to get GLB file URL',
    };
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

app.post('/api/models/glb/:container/:filename', upload.single('file'), async (req, res) => {
  try {
    const {container, filename} = req.params;

    if (!filename.endsWith('.glb')) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'File must be a .glb file',
      };
      return res.status(400).json(response);
    }

    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'GLB file is required',
      };
      return res.status(400).json(response);
    }

    const url = await uploadGLBFile(container, filename, req.file.buffer);

    const response: ApiResponse<{url: string}> = {
      success: true,
      data: {url},
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error uploading GLB file:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to upload GLB file',
    };
    res.status(500).json(response);
  }
});

app.get('/api/models/glb/:container', async (req, res) => {
  try {
    const {container} = req.params;
    const prefix = req.query.prefix as string | undefined;

    const files = await listGLBFiles(container, prefix);

    const response: ApiResponse<string[]> = {
      success: true,
      data: files,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error listing GLB files:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to list GLB files',
    };
    res.status(500).json(response);
  }
});

app.listen(port, async () => {
  try {
    await getMongoClient();
    await initSampleData();
    console.log(`Server running on http://localhost:${port}`);
    console.log(`API available at http://localhost:${port}/api`);
    console.log(`Connected to MongoDB at ${process.env.MONGODB_URL || 'mongodb://localhost:27017'}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.error('Make sure MongoDB is running: brew services start mongodb-community (Mac) or mongod (Linux)');
    process.exit(1);
  }
});

