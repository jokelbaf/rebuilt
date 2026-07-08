import { FileText, Image, X } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { formatFileSize } from "~/lib/format";

interface AttachmentChipProps {
	name: string;
	size: number;
	mediaType: string | null;
	onRemove?: () => void;
}

export function AttachmentChip({ name, size, mediaType, onRemove }: AttachmentChipProps) {
	const Icon = mediaType?.startsWith("image/") ? Image : FileText;

	return (
		<Badge variant="outline" className="max-w-64 gap-1.5" title={name}>
			<Icon className="size-3 shrink-0" />
			<span className="truncate">{name}</span>
			<span className="text-muted-foreground shrink-0 text-[10px]">
				{formatFileSize(size)}
			</span>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					className="hover:text-destructive -mr-0.5 shrink-0 rounded-sm transition-colors"
				>
					<X className="size-3" />
					<span className="sr-only">Remove attachment</span>
				</button>
			)}
		</Badge>
	);
}
