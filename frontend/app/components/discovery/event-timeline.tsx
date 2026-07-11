import {
	Bell,
	BrainCircuit,
	CheckCircle2,
	ChevronDown,
	CircleDot,
	FileSearch,
	Gauge,
	Globe2,
	Search,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import type { DiscoveryEvent } from "~/lib/api/types/discovery";
import { cn } from "~/lib/utils";

import { formatEventTime } from "./activity-format";

const KIND_ICONS = {
	request: Globe2,
	parse: FileSearch,
	score: Gauge,
	ai: BrainCircuit,
	decision: CheckCircle2,
	notify: Bell,
	search: Search,
} as const;

const KINDS = ["search", "request", "parse", "ai", "score", "decision", "notify"] as const;
const LEVELS = ["info", "warning", "error"] as const;

interface EventTimelineProps {
	events: DiscoveryEvent[];
	now: number;
	autoFollow: boolean;
	onAutoFollowChange: (value: boolean) => void;
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
}

export function EventTimeline({
	events,
	now,
	autoFollow,
	onAutoFollowChange,
	hasMore,
	isLoadingMore,
	onLoadMore,
}: EventTimelineProps) {
	const [kind, setKind] = useState<string>("all");
	const [level, setLevel] = useState<string>("all");
	const topRef = useRef<HTMLDivElement>(null);
	const filtered = events.filter(
		(event) =>
			(kind === "all" || event.kind === kind) && (level === "all" || event.level === level)
	);

	useEffect(() => {
		if (autoFollow && events[0]) topRef.current?.scrollIntoView({ block: "nearest" });
	}, [autoFollow, events]);

	return (
		<section className="space-y-3">
			<div ref={topRef} />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-heading text-base font-medium">Timeline</h2>
					<p className="text-sm text-muted-foreground">Newest events appear first.</p>
				</div>
				<label className="flex items-center gap-2 text-sm">
					<Switch checked={autoFollow} onCheckedChange={onAutoFollowChange} size="sm" />
					Auto-follow
				</label>
			</div>
			<div className="flex flex-wrap gap-2">
				<FilterChip
					label="All kinds"
					active={kind === "all"}
					onClick={() => setKind("all")}
				/>
				{KINDS.map((value) => (
					<FilterChip
						key={value}
						label={value}
						active={kind === value}
						onClick={() => setKind(value)}
					/>
				))}
				<span className="mx-1 hidden h-7 w-px bg-border sm:block" />
				<FilterChip
					label="All levels"
					active={level === "all"}
					onClick={() => setLevel("all")}
				/>
				{LEVELS.map((value) => (
					<FilterChip
						key={value}
						label={value}
						active={level === value}
						onClick={() => setLevel(value)}
					/>
				))}
			</div>

			<div className="overflow-hidden rounded-xl border bg-card">
				{filtered.length === 0 ? (
					<div className="p-8 text-center text-sm text-muted-foreground">
						No events match these filters.
					</div>
				) : (
					filtered.map((event) => <EventRow key={event.id} event={event} now={now} />)
				)}
				{hasMore && (
					<div className="border-t p-3 text-center">
						<Button
							variant="ghost"
							size="sm"
							onClick={onLoadMore}
							disabled={isLoadingMore}
						>
							<ChevronDown />
							{isLoadingMore ? "Loading..." : "Load older events"}
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}

function EventRow({ event, now }: { event: DiscoveryEvent; now: number }) {
	const [expanded, setExpanded] = useState(false);
	const Icon =
		event.level === "error"
			? TriangleAlert
			: (KIND_ICONS[event.kind as keyof typeof KIND_ICONS] ?? CircleDot);
	const hasData = Object.keys(event.data).length > 0;

	return (
		<button
			type="button"
			onClick={() => hasData && setExpanded((value) => !value)}
			className={cn(
				"block w-full border-b px-4 py-3 text-left last:border-b-0",
				hasData && "transition-colors hover:bg-muted/40"
			)}
		>
			<div className="flex gap-3">
				<div
					className={cn(
						"mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted",
						event.level === "error" && "bg-destructive/10 text-destructive",
						event.level === "warning" &&
							"bg-amber-500/10 text-amber-700 dark:text-amber-400"
					)}
				>
					<Icon className="size-3.5" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<p className="text-sm leading-5">{event.message}</p>
						<span className="shrink-0 text-xs text-muted-foreground">
							{formatEventTime(event.ts, now)}
						</span>
					</div>
					<div className="mt-1 flex items-center gap-1.5">
						<Badge variant="outline" className="capitalize">
							{event.kind}
						</Badge>
						{event.level !== "info" && (
							<Badge variant={event.level === "error" ? "destructive" : "secondary"}>
								{event.level}
							</Badge>
						)}
					</div>
					{expanded && (
						<pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
							{JSON.stringify(event.data, null, 2)}
						</pre>
					)}
				</div>
			</div>
		</button>
	);
}

function FilterChip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={active ? "secondary" : "ghost"}
			size="sm"
			className="h-7 capitalize"
			onClick={onClick}
		>
			{label}
		</Button>
	);
}
