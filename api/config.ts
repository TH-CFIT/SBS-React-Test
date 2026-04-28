import { get } from '@vercel/edge-config';
import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://thcfit.vercel.app',
  'https://thcfit-admin.vercel.app',
  'https://sbs-react.vercel.app',
  'https://sbs-react-admin.vercel.app',
  'https://sbs-react-e2e.vercel.app'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const productionMode = await get('production_mode');

    return res.status(200).json({
      production_mode: productionMode !== false
    });
  } catch (error) {
    console.error('Edge Config Error:', error);
    return res.status(200).json({ production_mode: true });
  }
}
