/**
 * Fetch wrapper that automatically handles token refresh on 401 errors
 * This function intercepts 401 responses and attempts to refresh the access token
 * before retrying the original request
 */

interface FetchOptions extends RequestInit {
	skipTokenRefresh?: boolean;
}

interface AuthContextType {
	accessToken: string;
	requestNewAccessToken: () => Promise<string | boolean>;
	signOut: () => void;
}

let authContext: AuthContextType | null = null;

/**
 * Set the auth context for use in the fetch wrapper
 * This should be called once when the app initializes
 */
export const setAuthContext = (context: AuthContextType) => {
	authContext = context;
};

/**
 * Fetch wrapper with automatic token refresh
 * Automatically requests a new access token if the current one is expired (401)
 * and retries the request with the new token
 */
export const fetchWithAuth = async (
	url: string,
	options: FetchOptions = {}
): Promise<Response> => {
	if (!authContext) {
		throw new Error('Auth context not initialized. Call setAuthContext first.');
	}

	const { skipTokenRefresh = false, ...fetchOptions } = options;

	// Add current access token to headers
	const headers = new Headers(fetchOptions.headers || {});
	if (authContext.accessToken) {
		headers.set('authorization', `Bearer ${authContext.accessToken}`);
	}
	headers.set('ngrok-skip-browser-warning', 'true');

    const token = await authContext.requestNewAccessToken();

	const response = await fetch(url, {
		...fetchOptions,
		headers,
	});

	// If we get a 401 and haven't already tried to refresh, attempt refresh
	if (response.status === 401 && !skipTokenRefresh) {
		console.log('Access token expired, attempting to refresh...');

		// Request new access token
		const newToken = await authContext.requestNewAccessToken();

		// If refresh failed (returns false), sign out the user
		if (!newToken || newToken === false) {
			console.error('Failed to refresh access token');
			authContext.signOut();
			return response; // Return original 401 response
		}

		// Update header with new token
		headers.set('authorization', `Bearer ${newToken}`);

        console.log(newToken)

		// Retry the original request with new token
		console.log('Retrying request with new access token...');
		return fetch(url, {
			...fetchOptions,
			headers,
		});
	}

	return response;
};
