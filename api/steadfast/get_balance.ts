export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Api-Key, Secret-Key, api-key, secret-key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 405, message: 'Method not allowed' });
  }

  const rawApiKey = (req.headers['api-key'] || req.headers['Api-Key']) as string;
  const rawSecretKey = (req.headers['secret-key'] || req.headers['Secret-Key']) as string;
  const apiKey = rawApiKey ? String(rawApiKey).trim() : '';
  const secretKey = rawSecretKey ? String(rawSecretKey).trim() : '';

  if (!apiKey || !secretKey) {
    return res.status(400).json({ status: 400, message: 'API Key and Secret Key are required' });
  }

  const targetUrl = 'https://portal.packzy.com/api/v1/get_balance';

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
    });

    const data = await upstreamRes.json().catch(() => null);
    return res.status(upstreamRes.status).json(
      data || {
        status: upstreamRes.status,
        message: upstreamRes.statusText,
      }
    );
  } catch (error: any) {
    return res.status(500).json({
      status: 500,
      message: error?.message || 'Failed to fetch Steadfast balance',
    });
  }
}
