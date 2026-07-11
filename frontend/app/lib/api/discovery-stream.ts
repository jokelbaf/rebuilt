import { ApiError, NETWORK_ERROR_STATUS } from "./errors";
import { consumeSseResponse } from "./sse";
import type { DiscoveryEvent, DiscoveryRun } from "./types/discovery";

interface SubscribeOptions {
	signal: AbortSignal;
	onOpen: () => void;
	onEvent: (event: DiscoveryEvent) => void;
	onRunStatus: (run: DiscoveryRun) => void;
}

export async function subscribeToDiscoveryStream(options: SubscribeOptions): Promise<void> {
	let response: Response;
	try {
		response = await fetch("/api/discovery/stream", { signal: options.signal });
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") throw error;
		throw new ApiError(
			"Unable to reach the discovery stream. Is the backend running?",
			NETWORK_ERROR_STATUS
		);
	}

	if (response.ok) options.onOpen();
	await consumeSseResponse(response, ({ event, data }) => {
		if (event === "discovery-event") options.onEvent(JSON.parse(data) as DiscoveryEvent);
		if (event === "run-status") options.onRunStatus(JSON.parse(data) as DiscoveryRun);
	});
}
