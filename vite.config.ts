import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

function steadfastProxyPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/steadfast/')) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Api-Key, Secret-Key, api-key, secret-key, Authorization',
      });
      res.end();
      return;
    }

    const endpoint = req.url.replace('/api/steadfast/', '').replace(/^\/+/, '');
    // Steadfast's active primary API endpoint is portal.packzy.com
    const candidateHosts = [
      'https://portal.packzy.com/api/v1',
      'https://portal.steadfast.com.bd/api/v1',
    ];

    const rawApiKey = (req.headers['api-key'] || req.headers['Api-Key']) as string;
    const rawSecretKey = (req.headers['secret-key'] || req.headers['Secret-Key']) as string;
    const apiKey = rawApiKey ? String(rawApiKey).trim() : '';
    const secretKey = rawSecretKey ? String(rawSecretKey).trim() : '';

    let body: string | undefined = undefined;
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      body = Buffer.concat(chunks).toString('utf-8');
    }

    let lastError: any = null;
    for (const baseUrl of candidateHosts) {
      try {
        const targetUrl = `${baseUrl}/${endpoint}`;
        const fetchResponse = await fetch(targetUrl, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(apiKey ? { 'Api-Key': apiKey } : {}),
            ...(secretKey ? { 'Secret-Key': secretKey } : {}),
          },
          ...(body ? { body } : {}),
        });

        const data = await fetchResponse.text();
        res.writeHead(fetchResponse.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Api-Key, Secret-Key, api-key, secret-key, Authorization',
        });
        res.end(data);
        return;
      } catch (err: any) {
        lastError = err;
      }
    }

    console.error('Steadfast proxy error:', lastError);
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ status: 500, message: lastError?.message || 'Proxy Error' }));
  };

  return {
    name: 'steadfast-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function uddoktaPayProxyPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/uddoktapay/')) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, RT-UDDOKTAPAY-API-KEY, rt-uddoktapay-api-key, x-api-url, Api-Key, Authorization',
      });
      res.end();
      return;
    }

    const endpoint = req.url.replace('/api/uddoktapay/', '').replace(/^\/+/, '');
    const rawApiUrl = (req.headers['x-api-url'] as string) || 'https://sandbox.uddoktapay.com';
    
    // Clean and normalize baseUrl to avoid duplicate /api/ or trailing slashes
    let cleanBaseUrl = rawApiUrl.trim().replace(/\/+$/, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/checkout-v2\/?$/i, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/checkout-v2\/?$/i, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/verify-payment\/?$/i, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/verify-payment\/?$/i, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/?$/i, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, '');
    if (cleanBaseUrl && !cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
      cleanBaseUrl = 'https://' + cleanBaseUrl;
    }
    if (!cleanBaseUrl) cleanBaseUrl = 'https://sandbox.uddoktapay.com';

    const targetUrl = `${cleanBaseUrl}/api/${endpoint}`;

    try {
      const apiKey = (req.headers['rt-uddoktapay-api-key'] || req.headers['Rt-Uddoktapay-Api-Key'] || req.headers['api-key']) as string;

      let body: string | undefined = undefined;
      if (req.method === 'POST' || req.method === 'PUT') {
        const chunks: Uint8Array[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        body = Buffer.concat(chunks).toString('utf-8');
      }

      const fetchResponse = await fetch(targetUrl, {
        method: req.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(apiKey ? { 'RT-UDDOKTAPAY-API-KEY': apiKey } : {}),
        },
        ...(body ? { body } : {}),
      });

      const data = await fetchResponse.text();
      res.writeHead(fetchResponse.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, RT-UDDOKTAPAY-API-KEY, rt-uddoktapay-api-key, x-api-url, Api-Key, Authorization',
      });
      res.end(data);
    } catch (err: any) {
      console.error('UddoktaPay proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: false, message: err?.message || 'UddoktaPay Proxy Error' }));
    }
  };

  return {
    name: 'uddoktapay-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function paymentCallbackPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    // Handle POST callbacks from UddoktaPay or other gateways
    if (req.method === 'POST' && req.url && (req.url.startsWith('/payment-verify') || req.url.startsWith('/api/payment-callback'))) {
      try {
        const chunks: Uint8Array[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const rawBody = Buffer.concat(chunks).toString('utf-8');
        let invoiceId = '';
        let orderId = '';
        let status = '';

        // Extract order ID from path if present, e.g. /payment-verify/ORDER123
        const pathMatch = req.url.match(/\/payment-verify\/([a-zA-Z0-9_-]+)/);
        if (pathMatch && pathMatch[1] && pathMatch[1] !== 'payment-verify') {
          orderId = pathMatch[1];
        }

        if (req.headers['content-type']?.includes('application/json')) {
          try {
            const parsed = JSON.parse(rawBody);
            invoiceId = parsed.invoice_id || parsed.invoiceId || parsed.id || '';
            orderId = orderId || parsed.order_id || parsed.orderId || parsed.metadata?.order_id || '';
            status = parsed.status || '';
          } catch {}
        } else {
          const params = new URLSearchParams(rawBody);
          invoiceId = params.get('invoice_id') || params.get('invoiceId') || '';
          orderId = orderId || params.get('order_id') || params.get('orderId') || '';
          status = params.get('status') || params.get('gateway_status') || '';
        }

        const queryParams = new URLSearchParams();
        if (invoiceId) queryParams.set('invoice_id', invoiceId);
        if (orderId) queryParams.set('order_id', orderId);
        if (status) queryParams.set('status', status);

        const target = `/payment-verify${orderId ? `/${orderId}` : ''}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        res.writeHead(303, { 
          'Location': target,
          'Access-Control-Allow-Origin': '*'
        });
        res.end();
        return;
      } catch (err) {
        console.error('Payment callback handler error:', err);
      }
    }
    next();
  };

  return {
    name: 'payment-callback-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), steadfastProxyPlugin(), uddoktaPayProxyPlugin(), paymentCallbackPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'motion': ['motion/react'],
            'icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
