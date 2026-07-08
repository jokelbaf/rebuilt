export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}

	get isNetworkError(): boolean {
		return this.status === NETWORK_ERROR_STATUS;
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) return error.message;
	return "Something went wrong";
}
