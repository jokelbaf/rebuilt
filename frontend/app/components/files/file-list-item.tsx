import { FileText, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { Button } from "~/components/ui/button";
import type { MarkdownFileSummary } from "~/lib/api/types/files";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

interface FileListItemProps {
	file: MarkdownFileSummary;
	basePath: string;
	onDelete: () => void;
}

export function FileListItem({ file, basePath, onDelete }: FileListItemProps) {
	return (
		<motion.li
			variants={listItem}
			layout
			className="flex items-center gap-3 rounded-lg border p-3"
		>
			<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
				<FileText className="size-4" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{file.name}</p>
				{file.excerpt ? (
					<p className="text-muted-foreground line-clamp-1 text-xs">{file.excerpt}</p>
				) : (
					<p className="text-muted-foreground text-xs">
						Updated {formatRelativeDate(file.updatedAt)}
					</p>
				)}
			</div>
			<Button asChild variant="ghost" size="icon" className="size-8">
				<Link to={`${basePath}/${file.name}/edit`}>
					<Pencil className="size-4" />
					<span className="sr-only">Edit {file.name}</span>
				</Link>
			</Button>
			<ConfirmDelete
				onConfirm={onDelete}
				title="Delete file?"
				description={`"${file.name}" will be permanently removed.`}
			/>
		</motion.li>
	);
}
