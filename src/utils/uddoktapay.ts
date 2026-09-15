import { UddoktaPaySettings, UddoktaPayChargeParams, UddoktaPayVerifyResponse } from "../types";

export const DEFAULT_SANDBOX_URL = "https://sandbox.uddoktapay.com";
export const DEFAULT_SANDBOX_KEY = "982d381360a69d419689740d9f2e26ce36fb7a50";

/**
 * Normalizes the UddoktaPay base API URL, stripping any trailing /api or endpoint fragments
 */
export function normalizeUddoktaPayUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim().replace(/\/+$/, "");
  clean = clean.replace(/\/api\/checkout-v2\/?$/i, "");
  clean = clean.replace(/\/checkout-v2\/?$/i, "");
  clean = clean.replace(/\/api\/verify-payment\/?$/i, "");
  clean = clean.replace(/\/verify-payment\/?$/i, "");
  clean = clean.replace(/\/api\/?$/i, "");
  clean = clean.replace(/\/+$/, "");
  if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

/**
 * Returns the normalized UddoktaPay base API URL
 */
export function getUddoktaPayBaseUrl(settings?: UddoktaPaySettings): string {
  if (!settings) return DEFAULT_SANDBOX_URL;
  const rawUrl = settings.apiUrl?.trim();
  const normalized = normalizeUddoktaPayUrl(rawUrl);
  if (normalized) return normalized;
  return settings.isSandbox ? DEFAULT_SANDBOX_URL : "https://pay.uddoktapay.com";
}

/**
 * Robustly parses payment callback URL and parameters, handling malformed
 * query strings (such as multiple ? from redirects), path parameters, and storage fallbacks.
 */
