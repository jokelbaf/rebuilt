import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CurrentRunBanner } from "~/components/discovery/current-run-banner";
import { EventTimeline } from "~/components/discovery/event-timeline";
import { RunHistory } from "~/components/discovery/run-history";
import { ErrorState } from "~/components/common/states";
import { PageBody, PageHeader, PageTransition } from "~/components/layout/page";
import { Skeleton } from "~/components/ui/skeleton";
import { useDiscoveryStream } from "~/hooks/use-discovery-stream";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import {
	useCancelDiscoveryRun,
	useDeleteDiscoveryRun,
	useDiscoveryRunEvents,
	useDiscoveryRuns,
} from "~/lib/api/discovery";
import type { DiscoveryEvent, DiscoveryRun } from "~/lib/api/types/discovery";

export default function DiscoveryActivityPage() {
	const [selectedRunId, setSelectedRunId] = useState<string>();
	const [liveEvents, setLiveEvents] = useState<DiscoveryEvent[]>([]);
	const [liveRuns, setLiveRuns] = useState<Record<string, DiscoveryRun>>({});
	const [autoFollow, setAutoFollow] = useState(true);
	const [now, setNow] = useState(() => Date.now());
	const runsQuery = useDiscoveryRuns(50);
	const runs = (runsQuery.data ?? []).map((run) => liveRuns[run.id] ?? run);
	const activeRun = runs.find((run) => run.status === "running");
	const effectiveRunId = selectedRunId ?? activeRun?.id ?? runs[0]?.id;
	const eventsQuery = useDiscoveryRunEvents(effectiveRunId);
	const cancelRun = useCancelDiscoveryRun();
	const deleteRun = useDeleteDiscoveryRun();
	const showSkeleton = useDelayedFlag(runsQuery.isLoading);

	const handleEvent = useCallback((event: DiscoveryEvent) => {
		setLiveEvents((events) =>
			[event, ...events.filter((item) => item.id !== event.id)].slice(0, 300)
		);
	}, []);
	const handleRunStatus = useCallback((run: DiscoveryRun) => {
		setLiveRuns((runs) => ({ ...runs, [run.id]: run }));
	}, []);
	const isConnected = useDiscoveryStream({ onEvent: handleEvent, onRunStatus: handleRunStatus });

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1_000);
		return () => clearInterval(timer);
	}, []);

	const persistedEvents = useMemo(() => eventsQuery.data?.pages.flat() ?? [], [eventsQuery.data]);
	const events = useMemo(() => {
		const relevantLive = liveEvents.filter((event) => event.runId === effectiveRunId);
		const byId = new Map(
			[...relevantLive, ...persistedEvents].map((event) => [event.id, event])
		);
		return [...byId.values()].sort((left, right) => right.id - left.id);
	}, [effectiveRunId, liveEvents, persistedEvents]);

	function cancelActiveRun() {
		if (!activeRun) return;
		cancelRun.mutate(activeRun.id, {
			onSuccess: () => toast.success("Discovery run cancelled"),
		});
	}

	function deleteHistoryRun(id: string) {
		deleteRun.mutate(id, {
			onSuccess: () => {
				setSelectedRunId(undefined);
				toast.success("Discovery run deleted");
			},
		});
	}

	return (
		<>
			<PageHeader
				title="Discovery activity"
				description="Live searches and past discovery runs."
			/>
			<PageTransition>
				<PageBody className="max-w-7xl space-y-6">
					{showSkeleton && <Skeleton className="h-40 rounded-xl" />}
					{runsQuery.isError && (
						<ErrorState
							error={runsQuery.error}
							onRetry={() => runsQuery.refetch()}
							title="Couldn't load discovery activity"
						/>
					)}
					{activeRun && (
						<CurrentRunBanner
							run={activeRun}
							now={now}
							isConnected={isConnected}
							isCancelling={cancelRun.isPending}
							onCancel={cancelActiveRun}
						/>
					)}
					{!runsQuery.isError && (
						<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
							<EventTimeline
								events={events}
								now={now}
								autoFollow={autoFollow}
								onAutoFollowChange={setAutoFollow}
								hasMore={eventsQuery.hasNextPage}
								isLoadingMore={eventsQuery.isFetchingNextPage}
								onLoadMore={() => eventsQuery.fetchNextPage()}
							/>
							<RunHistory
								runs={runs}
								selectedId={effectiveRunId}
								now={now}
								onSelect={setSelectedRunId}
								onDelete={deleteHistoryRun}
							/>
						</div>
					)}
				</PageBody>
			</PageTransition>
		</>
	);
}
