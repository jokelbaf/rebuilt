import type { DiscoveryRun } from "~/lib/api/types/discovery";
import { parseApiDate } from "~/lib/format";

export interface PlatformStats {
	requests: number;
	found: number;
	new: number;
	scored: number;
	errors: number;
}

const EMPTY_STATS: PlatformStats = { requests: 0, found: 0, new: 0, scored: 0, errors: 0 };

export function readRunStats(run: DiscoveryRun): Record<string, PlatformStats> {
	const result: Record<string, PlatformStats> = {};
	for (const [platform, value] of Object.entries(run.stats)) {
		if (!value || typeof value !== "object" || Array.isArray(value)) continue;
		const record = value as Record<string, unknown>;
		result[platform] = {
			requests: readNumber(record.requests),
			found: readNumber(record.found),
			new: readNumber(record.new),
			scored: readNumber(record.scored),
			errors: readNumber(record.errors),
		};
	}
	return result;
}

export function totalRunStats(run: DiscoveryRun): PlatformStats {
	return Object.values(readRunStats(run)).reduce(
		(total, stats) => ({
			requests: total.requests + stats.requests,
			found: total.found + stats.found,
			new: total.new + stats.new,
			scored: total.scored + stats.scored,
			errors: total.errors + stats.errors,
		}),
		EMPTY_STATS
	);
}

export function formatDuration(startedAt: string, finishedAt: string | null, now = Date.now()) {
	const start = parseApiDate(startedAt).getTime();
	const end = finishedAt ? parseApiDate(finishedAt).getTime() : now;
	if (!Number.isFinite(start) || !Number.isFinite(end)) return "-";
	const seconds = Math.max(0, Math.floor((end - start) / 1_000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	if (minutes < 60) return `${minutes}m ${remainder}s`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function formatEventTime(value: string, now = Date.now()) {
	const timestamp = parseApiDate(value).getTime();
	if (!Number.isFinite(timestamp)) return "";
	const seconds = Math.max(0, Math.floor((now - timestamp) / 1_000));
	if (seconds < 10) return "just now";
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function readNumber(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
