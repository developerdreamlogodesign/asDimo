import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { getUserPrefill, paymentService } from "../../services/paymentService";
import type { PaymentUser, RazorpayOrder } from "../../services/paymentService";
import DashboardButtons from "../../components/ui/Buttons";
import "./PaymentPage.css";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
}

type PaymentState = "idle" | "creating" | "verifying" | "success";

interface PaymentLaunchMessage {
  type: "ASDIMO_PAYMENT_INIT";
  accessToken?: string;
  user?: PaymentUser;
  amount?: number;
  receipt?: string;
  metadata?: Record<string, unknown>;
}

const loadRazorpayCheckout = (): Promise<void> => {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
};

const parseJsonParam = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const PaymentPage = () => {
  const [amount, setAmount] = useState("499");
  const [receipt, setReceipt] = useState("");
  const [key, setKey] = useState("");
  const [state, setState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [launchUser, setLaunchUser] = useState<Record<string, unknown> | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<Record<string, unknown>>({ checkout: "razorpay" });
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const prefill = useMemo(() => getUserPrefill(launchUser), [launchUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amountParam = Number(params.get("amount"));
    const tokenParam = params.get("accessToken");
    const userParam = parseJsonParam<Record<string, unknown> | null>(params.get("user"), null);
    const metadataParam = parseJsonParam<Record<string, unknown> | null>(params.get("metadata"), null);

    if (Number.isFinite(amountParam) && amountParam > 0) {
      setAmount(String(amountParam));
    }
    setReceipt(params.get("receipt") || "");
    if (tokenParam) setAccessToken(tokenParam);
    if (userParam) setLaunchUser(userParam);
    if (metadataParam) setMetadata({ checkout: "razorpay", ...metadataParam });
    setReturnUrl(params.get("returnUrl"));

    const handleLaunchMessage = (event: MessageEvent<PaymentLaunchMessage>) => {
      if (event.data?.type !== "ASDIMO_PAYMENT_INIT") return;
      const launchData = event.data;
      setAccessToken(launchData.accessToken);
      setLaunchUser((launchData.user || {}) as Record<string, unknown>);
      setMetadata({ checkout: "razorpay", ...(launchData.metadata || {}) });
      if (launchData.amount && launchData.amount > 0) setAmount(String(launchData.amount));
      if (launchData.receipt) setReceipt(launchData.receipt);
    };

    window.addEventListener("message", handleLaunchMessage);

    paymentService.getKey()
      .then((result) => setKey(result.key))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load payment configuration"));

    return () => window.removeEventListener("message", handleLaunchMessage);
  }, []);

  const amountValue = Number(amount);
  const isAmountValid = Number.isFinite(amountValue) && amountValue > 0;
  const displayName = prefill.name || "ASdimo customer";

  const handlePayment = async () => {
    if (!isAmountValid || !key) {
      setMessage(!key ? "Payment configuration is still loading" : "Enter a valid amount greater than zero");
      return;
    }

    if (!accessToken) {
      setMessage("Open this payment page from the mobile app to start a secure payment session");
      return;
    }

    setState("creating");
    setMessage(null);
    setOrder(null);

    try {
      const createdOrder = await paymentService.createOrder({
        amount: amountValue,
        currency: "INR",
        receipt: receipt.trim() || undefined,
        notes: { source: "web-checkout" },
        metadata,
      }, accessToken);

      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");

      setOrder(createdOrder);
      setState("verifying");

      const checkout = new window.Razorpay({
        key,
        amount: createdOrder.amount,
        currency: createdOrder.currency,
        name: "ASdimo",
        description: "ASdimo payment",
        order_id: createdOrder.orderId,
        prefill,
        notes: { receipt: createdOrder.receipt },
        theme: { color: "#267b70" },
        modal: {
          ondismiss: () => {
            setState("idle");
            setMessage("Payment window closed before completion");
          },
        },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment(response, accessToken);
            setState("success");
            setMessage("Payment verified successfully");

            if (returnUrl) {
              try {
                const callback = new URL(returnUrl);
                callback.searchParams.set("payment", "success");
                callback.searchParams.set("paymentId", response.razorpay_payment_id);
                window.location.replace(callback.toString());
              } catch {
                setMessage("Payment verified, but the return URL is invalid");
              }
            }
          } catch (error: unknown) {
            setState("idle");
            setMessage(error instanceof Error ? error.message : "Payment verification failed");
          }
        },
      });

      checkout.open();
    } catch (error: unknown) {
      setState("idle");
      setMessage(error instanceof Error ? error.message : "Unable to start payment");
    }
  };

  return (
    <main className="payment-page">
      <section className="payment-intro">
        <span className="payment-kicker">SECURE CHECKOUT</span>
        <h1>Complete your payment</h1>
        <p>Pay securely with Razorpay. Your payment is confirmed only after the server verifies the transaction.</p>
        <div className="payment-trust"><ShieldCheck size={18} /> PCI-aligned checkout powered by Razorpay</div>
      </section>

      <section className="payment-panel" aria-label="Razorpay payment form">
        {state === "success" ? (
          <div className="payment-success">
            <CheckCircle2 size={48} />
            <h2>Payment complete</h2>
            <p>{message}</p>
            {order?.paymentId && <small>Reference #{order.paymentId}</small>}
          </div>
        ) : (
          <>
            <div className="payment-panel-header">
              <div className="payment-icon"><CreditCard size={22} /></div>
              <div><h2>Payment details</h2><p>Amount is charged in Indian Rupees.</p></div>
            </div>

            <label htmlFor="payment-amount">Amount</label>
            <div className="payment-amount-input"><span>₹</span><input id="payment-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div>

            <label htmlFor="payment-receipt">Receipt <span>(optional)</span></label>
            <input id="payment-receipt" value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder="Generated automatically" />

            <div className="payment-summary"><span>Paying as</span><strong>{displayName}</strong></div>
            {message && <p className="payment-message" role="alert">{message}</p>}

            <DashboardButtons
              text={state === "creating" || state === "verifying" ? "Preparing checkout" : "Continue to payment"}
              icon={state === "creating" || state === "verifying" ? <LoaderCircle size={18} className="payment-spinner" /> : <CreditCard size={18} />}
              onClick={handlePayment}
              disabled={state === "creating" || state === "verifying" || !key}
              width="full"
              textsize="md"
              variant="DarkGreen"
            />
            <p className="payment-note">Do not refresh while the payment window is open.</p>
          </>
        )}
      </section>
    </main>
  );
};

export default PaymentPage;
