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
  clean = clean.replace(/\/api\/?$/i, "");
  return clean.replace(/\/+$/, "");
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
    // Attempt through local proxy first to avoid browser CORS issues
    const proxyResponse = await fetch("/api/uddoktapay/checkout-v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
        "x-api-url": baseUrl,
      },
      body: JSON.stringify(payload),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (data.status && data.payment_url) {
        return { status: true, payment_url: data.payment_url };
      }
      return {
        status: false,
        message: data.message || "পেমেন্ট সেশন তৈরি করা যায়নি।",
      };
    }

    // Direct fallback if proxy is unavailable
    const directResponse = await fetch(`${baseUrl}/api/checkout-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const directData = await directResponse.json();
    if (directData.status && directData.payment_url) {
      return { status: true, payment_url: directData.payment_url };
    }

    return {
      status: false,
      message: directData.message || "পেমেন্ট গেটওয়েতে সংযোগ করতে ব্যর্থ হয়েছে।",
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
    const proxyResponse = await fetch("/api/uddoktapay/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
        "x-api-url": baseUrl,
      },
      body: JSON.stringify(payload),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return data;
    }

    // Direct fallback
    const directResponse = await fetch(`${baseUrl}/api/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    return await directResponse.json();
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
    // Call verify-payment with a test invoice id
    const res = await fetch("/api/uddoktapay/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
        "x-api-url": baseUrl,
      },
      body: JSON.stringify({ invoice_id: "connection_test" }),
    });

    const data = await res.json().catch(() => null);

    // If server responds with 401 or invalid API key message
    if (res.status === 401 || (data && typeof data.message === 'string' && data.message.toLowerCase().includes('unauthorized'))) {
      return { success: false, message: "API Key সঠিক নয় বা এক্সেস ডিনাইড হয়েছে।" };
    }

    // If invoice not found or status false with standard message, API Key & connection are good!
    if (data && (data.message?.toLowerCase().includes("invoice") || data.message?.toLowerCase().includes("not found") || data.status !== undefined)) {
      return { success: true, message: "সংযোগ সফল! UddoktaPay API Key এবং URL সক্রিয় রয়েছে।" };
    }

    if (res.ok) {
      return { success: true, message: "সংযোগ সফল! গেটওয়ে রেসপন্স করছে।" };
    }

    return {
      success: false,
      message: data?.message || `গেটওয়ে থেকে রেসপন্স: ${res.status} ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `সংযোগ ব্যর্থ হয়েছে: ${err.message || "নেটওয়ার্ক সমস্যা"}`,
    };
  }
}
