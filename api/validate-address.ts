import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

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

    const DHL_API_KEY = process.env.DHL_VALIDATE_ADDRESS_API_KEY;
    const DHL_API_ENDPOINT = 'https://wsbexpress.dhl.com/postalLocation/v1';

    if (!DHL_API_KEY) {
        console.error('DHL_VALIDATE_ADDRESS_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error: API Key is missing.' });
    }

    const { countryCode, postalCode, city, countyName } = req.query;

    if (!countryCode) {
        return res.status(400).json({ error: 'countryCode is a required parameter.' });
    }

    if (!postalCode && !city && !countyName) {
        return res.status(400).json({ error: 'At least one of postalCode, city, or countyName is required.' });
    }

    try {
        const params = new URLSearchParams({
            key: DHL_API_KEY as string,
            countryCode: countryCode as string,
        });

        if (postalCode) params.append('postalCode', postalCode as string);
        if (city) params.append('city', city as string);
        if (countyName) params.append('countyName', countyName as string);

        const dhlApiUrl = `${DHL_API_ENDPOINT}?${params.toString()}`;

        const apiResponse = await fetch(dhlApiUrl);
        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('DHL Validate Address API Error:', responseData);
            return res.status(apiResponse.status).json({ error: 'DHL API Error', details: responseData });
        }

        res.status(200).json(responseData);

    } catch (error: any) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
