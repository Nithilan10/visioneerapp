import {Product, ProductCategory} from '../types';
import {getProducts} from './database';

export interface SearchFilters {
  query?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  styleTags?: string[];
  minDimensions?: {length?: number; width?: number; height?: number};
  maxDimensions?: {length?: number; width?: number; height?: number};
  sortBy?: 'price' | 'name' | 'relevance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  filters: SearchFilters;
}

export async function searchProducts(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  let products = await getProducts({limit: 1000});
  
  if (filters.query) {
    const queryLower = filters.query.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(queryLower) ||
      p.description?.toLowerCase().includes(queryLower) ||
      p.category.toLowerCase().includes(queryLower) ||
      p.styleTags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }
  
  if (filters.category) {
    products = products.filter(p => p.category === filters.category);
  }
  
  if (filters.minPrice !== undefined) {
    products = products.filter(p => p.price >= filters.minPrice!);
  }
  
  if (filters.maxPrice !== undefined) {
    products = products.filter(p => p.price <= filters.maxPrice!);
  }
  
  if (filters.styleTags && filters.styleTags.length > 0) {
    products = products.filter(p =>
      filters.styleTags!.some(tag => p.styleTags.includes(tag))
    );
  }
  
  if (filters.minDimensions) {
    products = products.filter(p => {
      const dim = filters.minDimensions!;
      return (!dim.length || p.dimensions.length >= dim.length) &&
             (!dim.width || p.dimensions.width >= dim.width) &&
             (!dim.height || p.dimensions.height >= dim.height);
    });
  }
  
  if (filters.maxDimensions) {
    products = products.filter(p => {
      const dim = filters.maxDimensions!;
      return (!dim.length || p.dimensions.length <= dim.length) &&
             (!dim.width || p.dimensions.width <= dim.width) &&
             (!dim.height || p.dimensions.height <= dim.height);
    });
  }
  
  if (filters.sortBy) {
    products.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'relevance':
          comparison = 0;
          break;
        case 'popularity':
          comparison = 0;
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  const total = products.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  return {
    products: paginatedProducts,
    total,
    page,
    pageSize,
    filters
  };
}

export function calculateRelevanceScore(product: Product, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  if (product.name.toLowerCase().includes(queryLower)) {
    score += 10;
  }
  
  if (product.description?.toLowerCase().includes(queryLower)) {
    score += 5;
  }
  
  if (product.category.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  product.styleTags.forEach(tag => {
    if (tag.toLowerCase().includes(queryLower)) {
      score += 2;
    }
  });
  
  return score;
}

export async function getSimilarProducts(productId: string, limit: number = 5): Promise<Product[]> {
  const allProducts = await getProducts({limit: 1000});
  const product = allProducts.find(p => p.id === productId);
  
  if (!product) {
    return [];
  }
  
  const similar = allProducts
    .filter(p => p.id !== productId)
    .map(p => ({
      product: p,
      similarity: calculateSimilarity(product, p)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.product);
  
  return similar;
}

function calculateSimilarity(product1: Product, product2: Product): number {
  let score = 0;
  
  if (product1.category === product2.category) {
    score += 5;
  }
  
  const commonTags = product1.styleTags.filter(tag => 
    product2.styleTags.includes(tag)
  );
  score += commonTags.length * 2;
  
  const priceDiff = Math.abs(product1.price - product2.price);
  const maxPrice = Math.max(product1.price, product2.price);
  if (maxPrice > 0) {
    score += (1 - priceDiff / maxPrice) * 3;
  }
  
  return score;
}

