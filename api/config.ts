import { get } from '@vercel/edge-config';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const productionMode = await get('production_mode');
    
    // Return the value. Default to true if not set or error.
    return res.status(200).json({ 
      production_mode: productionMode !== false 
    });
  } catch (error) {
    console.error('Edge Config Error:', error);
    return res.status(200).json({ production_mode: true });
  }
}
