export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  styleTags: string[];
  dimensions: Dimensions;
  images: string[];
  model3DUrl: string;
  storeLinks: StoreLink[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 
  | 'furniture'
  | 'tiles'
  | 'appliances'
  | 'decor'
  | 'materials'
  | 'paint';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'ft';
}

export interface StoreLink {
  storeName: string;
  url: string;
  price?: number;
}

export interface Recommendation {
  product: Product;
  rank: number;
  reasoning: string;
  matchScore: number;
  suggestedCombinations?: string[];
}

export interface RecommendationRequest {
  roomPhotoUrl?: string;
  roomDescription?: RoomDescription;
  preferences: UserPreferences;
  budget?: BudgetRange;
}

export interface RoomDescription {
  length: number;
  width: number;
  height?: number;
  wallColors: string[];
  floorType?: string;
  lighting: 'natural' | 'artificial' | 'mixed';
  existingFurniture?: string[];
  stylePreference?: string[];
}

export interface UserPreferences {
  styleTags: string[];
  colorPalette?: string[];
  materialPreferences?: string[];
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

export interface RoomAnalysis {
  colors: string[];
  roomShape: string;
  walls: WallInfo[];
  floor: FloorInfo;
  furnitureDetected: string[];
  lighting: 'natural' | 'artificial' | 'mixed';
  emptySpaces: EmptySpace[];
}

export interface WallInfo {
  color: string;
  material?: string;
  dimensions: Dimensions;
}

export interface FloorInfo {
  type: string;
  color?: string;
  material?: string;
}

export interface EmptySpace {
  area: number;
  location: string;
}

export interface TileCalculation {
  roomLength: number;
  roomWidth: number;
  tileSize: TileSize;
  tilesNeeded: number;
  wastagePercent: number;
  wastageCount: number;
  totalTiles: number;
  priceEstimate: number;
}

export interface TileSize {
  length: number;
  width: number;
  unit: 'cm' | 'in' | 'ft';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

