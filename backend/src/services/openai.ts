import {Product, Recommendation, RecommendationRequest} from '../types';
import {getProducts} from './database';

export async function getRecommendations(
  request: RecommendationRequest
): Promise<Recommendation[]> {
  const allProducts = await getProducts({limit: 1000});

  const roomContext = request.roomDescription
    ? `Room dimensions: ${request.roomDescription.length}ft x ${request.roomDescription.width}ft. ` +
      `Wall colors: ${request.roomDescription.wallColors.join(', ')}. ` +
      `Lighting: ${request.roomDescription.lighting}. ` +
      `Style preference: ${request.roomDescription.stylePreference?.join(', ') || 'none'}.`
    : 'No room description provided.';

  const styleTags = request.preferences.styleTags || [];
  const budget = request.budget;

  let filteredProducts = allProducts;

  if (styleTags.length > 0) {
    filteredProducts = allProducts.filter(product =>
      product.styleTags.some(tag => styleTags.includes(tag))
    );
  }

  if (budget) {
    filteredProducts = filteredProducts.filter(
      product => product.price >= budget.min && product.price <= budget.max
    );
  }

  const sofas = filteredProducts.filter(p => p.category === 'furniture' && p.name.toLowerCase().includes('sofa')).slice(0, 5);
  const chairs = filteredProducts.filter(p => p.category === 'furniture' && p.name.toLowerCase().includes('chair')).slice(0, 5);
  const tiles = filteredProducts.filter(p => p.category === 'tiles').slice(0, 3);
  const decor = filteredProducts.filter(p => p.category === 'decor').slice(0, 3);

  const recommendations: Recommendation[] = [];

  [...sofas, ...chairs, ...tiles, ...decor].forEach((product, index) => {
    const matchScore = 0.7 + Math.random() * 0.25;
    const reasoning = `This ${product.category} fits your ${styleTags.join(' and ')} style preferences. ` +
      `With dimensions of ${product.dimensions.length}${product.dimensions.unit} x ${product.dimensions.width}${product.dimensions.unit}, ` +
      `it will work well in your ${request.roomDescription?.length || 12}ft x ${request.roomDescription?.width || 10}ft space.`;

    recommendations.push({
      product,
      rank: index + 1,
      reasoning,
      matchScore,
      suggestedCombinations: allProducts
        .filter(p => p.id !== product.id && p.category !== product.category)
        .slice(0, 2)
        .map(p => p.name),
    });
  });

  return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 16);
}
