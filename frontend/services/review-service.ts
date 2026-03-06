import axiosInstance from "@/utils/axiosInstance";
import type { Review, ReviewsResponse, ReviewEligibility } from "@/types";

type ReviewResponse = { success: true; data: Review };
type ReviewsListResponse = { success: true; data: ReviewsResponse };
type EligibilityResponse = { success: true; data: ReviewEligibility };
type DeleteResponse = { success: true; data: null };

// ─── Public ──────────────────────────────────────────────────────────────────

export async function getProductReviewsAPI(
  productId: string,
  params?: { page?: number; limit?: number; sort?: string }
): Promise<ReviewsListResponse> {
  const res = await axiosInstance.get<ReviewsListResponse>(
    `/api/reviews/product/${productId}`,
    { params }
  );
  return res.data;
}

// ─── Protected ───────────────────────────────────────────────────────────────

export async function checkReviewEligibilityAPI(
  productId: string
): Promise<EligibilityResponse> {
  const res = await axiosInstance.get<EligibilityResponse>(
    `/api/reviews/eligibility/${productId}`
  );
  return res.data;
}

export async function createReviewAPI(data: {
  product: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<ReviewResponse> {
  const res = await axiosInstance.post<ReviewResponse>("/api/reviews", data);
  return res.data;
}

export async function updateReviewAPI(
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string }
): Promise<ReviewResponse> {
  const res = await axiosInstance.put<ReviewResponse>(
    `/api/reviews/${reviewId}`,
    data
  );
  return res.data;
}

export async function deleteReviewAPI(reviewId: string): Promise<DeleteResponse> {
  const res = await axiosInstance.delete<DeleteResponse>(
    `/api/reviews/${reviewId}`
  );
  return res.data;
}
