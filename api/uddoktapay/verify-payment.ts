export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, RT-UDDOKTAPAY-API-KEY, rt-uddoktapay-api-key, x-api-url, Api-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  const apiKey =
    req.headers['rt-uddoktapay-api-key'] ||
    req.headers['RT-UDDOKTAPAY-API-KEY'] ||
    req.headers['api-key'];

  let baseUrl =
    (req.headers['x-api-url'] as string) ||
    process.env.VITE_UDDOKTAPAY_API_URL ||
    'https://sandbox.uddoktapay.com';

  baseUrl = baseUrl.trim();
  baseUrl = baseUrl.replace(/\/api\/checkout-v2\/?$/i, '');
  baseUrl = baseUrl.replace(/\/checkout-v2\/?$/i, '');
  baseUrl = baseUrl.replace(/\/api\/verify-payment\/?$/i, '');
  baseUrl = baseUrl.replace(/\/verify-payment\/?$/i, '');
  baseUrl = baseUrl.replace(/\/api\/?$/i, '');
  baseUrl = baseUrl.replace(/\/+$/, '');
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl;
  }

  const targetUrl = `${baseUrl}/api/verify-payment`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': String(apiKey || '').trim(),
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
    });

    const data = await upstreamRes.json().catch(() => null);
    return res.status(upstreamRes.status).json(
      data || {
        status: upstreamRes.ok,
        message: upstreamRes.statusText,
      }
    );
  } catch (error: any) {
    return res.status(500).json({
      status: false,
      message: error?.message || 'Failed to communicate with UddoktaPay gateway',
    });
  }
}
