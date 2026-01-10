import { useAuthStore } from "@/stores/authStore";

interface FetchOptions extends RequestInit {
  skipTokenRefresh?: boolean;
}
export const fetchWithAuth = async (url: string, options: FetchOptions = {}): Promise<Response> => {
  const { skipTokenRefresh = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set("authorization", `Bearer ${useAuthStore.getState().accessToken}`);
  headers.set("ngrok-skip-browser-warning", "true");

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipTokenRefresh) {
    await useAuthStore.getState().requestNewAccessToken();
    const newToken = useAuthStore.getState().accessToken;

    if (!newToken) {
      console.error("Failed to refresh access token");
      useAuthStore.getState().signOut();
      return res;
    }

    headers.set("authorization", `Bearer ${newToken}`);

    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  }

  return res;
};
