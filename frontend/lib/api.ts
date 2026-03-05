const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

/**
 * Native fetch wrapper for general API calls and FormData uploads.
 * Automatically sets Content-Type: application/json unless body is FormData.
 * Use axiosInstance instead for auth-critical flows (auto 401 refresh).
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = false, headers = {}, body, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // Set JSON content type unless the body is FormData
  if (!(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Attach Bearer token if auth flag is set
  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}
