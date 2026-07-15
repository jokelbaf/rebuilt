import { Gauge, RefreshCw } from "lucide-react";

import { ErrorState } from "~/components/common/states";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import { useAiUsage } from "~/lib/api/settings";
import type { AiUsageWindow } from "~/lib/api/types/settings";
import { formatDateTime } from "~/lib/format";

interface UsageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function UsageWindowCard({ label, window }: { label: string; window: AiUsageWindow | null }) {
	const value = window?.usedPercent;

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-baseline justify-between gap-3">
				<p className="font-medium">{label}</p>
				<p className="text-2xl font-semibold tabular-nums">
					{value === undefined ? "-" : `${value}%`}
				</p>
			</div>
			<Progress value={value ?? 0} className="h-2" />
			<p className="text-muted-foreground text-xs">
				{window?.resetsAt
					? `Resets ${formatDateTime(window.resetsAt)}`
					: "This usage window is not reported for the current account."}
			</p>
		</div>
	);
}

function UsageSkeleton() {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<Skeleton className="h-28 rounded-lg" />
			<Skeleton className="h-28 rounded-lg" />
		</div>
	);
}

export function UsageDialog({ open, onOpenChange }: UsageDialogProps) {
	const usage = useAiUsage(open);
	const showLoading = useDelayedFlag(open && usage.isLoading);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<Gauge className="text-primary size-5" />
						<DialogTitle>Usage</DialogTitle>
					</div>
					<DialogDescription>
						Current quota usage for the selected AI backend.
					</DialogDescription>
				</DialogHeader>

				{showLoading && <UsageSkeleton />}
				{usage.isError && (
					<ErrorState
						error={usage.error}
						onRetry={() => usage.refetch()}
						title="Couldn't load usage"
					/>
				)}
				{usage.data && !usage.isError && (
					<div className="space-y-4">
						<div className="flex items-center justify-between gap-3">
							<p className="text-muted-foreground text-sm">
								Backend:{" "}
								<span className="text-foreground">{usage.data.providerLabel}</span>
							</p>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => usage.refetch()}
								disabled={usage.isFetching}
								aria-label="Refresh usage"
							>
								<RefreshCw
									className={usage.isFetching ? "animate-spin" : undefined}
								/>
							</Button>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<UsageWindowCard label="5-hour usage" window={usage.data.fiveHour} />
							<UsageWindowCard label="Weekly usage" window={usage.data.weekly} />
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
