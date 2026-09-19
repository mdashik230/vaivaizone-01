import { SteadfastOrderParams, SteadfastOrderResponse, SteadfastSettings } from "../types";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

/**
 * Helper to safely extract JSON or error message from fetch Response.
 * Filters out HTML responses (such as SPA 404/fallback HTML) so they never pose as valid API responses.
 */
async function parseResponseJson(res: Response): Promise<any> {
  try {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!text || text.trim().startsWith("<") || contentType.includes("text/html")) {
      return { status: 502, message: "সার্ভার থেকে সঠিক JSON রেসপন্স পাওয়া যায়নি" };
    }
    const data = JSON.parse(text);
    return data;
  } catch {
    return { status: 500, message: "Invalid JSON response from server" };
  }
}

/**
 * Universal caller for Steadfast API:
 * 1. Tries direct browser call to https://portal.packzy.com/api/v1 (CORS is natively enabled)
 * 2. Falls back to local/Vercel serverless proxy (/api/steadfast/...) if direct call encounters network issues
 */
async function callSteadfastApi(
  endpoint: string,
  options: {
    method?: "GET" | "POST";
    body?: any;
    apiKey: string;
    secretKey: string;
  }
): Promise<any> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Api-Key": options.apiKey,
    "Secret-Key": options.secretKey,
  };

  // Strategy 1: Direct browser call (Packzy/Steadfast has Access-Control-Allow-Origin: *)
  // Works directly on Vercel production domains, mobile, and desktop without serverless dependencies!
  try {
    const directUrl = `${STEADFAST_BASE_URL}/${endpoint.replace(/^\/+/, "")}`;
    const directRes = await fetch(directUrl, {
      method,
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    const directData = await parseResponseJson(directRes);
    if (directData && typeof directData.status === "number" && directData.status !== 502) {
      return directData;
    }
  } catch {
    // If adblocker or strict local policy blocked direct call, fall through to proxy
  }

  // Strategy 2: Local proxy or Vercel serverless endpoint
  try {
    let proxyUrl = `/api/steadfast/${endpoint.replace(/^\/+/, "")}`;
    if (endpoint.startsWith("status_by_trackingcode/")) {
      const code = endpoint.replace("status_by_trackingcode/", "");
      proxyUrl = `/api/steadfast/status_by_trackingcode?code=${encodeURIComponent(code)}`;
    } else if (endpoint.startsWith("status_by_invoice/")) {
      const invoice = endpoint.replace("status_by_invoice/", "");
      proxyUrl = `/api/steadfast/status_by_invoice?invoice=${encodeURIComponent(invoice)}`;
    }

    const proxyRes = await fetch(proxyUrl, {
      method,
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    const proxyData = await parseResponseJson(proxyRes);
    if (proxyData && typeof proxyData.status === "number" && proxyData.status !== 502) {
      return proxyData;
    }
  } catch {
    // Proxy failed
  }

  return {
    status: 500,
    message: "Steadfast সার্ভারে সংযোগ ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ ও ক্রেডেনশিয়াল চেক করুন।",
  };
}

/**
 * Creates a consignment booking with Steadfast Courier Service.
 */
export async function createSteadfastOrder(
  params: SteadfastOrderParams,
  credentials: { apiKey: string; secretKey: string }
): Promise<SteadfastOrderResponse> {
  const apiKey = credentials?.apiKey ? String(credentials.apiKey).trim() : "";
  const secretKey = credentials?.secretKey ? String(credentials.secretKey).trim() : "";
  if (!apiKey || !secretKey) {
    return {
      status: 400,
      message: "Steadfast API Key & Secret Key are required. Please configure them in Admin Settings.",
    };
  }

  const payload = {
    invoice: params.invoice,
    recipient_name: params.recipient_name,
    recipient_phone: params.recipient_phone,
    recipient_address: params.recipient_address,
    cod_amount: Number(params.cod_amount) || 0,
    note: params.note || "Handle with Care",
  };

  try {
    return await callSteadfastApi("create_order", {
      method: "POST",
      body: payload,
      apiKey,
      secretKey,
    });
  } catch (error: any) {
    console.error("Steadfast createOrder error:", error);
    return {
      status: 500,
      message: error?.message || "Failed to connect to Steadfast Courier API",
    };
  }
}

/**
 * Checks the current Steadfast Merchant account balance.
 */
export async function getSteadfastBalance(
  credentials: { apiKey: string; secretKey: string }
): Promise<{ status: number; current_balance?: number; message?: string }> {
  const apiKey = credentials?.apiKey ? String(credentials.apiKey).trim() : "";
  const secretKey = credentials?.secretKey ? String(credentials.secretKey).trim() : "";
  if (!apiKey || !secretKey) {
    return { status: 400, message: "API Key and Secret Key are missing" };
  }

  try {
    return await callSteadfastApi("get_balance", {
      method: "GET",
      apiKey,
      secretKey,
    });
  } catch (error: any) {
    console.error("Steadfast getBalance error:", error);
    return {
      status: 500,
      message: error?.message || "Network error fetching Steadfast balance",
    };
  }
}

/**
 * Checks the live delivery status of a consignment by Steadfast Tracking Code.
 */
export async function getSteadfastStatusByTrackingCode(
  trackingCode: string,
  credentials: { apiKey: string; secretKey: string }
): Promise<{ status: number; delivery_status?: string; message?: string }> {
  const apiKey = credentials?.apiKey ? String(credentials.apiKey).trim() : "";
  const secretKey = credentials?.secretKey ? String(credentials.secretKey).trim() : "";
  const cleanCode = (trackingCode || "").trim();
  if (!apiKey || !secretKey || !cleanCode) {
    return { status: 400, message: "Tracking code and credentials are required" };
  }

  try {
    return await callSteadfastApi(`status_by_trackingcode/${encodeURIComponent(cleanCode)}`, {
      method: "GET",
      apiKey,
      secretKey,
    });
  } catch (error: any) {
    console.error("Steadfast getStatus error:", error);
    return {
      status: 500,
      message: error?.message || "Failed to check Steadfast status",
    };
  }
}

/**
 * Checks the live delivery status by invoice number.
 */
export async function getSteadfastStatusByInvoice(
  invoice: string,
  credentials: { apiKey: string; secretKey: string }
): Promise<{ status: number; delivery_status?: string; message?: string }> {
  const apiKey = credentials?.apiKey ? String(credentials.apiKey).trim() : "";
  const secretKey = credentials?.secretKey ? String(credentials.secretKey).trim() : "";
  const cleanInvoice = (invoice || "").trim();
  if (!apiKey || !secretKey || !cleanInvoice) {
    return { status: 400, message: "Invoice and credentials are required" };
  }

  try {
    return await callSteadfastApi(`status_by_invoice/${encodeURIComponent(cleanInvoice)}`, {
      method: "GET",
      apiKey,
      secretKey,
    });
  } catch (error: any) {
    console.error("Steadfast getStatusByInvoice error:", error);
    return {
      status: 500,
      message: error?.message || "Failed to check status by invoice",
    };
  }
}

/**
 * Returns customer-facing Steadfast tracking URL.
 */
export function getSteadfastTrackingUrl(trackingCode: string): string {
  if (!trackingCode) return "";
  return `https://steadfast.com.bd/tracking?tracking_code=${encodeURIComponent(trackingCode)}`;
}

/**
 * Translates Steadfast status codes into human readable English and Bengali labels with style classes.
 */
export function formatSteadfastStatus(status?: string, lang: "bn" | "en" = "bn") {
  const s = (status || "").toLowerCase().trim();
  
  switch (s) {
    case "delivered":
      return {
        label: lang === "bn" ? "ডেলিভার্ড (সফল)" : "Delivered",
        colorClass: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800",
      };
    case "partial_delivered":
      return {
        label: lang === "bn" ? "আংশিক ডেলিভার্ড" : "Partial Delivered",
        colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800",
      };
    case "in_review":
      return {
        label: lang === "bn" ? "রিভিউ চলছে" : "In Review",
        colorClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800",
      };
    case "pending":
      return {
        label: lang === "bn" ? "পেন্ডিং (বুকড)" : "Pending",
        colorClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800",
      };
    case "delivered_approval_pending":
      return {
        label: lang === "bn" ? "ডেলিভারি অনুমোদনের অপেক্ষায়" : "Delivery Approval Pending",
        colorClass: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-800",
      };
    case "cancelled":
      return {
        label: lang === "bn" ? "বাতিল হয়েছে" : "Cancelled",
        colorClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800",
      };
    case "hold":
      return {
        label: lang === "bn" ? "হোল্ড রাখা হয়েছে" : "On Hold",
        colorClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-800",
      };
    default:
      return {
        label: status ? status.toUpperCase() : (lang === "bn" ? "বুকিং করা হয়নি" : "Not Dispatched"),
        colorClass: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
      };
  }
}
