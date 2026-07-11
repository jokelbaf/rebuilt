import { ApiError, NETWORK_ERROR_STATUS } from "./errors";
import type { ApiEnvelope } from "./types/common";

export interface SseMessage {
	event: string;
	data: string;
}

interface StreamSseOptions {
	body: FormData;
	signal: AbortSignal;
	onMessage: (message: SseMessage) => void;
}

/** POST to an API path and consume the SSE response, invoking onMessage per event. */
export async function streamSse(path: string, options: StreamSseOptions): Promise<void> {
	const { body, signal, onMessage } = options;

	let response: Response;
	try {
		response = await fetch(`/api${path}`, { method: "POST", body, signal });
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") throw error;
		throw new ApiError(
			"Unable to reach the server. Is the backend running?",
			NETWORK_ERROR_STATUS
		);
	}

	await consumeSseResponse(response, onMessage);
}

export async function consumeSseResponse(
	response: Response,
	onMessage: (message: SseMessage) => void
): Promise<void> {
	if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);
	if (!response.body) throw new ApiError("The server returned an empty stream.", response.status);

	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
	let buffer = "";

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += value;

		let separator = buffer.indexOf("\n\n");
		while (separator !== -1) {
			const block = buffer.slice(0, separator);
			buffer = buffer.slice(separator + 2);
			const message = parseSseBlock(block);
			if (message) onMessage(message);
			separator = buffer.indexOf("\n\n");
		}
	}
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const envelope = (await response.json()) as ApiEnvelope<unknown>;
		if (envelope.message) return envelope.message;
	} catch {
		// Not a JSON envelope; fall through to the status text.
	}
	return response.statusText || "Request failed";
}

function parseSseBlock(block: string): SseMessage | null {
	let event = "message";
	const data: string[] = [];

	for (const line of block.split("\n")) {
		if (line.startsWith("event:")) {
			event = line.slice("event:".length).trim();
		} else if (line.startsWith("data:")) {
			data.push(line.slice("data:".length).trimStart());
		}
	}

	if (data.length === 0) return null;
	return { event, data: data.join("\n") };
}
