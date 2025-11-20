import {Product, Recommendation, RecommendationRequest} from '../types';
import {getProducts} from './database';

export async function getRecommendations(
  request: RecommendationRequest
): Promise<Recommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const allProducts = await getProducts({limit: 1000});

  // Filter products based on preferences and budget
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

  // Build context for OpenAI
  const roomContext = request.roomDescription
    ? `Room dimensions: ${request.roomDescription.length}ft x ${request.roomDescription.width}ft. ` +
      `Wall colors: ${request.roomDescription.wallColors.join(', ')}. ` +
      `Lighting: ${request.roomDescription.lighting}. ` +
      `Style preference: ${request.roomDescription.stylePreference?.join(', ') || 'none'}.`
    : 'No room description provided.';

  const productsList = filteredProducts.slice(0, 50).map(p => 
    `- ${p.name} (${p.category}): $${p.price}, ${p.dimensions.length}${p.dimensions.unit} x ${p.dimensions.width}${p.dimensions.unit}, styles: ${p.styleTags.join(', ')}`
  ).join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interior designer. Analyze the room context and available products, then recommend the best products. Return your response as a JSON array of recommendations, each with: productName (exact name from the list), rank (1-16), reasoning (why this product fits), matchScore (0-1), and suggestedCombinations (array of 2 product names that work well together).'
          },
          {
            role: 'user',
            content: `Room Context:\n${roomContext}\n\nUser Preferences:\n- Style tags: ${styleTags.join(', ') || 'none'}\n- Budget: ${budget ? `$${budget.min} - $${budget.max}` : 'no budget limit'}\n\nAvailable Products:\n${productsList}\n\nSelect 8-16 products that best match the room and preferences. Return ONLY a JSON array of objects with this exact structure: [{"productName": "exact product name", "rank": 1, "reasoning": "why it fits", "matchScore": 0.9, "suggestedCombinations": ["product1", "product2"]}]. No markdown, no code blocks, just the JSON array.`
          }
        ],
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const aiRecommendations = JSON.parse(jsonContent);
    const recommendationsArray = Array.isArray(aiRecommendations) 
      ? aiRecommendations 
      : (aiRecommendations.recommendations || []);

    // Map AI recommendations to our product objects
    const recommendations: Recommendation[] = [];
    
    for (const rec of recommendationsArray.slice(0, 16)) {
      const product = filteredProducts.find(p => 
        p.name.toLowerCase() === rec.productName?.toLowerCase()
      );
      
      if (product) {
        const comboProducts = rec.suggestedCombinations?.map((comboName: string) => {
          const combo = allProducts.find(p => 
            p.name.toLowerCase() === comboName.toLowerCase()
          );
          return combo?.name || comboName;
        }).filter(Boolean) || [];

        recommendations.push({
          product,
          rank: rec.rank || recommendations.length + 1,
          reasoning: rec.reasoning || 'Recommended based on room analysis',
          matchScore: rec.matchScore || 0.8,
          suggestedCombinations: comboProducts
        });
      }
    }

    // If we don't have enough recommendations, fill with filtered products
    if (recommendations.length < 8) {
      const remaining = filteredProducts
        .filter(p => !recommendations.some(r => r.product.id === p.id))
        .slice(0, 16 - recommendations.length);
      
      remaining.forEach((product, index) => {
        recommendations.push({
          product,
          rank: recommendations.length + 1,
          reasoning: `This ${product.category} matches your style preferences.`,
          matchScore: 0.7,
          suggestedCombinations: []
        });
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 16);
  } catch (error: any) {
    // Fallback to simple filtering if OpenAI fails
    console.warn('OpenAI recommendation failed, using filtered products:', error.message);
    
    const fallbackProducts = filteredProducts.slice(0, 16);
    return fallbackProducts.map((product, index) => ({
      product,
      rank: index + 1,
      reasoning: `This ${product.category} matches your preferences.`,
      matchScore: 0.7,
      suggestedCombinations: []
    }));
  }
}
