import axiosInstance from "@/utils/axiosInstance";
import type { AdminOrder } from "@/types";

type AdminOrderResponse = { success: true; data: AdminOrder };

export async function sendToDeliveryAPI(
  orderId: string,
  weight?: number
): Promise<AdminOrderResponse> {
  const { data } = await axiosInstance.post<AdminOrderResponse>(
    `/api/shipping/${orderId}/send`,
    weight ? { weight } : {}
  );
  return data;
}

export async function trackShipmentAPI(orderId: string): Promise<AdminOrderResponse> {
  const { data } = await axiosInstance.get<AdminOrderResponse>(
    `/api/shipping/${orderId}/track`
  );
  return data;
}

export async function cancelShipmentAPI(orderId: string): Promise<AdminOrderResponse> {
  const { data } = await axiosInstance.post<AdminOrderResponse>(
    `/api/shipping/${orderId}/cancel`
  );
  return data;
}

export async function testShippingConnectionAPI(): Promise<{
  success: true;
  data: { provider: string; status: string };
}> {
  const { data } = await axiosInstance.post("/api/shipping/test-connection");
  return data;
}
