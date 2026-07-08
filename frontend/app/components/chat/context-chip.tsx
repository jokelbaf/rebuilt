import { X } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import type { ChatContextRef } from "~/lib/api/types/chat";

import { contextTypeMeta } from "./context-meta";

interface ContextChipProps {
	reference: ChatContextRef;
	onRemove?: () => void;
}

export function ContextChip({ reference, onRemove }: ContextChipProps) {
	const { icon: Icon, label } = contextTypeMeta[reference.type];

	return (
		<Badge
			variant="secondary"
			className="max-w-56 gap-1.5"
			title={`${label}: ${reference.title}`}
		>
			<Icon className="size-3 shrink-0" />
			<span className="truncate">{reference.title || reference.id}</span>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					className="hover:text-destructive -mr-0.5 shrink-0 rounded-sm transition-colors"
				>
					<X className="size-3" />
					<span className="sr-only">Remove context</span>
				</button>
			)}
		</Badge>
	);
}
