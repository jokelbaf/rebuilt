import { useEffect, useRef } from "react";

import type { ChatContextRef } from "~/lib/api/types/chat";
import { cn } from "~/lib/utils";

import { contextTypeMeta } from "./context-meta";

interface ContextPickerProps {
	items: ChatContextRef[];
	highlightIndex: number;
	onSelect: (item: ChatContextRef) => void;
	onHighlight: (index: number) => void;
}

export function ContextPicker({
	items,
	highlightIndex,
	onSelect,
	onHighlight,
}: ContextPickerProps) {
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const highlighted = listRef.current?.children[highlightIndex];
		highlighted?.scrollIntoView({ block: "nearest" });
	}, [highlightIndex]);

	return (
		<div className="bg-popover text-popover-foreground absolute right-0 bottom-full left-0 z-20 mb-2 overflow-hidden rounded-lg border shadow-md">
			<div className="text-muted-foreground border-b px-3 py-1.5 text-xs">
				Attach context to your message
			</div>
			<div ref={listRef} className="max-h-64 overflow-y-auto p-1">
				{items.length === 0 && (
					<div className="text-muted-foreground px-3 py-4 text-center text-xs">
						Nothing matches. Keep typing to search vacancies, projects, profile and
						experience.
					</div>
				)}
				{items.map((item, index) => {
					const { icon: Icon, label } = contextTypeMeta[item.type];
					return (
						<button
							key={`${item.type}:${item.id}`}
							type="button"
							onClick={() => onSelect(item)}
							onMouseEnter={() => onHighlight(index)}
							className={cn(
								"flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm",
								index === highlightIndex && "bg-accent text-accent-foreground"
							)}
						>
							<Icon className="text-muted-foreground size-4 shrink-0" />
							<span className="min-w-0 flex-1 truncate">{item.title}</span>
							<span className="text-muted-foreground shrink-0 text-xs">{label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
