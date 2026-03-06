import axiosInstance from "@/utils/axiosInstance";
import type { Address, AddressFormData } from "@/types";

type AddressResponse = { success: true; data: Address };
type AddressListResponse = { success: true; data: Address[] };

export async function getAddressesAPI(): Promise<AddressListResponse> {
  const res = await axiosInstance.get<AddressListResponse>("/api/addresses");
  return res.data;
}

export async function createAddressAPI(data: AddressFormData): Promise<AddressResponse> {
  const res = await axiosInstance.post<AddressResponse>("/api/addresses", data);
  return res.data;
}

export async function updateAddressAPI(id: string, data: Partial<AddressFormData>): Promise<AddressResponse> {
  const res = await axiosInstance.put<AddressResponse>(`/api/addresses/${id}`, data);
  return res.data;
}

export async function deleteAddressAPI(id: string): Promise<{ success: true; data: { message: string } }> {
  const res = await axiosInstance.delete(`/api/addresses/${id}`);
  return res.data;
}

export async function setDefaultAddressAPI(id: string): Promise<AddressResponse> {
  const res = await axiosInstance.put<AddressResponse>(`/api/addresses/${id}/default`);
  return res.data;
}
