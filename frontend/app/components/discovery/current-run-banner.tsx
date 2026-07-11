import { LoaderCircle, OctagonX } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { DiscoveryRun } from "~/lib/api/types/discovery";

import { formatDuration, readRunStats } from "./activity-format";

interface CurrentRunBannerProps {
	run: DiscoveryRun;
	now: number;
	isConnected: boolean;
	isCancelling: boolean;
	onCancel: () => void;
}

export function CurrentRunBanner({
	run,
	now,
	isConnected,
	isCancelling,
	onCancel,
}: CurrentRunBannerProps) {
	const stats = readRunStats(run);

	return (
		<Card className="border-primary/20 bg-primary/3">
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<LoaderCircle className="size-4 animate-spin text-primary" />
						<CardTitle>Discovery is running</CardTitle>
						<Badge variant="outline" className="capitalize">
							{run.trigger}
						</Badge>
						<Badge variant={isConnected ? "secondary" : "outline"}>
							{isConnected ? "Live" : "Reconnecting"}
						</Badge>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm tabular-nums text-muted-foreground">
							{formatDuration(run.startedAt, null, now)}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={onCancel}
							disabled={isCancelling}
						>
							<OctagonX />
							{isCancelling ? "Cancelling..." : "Cancel"}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid gap-2 sm:grid-cols-2">
					{Object.entries(stats).map(([platform, values]) => (
						<div
							key={platform}
							className="rounded-lg border bg-background/70 px-3 py-2"
						>
							<div className="mb-1 font-medium capitalize">{platform}</div>
							<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
								<span>{values.requests} requests</span>
								<span>{values.found} found</span>
								<span>{values.new} new</span>
								<span>{values.scored} scored</span>
								{values.errors > 0 && (
									<span className="text-destructive">{values.errors} errors</span>
								)}
							</div>
						</div>
					))}
					{Object.keys(stats).length === 0 && (
						<p className="text-sm text-muted-foreground">Preparing search queries…</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