export function parsePaymentCallbackParams(urlStr: string = typeof window !== 'undefined' ? window.location.href : "") {
  let orderId = "";
  let invoiceId = "";
  let isCancelled = false;
  let status = "";
  let trxId = "";

  if (typeof window !== "undefined") {
    // 1. Path param check: e.g. /payment-verify/:orderId
    const pathname = window.location.pathname || "";
    const pathMatch = pathname.match(/\/payment-verify\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1] && pathMatch[1] !== "payment-verify") {
      orderId = pathMatch[1].trim();
    }
  }

  const cleanUrl = decodeURIComponent(urlStr || "");

  // 2. Regex match order_id across whole URL
  if (!orderId) {
    const orderMatch = cleanUrl.match(/[?&]order_id=([^?&#\s]+)/i);
    if (orderMatch && orderMatch[1]) {
      orderId = orderMatch[1].trim();
    }
  }

  // 3. Regex match invoice_id or invoiceId across whole URL
  const invoiceMatch = cleanUrl.match(/[?&](?:invoice_id|invoiceId|invoice)=([^?&#\s]+)/i);
  if (invoiceMatch && invoiceMatch[1]) {
    invoiceId = invoiceMatch[1].trim();
  }

  // 4. Regex match transaction_id or trx_id
  const trxMatch = cleanUrl.match(/[?&](?:transaction_id|trx_id|trxId)=([^?&#\s]+)/i);
  if (trxMatch && trxMatch[1]) {
    trxId = trxMatch[1].trim();
  }

  // 5. Match cancelled status
  if (/[?&]cancelled=(true|1)/i.test(cleanUrl) || /[?&]status=(cancel|cancelled)/i.test(cleanUrl)) {
    isCancelled = true;
  }

  // 6. Match gateway status
  const statusMatch = cleanUrl.match(/[?&](?:status|gateway_status)=([^?&#\s]+)/i);
  if (statusMatch && statusMatch[1]) {
    status = statusMatch[1].trim();
  }

  // 7. Fallback to storage
  if (typeof window !== "undefined") {
    if (!orderId) {
      orderId = sessionStorage.getItem("last_uddoktapay_order_id") || localStorage.getItem("last_uddoktapay_order_id") || "";
    }
    if (!invoiceId && orderId) {
      invoiceId = sessionStorage.getItem(`uddoktapay_invoice_${orderId}`) || 
                  sessionStorage.getItem("last_uddoktapay_invoice_id") || 
                  localStorage.getItem("last_uddoktapay_invoice_id") || "";
    }
  }

  return { orderId, invoiceId, isCancelled, status, trxId };
}

/**
 * Unified gateway caller that supports:
 * 1. Direct browser fetch with CORS (natively supported on Paymently and modern setups)
 * 2. Local proxy /api/uddoktapay/* (for AI Studio dev server & Vercel serverless)
 * 3. Resilient fallback so static hosts without local proxy endpoints never return a false 404
 */
async function callUddoktaPayGateway(
  endpoint: "/api/checkout-v2" | "/api/verify-payment",
  payload: any,
  baseUrl: string,
  apiKey: string
): Promise<{ ok: boolean; status: number; data: any; errorText?: string }> {
  const targetUrl = `${baseUrl}${endpoint}`;
  const isPaymently = baseUrl.toLowerCase().includes("paymently.io");

  // Strategy 1: Paymently has full CORS support (Access-Control-Allow-Origin: *).
  // Calling directly from browser works everywhere, completely independent of serverless proxies!
  if (isPaymently) {
    try {
      const directRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "RT-UDDOKTAPAY-API-KEY": apiKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await directRes.json().catch(() => null);
      if (data !== null) {
        return { ok: directRes.ok, status: directRes.status, data };
      }
    } catch {
      // If direct call failed (e.g. adblocker, network), fall through to proxy
    }
  }

  // Strategy 2: Call through local proxy /api/uddoktapay/*
  const proxyEndpoint = `/api/uddoktapay${endpoint.replace("/api", "")}`;
  try {
    const proxyRes = await fetch(proxyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
        "x-api-url": baseUrl,
      },
      body: JSON.stringify(payload),
    });

    // Only accept proxy response if the route actually exists (not a 404/405/502 from static host)
    if (proxyRes.status !== 404 && proxyRes.status !== 405 && proxyRes.status !== 502) {
      const data = await proxyRes.json().catch(() => null);
      if (data !== null) {
        return { ok: proxyRes.ok, status: proxyRes.status, data };
      }
    }
  } catch {
    // Local proxy call failed, proceed to direct fallback
  }

  // Strategy 3: Direct call fallback
  try {
    const directRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await directRes.json().catch(() => null);
    return { ok: directRes.ok, status: directRes.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorText: err?.message || "গেটওয়ে সার্ভারের সাথে যোগাযোগ করা যায়নি।",
    };
  }
}

/**
 * Creates an UddoktaPay checkout charge and returns the payment redirect URL.
 */
export async function createUddoktaPayCharge(
  params: UddoktaPayChargeParams,
  settings: UddoktaPaySettings
): Promise<{ status: boolean; payment_url?: string; message?: string }> {
  const baseUrl = getUddoktaPayBaseUrl(settings);
  const apiKey = settings.apiKey?.trim();

  if (!apiKey) {
    return {
      status: false,
      message: "UddoktaPay API Key পাওয়া যায়নি। অনুগ্রহ করে এডমিন সেটিংস থেকে API Key কনফিগার করুন।",
    };
  }

  if (!baseUrl) {
    return {
      status: false,
      message: "UddoktaPay API URL পাওয়া যায়নি। অনুগ্রহ করে এডমিন সেটিংস থেকে API URL দিন।",
    };
  }

  const payload = {
    full_name: params.fullName || "Customer",
    email: params.email || "customer@vaivaizone.com",
    amount: String(Math.round(params.amount)),
    metadata: params.metadata || {},
    redirect_url: params.redirectUrl,
    return_type: "GET",
    cancel_url: params.cancelUrl,
  };

  try {
    const { data, errorText } = await callUddoktaPayGateway(
      "/api/checkout-v2",
      payload,
      baseUrl,
      apiKey
    );

    if (data && data.status && data.payment_url) {
      return { status: true, payment_url: data.payment_url };
    }

    const msg = data?.message || errorText || "পেমেন্ট সেশন তৈরি করা যায়নি।";
    let userMsg = msg;
    const lower = typeof msg === "string" ? msg.toLowerCase() : "";
    if (
      lower.includes("invalid or expired api key") ||
      lower.includes("api do not match") ||
      lower.includes("unauthorized")
    ) {
      userMsg =
        "UddoktaPay / Paymently API Key বা ডোমেন মেলেনি। অনুগ্রহ করে এডমিন প্যানেল থেকে সঠিক ডোমেন URL এবং বর্তমান API Key নিশ্চিত করুন।";
    }

    return {
      status: false,
      message: userMsg,
    };
  } catch (error: any) {
    console.error("UddoktaPay create charge error:", error);
    return {
      status: false,
      message: error?.message || "পেমেন্ট রিকোয়েস্ট পাঠাতে নেটওয়ার্ক সমস্যা হয়েছে।",
    };
  }
}

/**
 * Verifies payment status using invoice_id returned from UddoktaPay
 */
export async function verifyUddoktaPayPayment(
  invoiceId: string,
  settings: UddoktaPaySettings
): Promise<UddoktaPayVerifyResponse> {
  const baseUrl = getUddoktaPayBaseUrl(settings);
  const apiKey = settings.apiKey?.trim();

  if (!apiKey || !invoiceId) {
    return {
      status: "ERROR",
      message: "API Key অথবা Invoice ID সঠিক নয়।",
    };
  }

  const payload = { invoice_id: invoiceId };

  try {
    const { data, errorText } = await callUddoktaPayGateway(
      "/api/verify-payment",
      payload,
      baseUrl,
      apiKey
    );

    if (data) {
      return data;
    }

    return {
      status: "ERROR",
      message: errorText || "পেমেন্ট ভেরিফাই করতে গেটওয়ে থেকে কোনো রেসপন্স পাওয়া যায়নি।",
    };
  } catch (error: any) {
    console.error("UddoktaPay verify error:", error);
    return {
      status: "ERROR",
      message: error?.message || "পেমেন্ট ভেরিফাই করার সময় ত্রুটি ঘটেছে।",
    };
  }
}

/**
 * Tests the UddoktaPay configuration and credentials
 */
export async function testUddoktaPayConnection(
  settings: UddoktaPaySettings
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getUddoktaPayBaseUrl(settings);
  const apiKey = settings.apiKey?.trim();

  if (!apiKey) {
    return { success: false, message: "দয়া করে API Key প্রদান করুন।" };
  }

  if (!baseUrl) {
    return { success: false, message: "দয়া করে API Base URL প্রদান করুন।" };
  }

  try {
    const testOrigin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const { data, errorText } = await callUddoktaPayGateway(
      "/api/checkout-v2",
      {
        full_name: "Connection Test",
        email: "test@connection.check",
        amount: "10",
        metadata: { test_probe: true },
        redirect_url: `${testOrigin}/test-verify`,
        cancel_url: `${testOrigin}/test-cancel`,
      },
      baseUrl,
      apiKey
    );

    // Success check: payment_url returned
    if (data?.status && data?.payment_url) {
      const isPaymently = baseUrl.includes("paymently.io");
      const modeLabel = isPaymently
        ? "Paymently"
        : settings.isSandbox
        ? "Sandbox"
        : "UddoktaPay Live";
      return {
        success: true,
        message: `সংযোগ সফল! আপনার ${modeLabel} গেটওয়ে ও API Key সম্পূর্ণ সক্রিয় এবং পেমেন্ট গ্রহণের জন্য প্রস্তুত।`,
      };
    }

    // Check specific error messages
    const rawMsg =
      data?.message ||
      errorText ||
      (data ? JSON.stringify(data) : "গেটওয়ে থেকে কোনো ডেটা পাওয়া যায়নি");
    const lower = typeof rawMsg === "string" ? rawMsg.toLowerCase() : "";

    if (lower.includes("invalid or expired api key")) {
      return {
        success: false,
        message: `API Key সঠিক নয় বা মেয়াদ শেষ হয়েছে (${rawMsg})। অনুগ্রহ করে Paymently ড্যাশবোর্ড (Settings > API) থেকে সক্রিয় API Key কপি করে পেস্ট করুন।`,
      };
    }

    if (lower.includes("api do not match") || lower.includes("unauthorized") || lower.includes("forbidden")) {
      return {
        success: false,
        message: `API Key অথবা ডোমেন URL মেলেনি (${rawMsg})। নিশ্চিত করুন যে আপনি ${baseUrl}-এর সঠিক API Key প্রদান করেছেন।`,
      };
    }

    return {
      success: false,
      message: `গেটওয়ে থেকে রেসপন্স: ${rawMsg}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `সংযোগ ব্যর্থ হয়েছে: ${err.message || "নেটওয়ার্ক সমস্যা"}`,
    };
  }
}
