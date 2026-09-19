import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  CheckCircle2, XCircle, Clock, ArrowRight, Home, 
  ShoppingBag, Copy, RefreshCw, ShieldCheck, AlertCircle, Phone, Package,
  CreditCard, Check, CornerDownRight, MessageSquare
} from "lucide-react";
import Header from "../components/Header";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { verifyUddoktaPayPayment, parsePaymentCallbackParams } from "../utils/uddoktapay";
import { sendTelegramNotification, escapeTelegramHtml } from "../utils/telegram";
import { createSteadfastOrder, getSteadfastTrackingUrl } from "../utils/steadfast";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order } from "../context/OrderContext";

export default function PaymentVerifyPage() {
  const { orderId: pathOrderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { uddoktaPaySettings, telegramSettings, steadfastSettings, contactInfo } = useAdmin();
  const { clearCart } = useCart();
  const { language } = useSettings();

  const [verificationStatus, setVerificationStatus] = useState<
    "verifying" | "success" | "pending" | "failed" | "cancelled"
  >("verifying");
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [effectiveOrderId, setEffectiveOrderId] = useState<string>("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [manualInvoiceInput, setManualInvoiceInput] = useState<string>("");
  const [isSwitchingCOD, setIsSwitchingCOD] = useState<boolean>(false);

  const hasVerifiedRef = useRef(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const verifyPayment = async (overrideInvoiceId?: string) => {
    // Robust parsing handling query corruption, multiple ?, and path parameters
    const parsed = parsePaymentCallbackParams(window.location.href);
    let resolvedOrderId = pathOrderId || parsed.orderId;
    let resolvedInvoiceId = overrideInvoiceId || manualInvoiceInput.trim() || parsed.invoiceId;
    const isCancelled = parsed.isCancelled;

    // Clean resolvedOrderId if somehow it still has query characters
    if (resolvedOrderId && resolvedOrderId.includes("?")) {
      resolvedOrderId = resolvedOrderId.split("?")[0];
    }
    if (resolvedOrderId && resolvedOrderId.includes("&")) {
      resolvedOrderId = resolvedOrderId.split("&")[0];
    }

    if (resolvedOrderId) {
      setEffectiveOrderId(resolvedOrderId);
    }

    setVerificationStatus("verifying");
    setErrorMessage("");

    try {
      let currentOrder: Order | null = null;

      // 1. Fetch order document from Firestore
      if (resolvedOrderId) {
        const orderDocRef = doc(db, "orders", resolvedOrderId);
        const orderSnap = await getDoc(orderDocRef);
        if (orderSnap.exists()) {
          currentOrder = { id: orderSnap.id, ...(orderSnap.data() as any) } as Order;
          setOrderDetails(currentOrder);
        }
      }

      // 2. If order not found by ID, attempt lookup by invoice ID if available
      if (!currentOrder && resolvedInvoiceId) {
        try {
          const q = query(collection(db, "orders"), where("uddoktaPayInvoiceId", "==", resolvedInvoiceId));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const firstDoc = qSnap.docs[0];
            resolvedOrderId = firstDoc.id;
            setEffectiveOrderId(resolvedOrderId);
            currentOrder = { id: firstDoc.id, ...(firstDoc.data() as any) } as Order;
            setOrderDetails(currentOrder);
          }
        } catch (queryErr) {
          console.warn("Could not query order by invoiceId:", queryErr);
        }
      }

      // Check if cancelled by customer
      if (isCancelled || parsed.status?.toLowerCase() === "cancel" || parsed.status?.toLowerCase() === "cancelled") {
        setVerificationStatus("cancelled");
        if (currentOrder && resolvedOrderId) {
          await updateDoc(doc(db, "orders", resolvedOrderId), {
            uddoktaPayStatus: "CANCELLED",
          });
        }
        return;
      }

      // If already marked as paid
      if (currentOrder && (currentOrder.paymentStatus === "paid" || currentOrder.uddoktaPayStatus === "COMPLETED")) {
        setVerificationStatus("success");
        clearCart();
        return;
      }

      // Determine the invoice_id for UddoktaPay
      const invoiceId = resolvedInvoiceId || currentOrder?.uddoktaPayInvoiceId;
      if (!invoiceId) {
        // Fallback: No invoice ID in URL or order yet
        setVerificationStatus("pending");
        setErrorMessage(language === "bn" 
          ? "পেমেন্ট ইনভয়েস আইডি পাওয়া যায়নি। আপনি যদি টাকা প্রদান করে থাকেন, তবে নিচে ইনভয়েস বা TrxID লিখে যাচাই করুন।" 
          : "Payment Invoice ID not found. If you completed payment, enter Invoice ID below to verify.");
        return;
      }

      // Save for future reference
      if (resolvedOrderId) {
        try {
          sessionStorage.setItem(`uddoktapay_invoice_${resolvedOrderId}`, invoiceId);
          sessionStorage.setItem("last_uddoktapay_invoice_id", invoiceId);
        } catch (e) {}
      }

      // 3. Query UddoktaPay Verify API
      const result = await verifyUddoktaPayPayment(invoiceId, uddoktaPaySettings);
      setPaymentData(result);

      if (result.status === "COMPLETED") {
        clearCart();
        setVerificationStatus("success");

        // 4. Automatically update order in Firestore
        if (resolvedOrderId) {
          const updatePayload: any = {
            paymentStatus: "paid",
            uddoktaPayStatus: "COMPLETED",
            uddoktaPayInvoiceId: result.invoice_id || invoiceId,
            transactionId: result.transaction_id || invoiceId,
            lastNumber: result.sender_number ? String(result.sender_number).slice(-4) : (currentOrder?.lastNumber || ""),
            paymentMethod: `UddoktaPay (${(result.payment_method || "Online").toUpperCase()})`,
            status: "Processing",
          };

          await updateDoc(doc(db, "orders", resolvedOrderId), updatePayload);

          // Auto-book Steadfast Courier if enabled and not already booked
          if (
            steadfastSettings?.isEnabled && 
            steadfastSettings?.autoBooking && 
            steadfastSettings?.apiKey && 
            steadfastSettings?.secretKey &&
            currentOrder &&
            !currentOrder.steadfastConsignmentId
          ) {
            try {
              const invoice = `INV-${resolvedOrderId.slice(-6).toUpperCase()}`;
              const sfRes = await createSteadfastOrder({
                invoice,
                recipient_name: String(currentOrder.customerInfo.name),
                recipient_phone: String(currentOrder.customerInfo.phone),
                recipient_address: String(currentOrder.customerInfo.address),
                cod_amount: 0, // 0 since already paid online
                note: steadfastSettings.defaultNote || 'Handle with Care (Paid Online)',
              }, {
                apiKey: steadfastSettings.apiKey,
                secretKey: steadfastSettings.secretKey,
              });

              if (sfRes.status === 200 && sfRes.consignment) {
                const trackingCode = sfRes.consignment.tracking_code;
                const consignmentId = sfRes.consignment.consignment_id;
                const trackingUrl = getSteadfastTrackingUrl(trackingCode);
                await updateDoc(doc(db, "orders", resolvedOrderId), {
                  steadfastConsignmentId: consignmentId,
                  steadfastTrackingCode: trackingCode,
                  steadfastStatus: sfRes.consignment.status || 'in_review',
                  steadfastBookedAt: new Date().toISOString(),
                  trackingLink: trackingUrl,
                });
              }
            } catch (sfErr) {
              console.error("Auto Steadfast booking after UddoktaPay verify error:", sfErr);
            }
          }

          // 5. Send Telegram Alert for verified online payment
          if (telegramSettings?.isEnabled && telegramSettings?.botToken && telegramSettings?.chatId) {
            const customerName = currentOrder?.customerInfo?.name || "Customer";
            const customerPhone = currentOrder?.customerInfo?.phone || "N/A";
            const amount = result.amount || currentOrder?.total || 0;
            const payMethod = (result.payment_method || "UddoktaPay").toUpperCase();
            const trxId = result.transaction_id || invoiceId;

            const msg = `
<b>✅ Payment Auto-Verified via UddoktaPay!</b>
<b>Order ID:</b> #${resolvedOrderId}
<b>Amount:</b> ৳${amount}
<b>Method:</b> ${payMethod}
<b>TrxID:</b> ${trxId}
<b>Sender:</b> ${result.sender_number || 'N/A'}
<b>Customer:</b> ${escapeTelegramHtml(customerName)}
<b>Phone:</b> ${escapeTelegramHtml(customerPhone)}
<b>Status:</b> PAID & PROCESSING
            `.trim();

            sendTelegramNotification(telegramSettings.botToken, telegramSettings.chatId, msg);
          }
        }
      } else if (result.status === "PENDING") {
        setVerificationStatus("pending");
      } else {
        setVerificationStatus("failed");
        setErrorMessage(result.message || (language === "bn" ? "পেমেন্ট সম্পন্ন হয়নি বা ব্যর্থ হয়েছে।" : "Payment was not completed or failed."));
      }
    } catch (err: any) {
      console.error("Payment verification error:", err);
      setVerificationStatus("failed");
      setErrorMessage(err.message || (language === "bn" ? "ভেরিফিকেশন প্রক্রিয়ায় নেটওয়ার্ক ত্রুটি হয়েছে।" : "Network error during verification."));
    }
  };

  // Convert order to Cash on Delivery
  const handleConvertToCOD = async () => {
    const targetId = effectiveOrderId || pathOrderId || orderDetails?.id;
    if (!targetId) {
      navigate('/checkout');
      return;
    }

    setIsSwitchingCOD(true);
    try {
      await updateDoc(doc(db, "orders", targetId), {
        paymentMethod: "Cash on Delivery",
        paymentStatus: "unpaid",
        uddoktaPayStatus: "switched_to_cod",
        status: "Pending",
        updatedAt: new Date().toISOString()
      });

      // Notify Telegram
      if (telegramSettings?.isEnabled && telegramSettings?.botToken && telegramSettings?.chatId && orderDetails) {
        const msg = `
<b>📦 Order Converted to Cash on Delivery</b>
<b>Order ID:</b> #${targetId}
<b>Customer:</b> ${escapeTelegramHtml(orderDetails.customerInfo?.name || 'Customer')}
<b>Phone:</b> ${escapeTelegramHtml(orderDetails.customerInfo?.phone || '')}
<b>Amount to Collect:</b> ৳${orderDetails.total}
<b>Note:</b> Customer switched from Online Gateway to COD
        `.trim();
        sendTelegramNotification(telegramSettings.botToken, telegramSettings.chatId, msg);
      }

      clearCart();
      navigate('/profile');
    } catch (e: any) {
      alert(language === 'bn' ? `সমস্যা হয়েছে: ${e.message}` : `Error: ${e.message}`);
    } finally {
      setIsSwitchingCOD(false);
    }
  };

  useEffect(() => {
    if (!hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      verifyPayment();
    }
  }, [pathOrderId, searchParams]);

  // Auto-retry polling for pending payments up to 4 times
  useEffect(() => {
    if (verificationStatus === "pending" && pollCount < 4) {
      const timer = setTimeout(() => {
        setPollCount(prev => prev + 1);
        verifyPayment();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, pollCount]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20 flex-grow flex items-center justify-center">
        <div className="w-full max-w-xl">
          
          {/* 1. VERIFYING STATE */}
          {verificationStatus === "verifying" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800 shadow-xl text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <RefreshCw size={36} className="animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">
                  {language === "bn" ? "পেমেন্ট ভেরিফাই করা হচ্ছে..." : "Verifying Payment..."}
                </h2>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {language === "bn" 
                    ? "দয়া করে অপেক্ষা করুন, UddoktaPay গেটওয়ে থেকে আপনার পেমেন্ট কনফার্মেশন যাচাই করা হচ্ছে..." 
                    : "Please wait while we verify your transaction with UddoktaPay..."}
                </p>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl text-xs font-mono text-neutral-400">
                <span>{language === "bn" ? "অর্ডার ট্র্যাকিং আইডি:" : "Order ID:"} #{effectiveOrderId || pathOrderId || "Detecting..."}</span>
              </div>
            </motion.div>
          )}

          {/* 2. SUCCESS STATE */}
          {verificationStatus === "success" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={44} />
                </div>
                <div className="inline-block px-4 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-black uppercase tracking-widest">
                  {language === "bn" ? "পেমেন্ট সফল ও ভেরিফাইড!" : "Payment Verified & Paid!"}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">
                  {language === "bn" ? "আপনার অর্ডারটি সফল হয়েছে!" : "Thank You For Your Order!"}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === "bn" 
                    ? "আপনার অনলাইন পেমেন্টটি স্বয়ংক্রিয়ভাবে যাচাই করা হয়েছে এবং অর্ডারটি প্রসেসিংয়ে রাখা হয়েছে।" 
                    : "Your online payment has been automatically verified and the order is being processed."}
                </p>
              </div>

              {/* Payment & Order Summary Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-700/60 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {language === "bn" ? "অর্ডার আইডি" : "Order ID"}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                    <span>#{effectiveOrderId || pathOrderId || orderDetails?.id}</span>
                    <button 
                      onClick={() => copyToClipboard(effectiveOrderId || pathOrderId || orderDetails?.id || "", "order")}
                      className="p-1 hover:text-primary transition-colors text-neutral-400"
                      title="Copy Order ID"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                {(paymentData?.transaction_id || orderDetails?.transactionId) && (
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      {language === "bn" ? "ট্রানজেকশন আইডি (TRX)" : "Transaction ID"}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-primary">
                      <span>{paymentData?.transaction_id || orderDetails?.transactionId}</span>
                      <button 
                        onClick={() => copyToClipboard(paymentData?.transaction_id || orderDetails?.transactionId || "", "trx")}
                        className="p-1 hover:text-primary transition-colors text-neutral-400"
                        title="Copy TRX ID"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {language === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method"}
                  </span>
                  <span className="font-black text-xs uppercase text-neutral-800 dark:text-neutral-200">
                    {paymentData?.payment_method || orderDetails?.paymentMethod || "UddoktaPay (Online)"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-black text-neutral-900 dark:text-white">
                    {language === "bn" ? "পরিশোধিত মোট টাকা" : "Total Paid"}
                  </span>
                  <span className="text-xl font-black text-primary">
                    ৳{paymentData?.amount || orderDetails?.total || 0}
                  </span>
                </div>
              </div>

              {copiedText && (
                <p className="text-center text-xs font-bold text-primary animate-pulse">
                  {language === "bn" ? "ক্লিপবোর্ডে কপি হয়েছে!" : "Copied to clipboard!"}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  to="/profile"
                  className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
                >
                  <Package size={18} />
                  <span>{language === "bn" ? "আমার অর্ডারসমূহ দেখুন" : "View My Orders"}</span>
                  <ArrowRight size={16} />
                </Link>
                
                <Link
                  to="/"
                  className="w-full py-4 px-6 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Home size={18} />
                  <span>{language === "bn" ? "হোম পেজে ফিরে যান" : "Back to Home"}</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* 3. PENDING STATE */}
          {verificationStatus === "pending" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800 shadow-xl text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">
                  {language === "bn" ? "পেমেন্টটি পেন্ডিং বা অপেক্ষমাণ রয়েছে" : "Payment is Pending"}
                </h2>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {errorMessage || (language === "bn" 
                    ? "আপনি যদি ইতিমধ্যে পেমেন্ট সম্পন্ন করে থাকেন, তবে 'এখনই পুনরায় যাচাই করুন' বাটনে চাপ দিন।" 
                    : "If you have completed the payment, click 'Verify Now' to recheck with the gateway.")}
                </p>
              </div>

              {/* Manual Invoice or TrxID Input */}
              <div className="p-5 bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl space-y-3 text-left border border-neutral-100 dark:border-neutral-700/60">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
                  <CreditCard size={14} className="text-primary" />
                  <span>{language === "bn" ? "ইনভয়েস আইডি বা TrxID দিয়ে ভেরিফাই করুন:" : "Verify by Invoice ID / TrxID:"}</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={manualInvoiceInput}
                    onChange={(e) => setManualInvoiceInput(e.target.value)}
                    placeholder={language === "bn" ? "এখানে Invoice ID বা TrxID লিখুন" : "Enter Invoice ID or TrxID"}
                    className="flex-1 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => verifyPayment(manualInvoiceInput)}
                    className="px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs transition-all shadow-md shrink-0"
                  >
                    {language === "bn" ? "যাচাই করুন" : "Verify"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => verifyPayment()}
                  className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                  <RefreshCw size={16} />
                  <span>{language === "bn" ? "এখনই পুনরায় যাচাই করুন" : "Verify Now"}</span>
                </button>

                {/* Switch to COD Option */}
                <button
                  onClick={handleConvertToCOD}
                  disabled={isSwitchingCOD}
                  className="w-full py-3.5 px-6 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800/50 transition-all disabled:opacity-50"
                >
                  <Package size={16} />
                  <span>{isSwitchingCOD 
                    ? (language === "bn" ? "প্রসেসিং..." : "Processing...") 
                    : (language === "bn" ? "ক্যাশ অন ডেলিভারিতে রূপান্তর করুন (Switch to COD)" : "Switch Order to Cash on Delivery")}</span>
                </button>

                <Link
                  to="/profile"
                  className="w-full py-3 px-6 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>{language === "bn" ? "অর্ডার স্ট্যাটাস দেখুন" : "View Order Status"}</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* 4. CANCELLED OR FAILED STATE */}
          {(verificationStatus === "failed" || verificationStatus === "cancelled") && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800 shadow-xl text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <XCircle size={44} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">
                  {verificationStatus === "cancelled" 
                    ? (language === "bn" ? "পেমেন্ট বাতিল করা হয়েছে" : "Payment Cancelled")
                    : (language === "bn" ? "পেমেন্ট সম্পন্ন হয়নি" : "Payment Failed or Incomplete")}
                </h2>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {errorMessage || (language === "bn" 
                    ? "পেমেন্টটি সম্পন্ন হতে পারেনি। আপনি চাইলে আবার চেষ্টা করতে পারেন অথবা সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে পারেন।" 
                    : "Payment could not be completed. You can try again or place order with Cash on Delivery.")}
                </p>
              </div>

              {/* Convert to COD button directly */}
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 text-left space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>{language === "bn" ? "অনলাইনে পেমেন্ট না করতে পারলে চিন্তার কারণ নেই:" : "Can't pay online? Don't worry:"}</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  {language === "bn" 
                    ? "আপনি এই অর্ডারটি ক্যাশ অন ডেলিভারিতে রূপান্তর করে পণ্য হাতে পাওয়ার পর টাকা পরিশোধ করতে পারেন।"
                    : "You can convert this order to Cash on Delivery and pay after receiving your products."}
                </p>
                <button
                  onClick={handleConvertToCOD}
                  disabled={isSwitchingCOD}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Package size={16} />
                  <span>{isSwitchingCOD 
                    ? (language === "bn" ? "প্রসেসিং..." : "Processing...") 
                    : (language === "bn" ? "ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন" : "Confirm as Cash on Delivery")}</span>
                </button>
              </div>

              {contactInfo?.phone && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl text-xs flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-300 font-bold">
                  <Phone size={14} className="text-primary" />
                  <span>{language === "bn" ? "সাহায্যের জন্য কল করুন:" : "Need help? Call:"} {contactInfo.phone}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => verifyPayment()}
                  className="flex-1 py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                  <RefreshCw size={16} />
                  <span>{language === "bn" ? "পুনরায় যাচাই করুন" : "Verify Again"}</span>
                </button>
                <Link
                  to="/checkout"
                  className="flex-1 py-4 px-6 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag size={16} />
                  <span>{language === "bn" ? "চেকআউটে ফিরুন" : "Back to Checkout"}</span>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
