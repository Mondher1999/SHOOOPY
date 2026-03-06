import axiosInstance from "@/utils/axiosInstance";
import type { ProductImage } from "@/types";

export interface UploadProductImagesResponse {
  images: ProductImage[];
}

/**
 * Upload up to 10 product images for a specific product.
 * Uses axiosInstance so the Bearer token is auto-injected.
 *
 * @param productId  - Mongo ObjectId of the product
 * @param files      - Array of File objects selected by the user
 * @param onProgress - Optional callback receiving overall upload progress (0–100)
 */
export async function uploadProductImagesAPI(
  productId: string,
  files: File[],
  onProgress?: (pct: number) => void
): Promise<{ success: true; data: UploadProductImagesResponse }> {
  const formData = new FormData();
  formData.append("productId", productId);
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await axiosInstance.post<{ success: true; data: UploadProductImagesResponse }>(
    "/api/uploads/product-images",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    }
  );

  return response.data;
}

/**
 * Delete a product image by its fileId.
 * fileId format: "{productId}:{originalFilename}"
 */
export async function deleteProductImageAPI(
  fileId: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.delete<{ success: true; data: { message: string } }>(
    `/api/uploads/product-images/${encodeURIComponent(fileId)}`
  );
  return response.data;
}

/**
 * Persist a new image order for a product.
 * Call this after the user drag-reorders the ImageSortable grid.
 */
export async function reorderProductImagesAPI(
  productId: string,
  images: ProductImage[]
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.patch<{ success: true; data: { message: string } }>(
    `/api/uploads/product-images/${productId}/reorder`,
    { images }
  );
  return response.data;
}
