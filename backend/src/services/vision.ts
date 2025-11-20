import {RoomAnalysis} from '../types';

export async function analyzeRoom(photoUrl: string): Promise<RoomAnalysis> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockColors = ['#F5F5DC', '#D2B48C', '#DEB887', '#F4A460', '#CD853F'];
  const mockFurniture = ['sofa', 'coffee table', 'lamp'];
  const roomShapes = ['rectangular', 'square', 'L-shaped'];
  const lightingTypes: ('natural' | 'artificial' | 'mixed')[] = ['natural', 'artificial', 'mixed'];

  return {
    colors: mockColors.slice(0, 5),
    roomShape: roomShapes[Math.floor(Math.random() * roomShapes.length)],
    walls: [
      {
        color: mockColors[0],
        dimensions: {length: 0, width: 0, height: 0, unit: 'ft' as const},
      },
    ],
    floor: {
      type: 'hardwood',
      color: mockColors[1],
    },
    furnitureDetected: mockFurniture.slice(0, Math.floor(Math.random() * 3) + 1),
    lighting: lightingTypes[Math.floor(Math.random() * lightingTypes.length)],
    emptySpaces: [],
  };
}
