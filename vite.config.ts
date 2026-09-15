import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

function steadfastProxyPlugin(): Plugin {
  return {
    name: 'steadfast-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/steadfast/')) {
          return next();
        }

        const endpoint = req.url.replace('/api/steadfast/', '');
        const targetUrl = `https://portal.steadfast.com.bd/api/v1/${endpoint}`;
        
        try {
          const apiKey = (req.headers['api-key'] || req.headers['Api-Key']) as string;
          const secretKey = (req.headers['secret-key'] || req.headers['Secret-Key']) as string;

          let body: string | undefined = undefined;
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            body = Buffer.concat(chunks).toString('utf-8');
          }

          const fetchResponse = await fetch(targetUrl, {
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'Api-Key': apiKey } : {}),
              ...(secretKey ? { 'Secret-Key': secretKey } : {}),
            },
            ...(body ? { body } : {}),
          });

          const data = await fetchResponse.text();
          res.writeHead(fetchResponse.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(data);
        } catch (err: any) {
          console.error('Steadfast proxy error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 500, message: err?.message || 'Proxy Error' }));
        }
      });
    },
  };
}

function uddoktaPayProxyPlugin(): Plugin {
  return {
    name: 'uddoktapay-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/uddoktapay/')) {
          return next();
        }

        const endpoint = req.url.replace('/api/uddoktapay/', '').replace(/^\/+/, '');
        const rawApiUrl = (req.headers['x-api-url'] as string) || 'https://sandbox.uddoktapay.com';
        
        // Clean and normalize baseUrl to avoid duplicate /api/ or trailing slashes
        let cleanBaseUrl = rawApiUrl.trim().replace(/\/+$/, '');
        cleanBaseUrl = cleanBaseUrl.replace(/\/api\/checkout-v2\/?$/i, '');
        cleanBaseUrl = cleanBaseUrl.replace(/\/checkout-v2\/?$/i, '');
        cleanBaseUrl = cleanBaseUrl.replace(/\/api\/verify-payment\/?$/i, '');
        cleanBaseUrl = cleanBaseUrl.replace(/\/api\/?$/i, '');
        cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, '');
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
          });
          res.end(data);
        } catch (err: any) {
          console.error('UddoktaPay proxy error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: false, message: err?.message || 'UddoktaPay Proxy Error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), steadfastProxyPlugin(), uddoktaPayProxyPlugin()],
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
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'motion': ['motion/react'],
            'icons': ['lucide-react'],
          },
        },
      },
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
