import { CheckCircle2, CircleX, LoaderCircle, OctagonX } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDelete } from "~/components/common/confirm-delete";
import type { DiscoveryRun } from "~/lib/api/types/discovery";
import { formatDateTime } from "~/lib/format";
import { cn } from "~/lib/utils";

import { formatDuration, totalRunStats } from "./activity-format";

interface RunHistoryProps {
	runs: DiscoveryRun[];
	selectedId: string | undefined;
	now: number;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
}

const STATUS_ICONS = {
	running: LoaderCircle,
	completed: CheckCircle2,
	failed: CircleX,
	cancelled: OctagonX,
} as const;

export function RunHistory({ runs, selectedId, now, onSelect, onDelete }: RunHistoryProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Run history</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{runs.length === 0 && (
					<p className="py-6 text-center text-sm text-muted-foreground">
						No discovery runs yet.
					</p>
				)}
				{runs.map((run) => {
					const Icon = STATUS_ICONS[run.status];
					const stats = totalRunStats(run);
					return (
						<div
							key={run.id}
							className={cn(
								"flex items-center rounded-lg border transition-colors hover:bg-muted/50",
								selectedId === run.id && "border-primary/40 bg-primary/5"
							)}
						>
							<button
								type="button"
								onClick={() => onSelect(run.id)}
								className="min-w-0 flex-1 px-3 py-3 text-left"
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex min-w-0 items-center gap-2">
										<Icon
											className={cn(
												"size-4 shrink-0",
												run.status === "running" &&
													"animate-spin text-primary",
												run.status === "failed" && "text-destructive"
											)}
										/>
										<span className="truncate font-medium capitalize">
											{run.trigger} run
										</span>
									</div>
									<Badge variant="outline" className="capitalize">
										{run.status}
									</Badge>
								</div>
								<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<span>{formatDateTime(run.startedAt)}</span>
									<span>
										{formatDuration(run.startedAt, run.finishedAt, now)}
									</span>
									<span>{stats.found} found</span>
									<span>{stats.new} new</span>
									<span>{stats.scored} scored</span>
								</div>
								{run.error && (
									<p className="mt-2 line-clamp-2 text-xs text-destructive">
										{run.error}
									</p>
								)}
							</button>
							{run.status !== "running" && (
								<div className="pr-2">
									<ConfirmDelete
										onConfirm={() => onDelete(run.id)}
										title="Delete this discovery run?"
										description="This removes the run and its activity events. Discovered vacancies are kept."
									/>
								</div>
							)}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
