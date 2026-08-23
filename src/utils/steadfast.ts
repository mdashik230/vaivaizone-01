import { SteadfastOrderParams, SteadfastOrderResponse, SteadfastSettings } from "../types";

const STEADFAST_BASE_URL = "https://portal.steadfast.com.bd/api/v1";

/**
 * Creates a consignment booking with Steadfast Courier Service.
 * Uses local proxy /api/steadfast/create_order if available, or direct fallback.
 */
export async function createSteadfastOrder(
  params: SteadfastOrderParams,
  credentials: { apiKey: string; secretKey: string }
): Promise<SteadfastOrderResponse> {
  const { apiKey, secretKey } = credentials;
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
    // Attempt via backend/Vite proxy first to bypass browser CORS
    const response = await fetch("/api/steadfast/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status === 404) {
      // If server proxy is not mounted, attempt direct call
      const directResponse = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
        },
        body: JSON.stringify(payload),
      });
      return await directResponse.json();
    }

    const data = await response.json();
    return data;
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
  const { apiKey, secretKey } = credentials;
  if (!apiKey || !secretKey) {
    return { status: 400, message: "API Key and Secret Key are missing" };
  }

  try {
    const response = await fetch("/api/steadfast/get_balance", {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
    });

    if (!response.ok && response.status === 404) {
      const directRes = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
        },
      });
      return await directRes.json();
    }

    const data = await response.json();
    return data;
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
  const { apiKey, secretKey } = credentials;
  if (!apiKey || !secretKey || !trackingCode) {
    return { status: 400, message: "Tracking code and credentials are required" };
  }

  try {
    const response = await fetch(`/api/steadfast/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
    });

    if (!response.ok && response.status === 404) {
      const directRes = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
        },
      });
      return await directRes.json();
    }

    const data = await response.json();
    return data;
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
  const { apiKey, secretKey } = credentials;
  if (!apiKey || !secretKey || !invoice) {
    return { status: 400, message: "Invoice and credentials are required" };
  }

  try {
    const response = await fetch(`/api/steadfast/status_by_invoice/${encodeURIComponent(invoice)}`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
    });

    if (!response.ok && response.status === 404) {
      const directRes = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(invoice)}`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
        },
      });
      return await directRes.json();
    }

    const data = await response.json();
    return data;
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
