import { BASE_URL } from "../api/config";
import { fetchWithTokenRefresh } from "./tokenRefreshInterceptor";

export interface PaymentUser {
  name?: string;
  email?: string;
  phone?: string;
  contact?: string;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  receipt: string;
  razorpayKeyId: string;
  paymentDbId?: string;
  paymentId?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => null) as ApiResponse<T> | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Payment request failed");
  }

  return body.data;
};

export const paymentService = {
  async getKey(): Promise<{ key: string }> {
    const response = await fetchWithTokenRefresh(`${BASE_URL}/payments/key`);
    return parseResponse<{ key: string }>(response);
  },

  async createOrder(input: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }, accessToken?: string): Promise<RazorpayOrder> {
    const response = await paymentRequest(`${BASE_URL}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }, accessToken);

    return parseResponse<RazorpayOrder>(response);
  },

  async verifyPayment(input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }, accessToken?: string): Promise<{ verified: boolean; payment: unknown }> {
    const response = await paymentRequest(`${BASE_URL}/payments/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }, accessToken);

    return parseResponse<{ verified: boolean; payment: unknown }>(response);
  },
};

const paymentRequest = async (
  url: string,
  options: RequestInit,
  accessToken?: string
): Promise<Response> => {
  if (!accessToken) return fetchWithTokenRefresh(url, options);

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(url, { ...options, headers });
};

export const getUserPrefill = (user: Record<string, unknown> | null): PaymentUser => ({
  name: typeof user?.name === "string" ? user.name : undefined,
  email: typeof user?.email === "string" ? user.email : undefined,
  phone: typeof user?.phone === "string" ? user.phone : undefined,
  contact: typeof user?.phone === "string" ? user.phone : undefined,
});
