import { cn } from "~/lib/utils";

interface SplitPaneProps {
	left: React.ReactNode;
	right: React.ReactNode;
	leftLabel?: string;
	rightLabel?: string;
	className?: string;
}

function PaneLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-muted-foreground bg-muted/40 flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide uppercase">
			{children}
		</div>
	);
}

export function SplitPane({ left, right, leftLabel, rightLabel, className }: SplitPaneProps) {
	return (
		<div
			className={cn(
				"grid min-h-0 flex-1 grid-rows-2 overflow-hidden rounded-lg border lg:grid-cols-2 lg:grid-rows-1",
				className
			)}
		>
			<div className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
				{leftLabel && <PaneLabel>{leftLabel}</PaneLabel>}
				<div className="min-h-0 flex-1 overflow-auto">{left}</div>
			</div>
			<div className="flex min-h-0 flex-col">
				{rightLabel && <PaneLabel>{rightLabel}</PaneLabel>}
				<div className="min-h-0 flex-1 overflow-auto">{right}</div>
			</div>
		</div>
	);
}
