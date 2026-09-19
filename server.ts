import express, { Request, Response } from "express";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Gzip / Brotli compression for all HTTP responses
  app.use(compression());

  // Middleware for parsing JSON and urlencoded request bodies
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Api-Key, Secret-Key, api-key, secret-key, RT-UDDOKTAPAY-API-KEY, rt-uddoktapay-api-key, x-api-url, Authorization"
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Steadfast Courier API Proxy
  app.all("/api/steadfast/*", async (req: Request, res: Response) => {
    const endpoint = req.url.replace(/^\/api\/steadfast\/?/, "");
    const candidateHosts = [
      "https://portal.packzy.com/api/v1",
      "https://portal.steadfast.com.bd/api/v1",
    ];

    const rawApiKey = (req.headers["api-key"] || req.headers["Api-Key"]) as string;
    const rawSecretKey = (req.headers["secret-key"] || req.headers["Secret-Key"]) as string;
    const apiKey = rawApiKey ? String(rawApiKey).trim() : "";
    const secretKey = rawSecretKey ? String(rawSecretKey).trim() : "";

    let lastError: any = null;
    for (const baseUrl of candidateHosts) {
      try {
        const targetUrl = `${baseUrl}/${endpoint}`;
        const fetchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (apiKey) fetchHeaders["Api-Key"] = apiKey;
        if (secretKey) fetchHeaders["Secret-Key"] = secretKey;

        const fetchOptions: RequestInit = {
          method: req.method,
          headers: fetchHeaders,
        };

        if (req.method === "POST" || req.method === "PUT") {
          fetchOptions.body = JSON.stringify(req.body || {});
        }

        const fetchResponse = await fetch(targetUrl, fetchOptions);
        const data = await fetchResponse.text();
        res.status(fetchResponse.status).send(data);
        return;
      } catch (err: any) {
        lastError = err;
      }
    }

    console.error("Steadfast proxy error:", lastError);
    res.status(500).json({ status: 500, message: lastError?.message || "Steadfast Proxy Error" });
  });

  // UddoktaPay Payment Gateway Proxy
  app.all("/api/uddoktapay/*", async (req: Request, res: Response) => {
    const endpoint = req.url.replace(/^\/api\/uddoktapay\/?/, "");
    const rawApiUrl = (req.headers["x-api-url"] as string) || "https://sandbox.uddoktapay.com";

    let cleanBaseUrl = rawApiUrl.trim().replace(/\/+$/, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/checkout-v2\/?$/i, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/checkout-v2\/?$/i, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/verify-payment\/?$/i, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/verify-payment\/?$/i, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/api\/?$/i, "");
    cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, "");
    if (cleanBaseUrl && !cleanBaseUrl.startsWith("http://") && !cleanBaseUrl.startsWith("https://")) {
      cleanBaseUrl = "https://" + cleanBaseUrl;
    }
    if (!cleanBaseUrl) cleanBaseUrl = "https://sandbox.uddoktapay.com";

    const targetUrl = `${cleanBaseUrl}/api/${endpoint}`;
    const apiKey = (req.headers["rt-uddoktapay-api-key"] ||
      req.headers["Rt-Uddoktapay-Api-Key"] ||
      req.headers["api-key"]) as string;

    try {
      const fetchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (apiKey) fetchHeaders["RT-UDDOKTAPAY-API-KEY"] = String(apiKey).trim();

      const fetchOptions: RequestInit = {
        method: req.method || "POST",
        headers: fetchHeaders,
      };

      if (req.method === "POST" || req.method === "PUT") {
        fetchOptions.body = JSON.stringify(req.body || {});
      }

      const fetchResponse = await fetch(targetUrl, fetchOptions);
      const data = await fetchResponse.text();
      res.status(fetchResponse.status).send(data);
    } catch (err: any) {
      console.error("UddoktaPay proxy error:", err);
      res.status(500).json({ status: false, message: err?.message || "UddoktaPay Proxy Error" });
    }
  });

  // Payment Callback Redirection
  app.post(["/payment-verify", "/payment-verify/*", "/api/payment-callback"], (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const invoiceId = body.invoice_id || body.invoiceId || body.id || (req.query.invoice_id as string) || "";
      let orderId = body.order_id || body.orderId || body.metadata?.order_id || (req.query.order_id as string) || "";
      const status = body.status || body.gateway_status || (req.query.status as string) || "";

      // Path match fallback
      const pathMatch = req.path.match(/\/payment-verify\/([a-zA-Z0-9_-]+)/);
      if (pathMatch && pathMatch[1] && pathMatch[1] !== "payment-verify") {
        orderId = pathMatch[1];
      }

      const queryParams = new URLSearchParams();
      if (invoiceId) queryParams.set("invoice_id", String(invoiceId));
      if (orderId) queryParams.set("order_id", String(orderId));
      if (status) queryParams.set("status", String(status));

      const target = `/payment-verify${orderId ? `/${orderId}` : ""}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return res.redirect(303, target);
    } catch (err) {
      console.error("Payment callback redirect error:", err);
      return res.redirect(303, "/payment-verify");
    }
  });

  // Vite middleware in dev, Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve hashed assets with 1-year immutable cache policy
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }));

    // Serve other static assets with 1-day cache
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html") || filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }));

    app.get("*", (_req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
