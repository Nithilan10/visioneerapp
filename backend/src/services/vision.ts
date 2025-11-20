import {RoomAnalysis} from '../types';

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

export async function analyzeRoom(photoUrl: string): Promise<RoomAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    let imageUrl = photoUrl;
    
    // If photoUrl is not a data URL, fetch it and convert to base64
    if (!photoUrl.startsWith('data:')) {
      imageUrl = await fetchImageAsBase64(photoUrl);
    }

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this room image in detail. Extract the following information and return it as a JSON object:
- colors: array of hex color codes found in the room (walls, floor, furniture)
- roomShape: shape of the room (rectangular, square, L-shaped, etc.)
- walls: array of wall objects with color (hex), material (if visible), and dimensions (length, width, height in feet, unit: "ft")
- floor: object with type (hardwood, tile, carpet, etc.), color (hex), and material (if visible)
- furnitureDetected: array of furniture items detected (e.g., ["sofa", "coffee table", "lamp"])
- lighting: type of lighting ("natural", "artificial", or "mixed")
- emptySpaces: array of empty space objects with area (in square feet) and location description

Return ONLY valid JSON, no markdown formatting, no code blocks.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI Vision API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response (remove markdown code blocks if present)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const analysis: RoomAnalysis = JSON.parse(jsonContent);
    
    // Ensure required fields have defaults
    return {
      colors: analysis.colors || [],
      roomShape: analysis.roomShape || 'rectangular',
      walls: analysis.walls || [{
        color: '#FFFFFF',
        dimensions: {length: 0, width: 0, height: 0, unit: 'ft' as const}
      }],
      floor: analysis.floor || {type: 'unknown'},
      furnitureDetected: analysis.furnitureDetected || [],
      lighting: analysis.lighting || 'mixed',
      emptySpaces: analysis.emptySpaces || []
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze room: ${error.message}`);
  }
}
