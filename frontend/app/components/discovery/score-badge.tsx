import { Sparkles } from "lucide-react";

import { cn } from "~/lib/utils";

export function ScoreBadge({
	score,
	compact = false,
}: {
	score: number | null;
	compact?: boolean;
}) {
	const color =
		score === null
			? "border-muted-foreground/30 text-muted-foreground"
			: score >= 75
				? "border-emerald-500/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
				: score >= 50
					? "border-amber-500/70 bg-amber-500/10 text-amber-700 dark:text-amber-300"
					: "border-muted-foreground/30 bg-muted text-muted-foreground";

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full border-2 font-semibold tabular-nums",
				compact ? "size-10 text-xs" : "size-16 text-base",
				color
			)}
			title={score === null ? "Not scored" : `AI fit score: ${score} out of 100`}
		>
			{score === null ? <Sparkles className={compact ? "size-4" : "size-5"} /> : score}
		</div>
	);
}
