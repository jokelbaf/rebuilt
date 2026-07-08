import { ApiError, NETWORK_ERROR_STATUS } from "./errors";
import type { ApiEnvelope } from "./types/common";

const BASE_URL = "/api";

type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

interface RequestOptions {
	params?: QueryParams;
	signal?: AbortSignal;
}

interface BodyRequestOptions extends RequestOptions {
	body?: unknown;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function buildUrl(path: string, params?: QueryParams): string {
	const url = new URL(`${BASE_URL}${path}`, window.location.origin);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		}
	}
	return url.pathname + url.search;
}

async function readEnvelope<T>(response: Response): Promise<T> {
	let envelope: ApiEnvelope<T> | null;
	try {
		envelope = (await response.json()) as ApiEnvelope<T>;
	} catch {
		envelope = null;
	}

	if (!response.ok) {
		const message = envelope?.message || response.statusText || "Request failed";
		throw new ApiError(message, response.status);
	}

	return (envelope?.data ?? null) as T;
}

async function request<T>(
	method: HttpMethod,
	path: string,
	options: BodyRequestOptions = {}
): Promise<T> {
	const { body, params, signal } = options;

	let response: Response;
	try {
		response = await fetch(buildUrl(path, params), {
			method,
			headers: body === undefined ? undefined : { "Content-Type": "application/json" },
			body: body === undefined ? undefined : JSON.stringify(body),
			signal,
		});
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") throw error;
		throw new ApiError(
			"Unable to reach the server. Is the backend running?",
			NETWORK_ERROR_STATUS
		);
	}

	return readEnvelope<T>(response);
}

export const apiClient = {
	get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("POST", path, { ...options, body }),
	put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PUT", path, { ...options, body }),
	patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PATCH", path, { ...options, body }),
	delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
