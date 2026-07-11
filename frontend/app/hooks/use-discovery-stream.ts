import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { subscribeToDiscoveryStream } from "~/lib/api/discovery-stream";
import { queryKeys } from "~/lib/api/query-keys";
import type { DiscoveryEvent, DiscoveryRun } from "~/lib/api/types/discovery";

interface UseDiscoveryStreamOptions {
	onEvent: (event: DiscoveryEvent) => void;
	onRunStatus: (run: DiscoveryRun) => void;
}

export function useDiscoveryStream({ onEvent, onRunStatus }: UseDiscoveryStreamOptions) {
	const queryClient = useQueryClient();
	const [isConnected, setIsConnected] = useState(false);

	const handleRunStatus = useCallback(
		(run: DiscoveryRun) => {
			onRunStatus(run);
			queryClient.setQueryData(queryKeys.discovery.runs.detail(run.id), run);
			queryClient.setQueriesData<DiscoveryRun[]>(
				{
					predicate: (query) =>
						query.queryKey[0] === "discovery" &&
						query.queryKey[1] === "runs" &&
						typeof query.queryKey[2] === "number",
				},
				(runs) => [run, ...(runs ?? []).filter((item) => item.id !== run.id)]
			);
			if (run.status !== "running") {
				queryClient.invalidateQueries({ queryKey: queryKeys.discovery.all });
			}
		},
		[onRunStatus, queryClient]
	);

	useEffect(() => {
		const controller = new AbortController();
		let retry: ReturnType<typeof setTimeout> | undefined;

		async function connect() {
			try {
				await subscribeToDiscoveryStream({
					signal: controller.signal,
					onOpen: () => setIsConnected(true),
					onEvent: (event) => {
						setIsConnected(true);
						onEvent(event);
					},
					onRunStatus: (run) => {
						setIsConnected(true);
						handleRunStatus(run);
					},
				});
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
			} finally {
				if (!controller.signal.aborted) {
					setIsConnected(false);
					retry = setTimeout(connect, 2_000);
				}
			}
		}

		void connect();
		return () => {
			controller.abort();
			if (retry) clearTimeout(retry);
		};
	}, [handleRunStatus, onEvent]);

	return isConnected;
}
