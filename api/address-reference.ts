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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const username = process.env.DHL_USERNAME;
    const password = process.env.DHL_PASSWORD;
    const dhlApiEndpoint = process.env.DHL_API_ENDPOINT_ADDRESS_REFER;

    if (!username || !password || !dhlApiEndpoint) {
        console.error('DHL API environment variables for reference data are not configured correctly.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const { datasetName } = req.query;
    if (datasetName !== 'country') {
        return res.status(400).json({ error: 'Required parameter "datasetName" must be set to "country".' });
    }

    try {
        const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
        const dhlApiUrl = `${dhlApiEndpoint}?datasetName=${datasetName}`;

        const apiResponse = await fetch(dhlApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': auth
            }
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('DHL Reference Data API Error:', responseData);
            return res.status(apiResponse.status).json({ error: 'DHL API Error', details: responseData });
        }

        res.status(200).json(responseData);
    } catch (error: any) {
        console.error('Internal Server Error while fetching reference data:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
