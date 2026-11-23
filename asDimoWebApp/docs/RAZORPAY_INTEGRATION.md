# Razorpay integration

## Public web checkout

The payment page is public and can be opened at `/payment`. It does not require a browser login. The page:

1. Loads the public key from `GET /payments/key`.
2. Creates an order with `POST /payments/create-order` using the amount in rupees.
3. Opens Razorpay Checkout with the returned `orderId` and paise `amount`.
4. Verifies `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` with `POST /payments/verify-payment`.

The page can receive the mobile user's name, email, phone, access token, amount, receipt, appointment metadata, and return URL from React Native query parameters. JSON values must be encoded with `encodeURIComponent`.

The page also accepts optional query parameters for controlled browser launches:

`/payment?amount=499&receipt=appointment_123`

## React Native WebView handoff

If React Native must show this web payment page, open the public `/payment` URL in a WebView. The page supports query-parameter launch data:

```tsx
const paymentUrl = [
  "http://localhost:5173/dev/asDimoWebApp/payment",
  `amount=${encodeURIComponent(String(appointment.amount))}`,
  `receipt=${encodeURIComponent(`appointment_${appointment.id}`)}`,
  `accessToken=${encodeURIComponent(loggedInUser.accessToken)}`,
  `user=${encodeURIComponent(JSON.stringify({
    name: loggedInUser.name,
    email: loggedInUser.email,
    phone: loggedInUser.phone,
  }))}`,
  `metadata=${encodeURIComponent(JSON.stringify({
    appointmentId: appointment.id,
    source: "react-native",
  }))}`,
  `returnUrl=${encodeURIComponent("your-app-callback://payment")}`,
].join("&");
```

Keep the URL on the trusted HTTPS ASdimo domain in production. Query parameters can be exposed in browser history and logs; a short-lived backend payment-session token is preferable to sending a long-lived access token.

The backend currently protects `POST /payments/create-order` and `POST /payments/verify-payment`, so the access token is required for the page's payment API calls. The page does not store it in localStorage. If you want to avoid exposing a long-lived token in the URL, add a backend-issued, short-lived payment-session token endpoint instead of removing authentication from order creation.

## Native alternative

For a fully native experience, use Razorpay's native SDK and call the same protected APIs directly. This avoids a WebView entirely.

Install the SDK documented for your platform, commonly `react-native-razorpay`, then use a flow like this:

```tsx
import RazorpayCheckout from "react-native-razorpay";

const API_URL = "https://dreamgroupsindia.com/dev/asDimoBackend/api";

async function pay(amountInRupees: number, accessToken: string) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const keyResponse = await fetch(`${API_URL}/payments/key`, { headers });
  const keyBody = await keyResponse.json();
  if (!keyResponse.ok || !keyBody.success) throw new Error(keyBody.message);

  const orderResponse = await fetch(`${API_URL}/payments/create-order`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: amountInRupees,
      currency: "INR",
      notes: { source: "react-native" },
      metadata: { checkout: "native" },
    }),
  });
  const orderBody = await orderResponse.json();
  if (!orderResponse.ok || !orderBody.success) throw new Error(orderBody.message);

  const order = orderBody.data;
  const checkoutResponse = await RazorpayCheckout.open({
    key: keyBody.data.key,
    amount: order.amount,
    currency: order.currency,
    name: "ASdimo",
    description: "ASdimo payment",
    order_id: order.orderId,
    prefill: {
      name: currentUser.name,
      email: currentUser.email,
      contact: currentUser.phone,
    },
  });

  const verifyResponse = await fetch(`${API_URL}/payments/verify-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      razorpay_order_id: checkoutResponse.razorpay_order_id,
      razorpay_payment_id: checkoutResponse.razorpay_payment_id,
      razorpay_signature: checkoutResponse.razorpay_signature,
    }),
  });
  const verifyBody = await verifyResponse.json();
  if (!verifyResponse.ok || !verifyBody.success || !verifyBody.data.verified) {
    throw new Error(verifyBody.message || "Payment verification failed");
  }

  return verifyBody.data.payment;
}
```

The mobile app should obtain `accessToken` from its normal login flow, handle token refresh, and only treat the payment as successful after the verification API responds successfully. The Razorpay webhook remains the server-side fallback for asynchronous payment state updates.
