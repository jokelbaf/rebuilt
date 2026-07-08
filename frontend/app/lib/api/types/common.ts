export interface ApiEnvelope<T> {
	message: string;
	data: T | null;
}

export interface MutationMessage {
	message: string;
}
