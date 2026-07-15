import { Download, Eye, Pencil, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { listItem } from "~/lib/motion";

interface DocumentCardProps {
	icon: LucideIcon;
	title: string;
	badge?: string;
	meta: string;
	onPreview: () => void;
	onEdit: () => void;
	onDownload: () => void;
	onDelete: () => void;
	deleteTitle: string;
	deleteDescription: string;
}

export function DocumentCard({
	icon: Icon,
	title,
	badge,
	meta,
	onPreview,
	onEdit,
	onDownload,
	onDelete,
	deleteTitle,
	deleteDescription,
}: DocumentCardProps) {
	return (
		<motion.div variants={listItem} layout>
			<Card className="h-full">
				<CardHeader>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
							<Icon className="size-4.5" />
						</div>
						<CardTitle className="mt-1 line-clamp-2 text-base leading-snug">
							{title}
						</CardTitle>
					</div>
					{badge && (
						<CardAction>
							<Badge variant="secondary" className="uppercase">
								{badge}
							</Badge>
						</CardAction>
					)}
				</CardHeader>
				<CardContent className="flex-1">
					<p className="text-muted-foreground text-xs">{meta}</p>
				</CardContent>
				<CardFooter className="gap-2">
					<Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
						<Eye className="size-4" />
						Preview
					</Button>
					<Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
						<Pencil className="size-4" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={onDownload}
						aria-label="Download PDF"
					>
						<Download className="size-4" />
					</Button>
					<ConfirmDelete
						onConfirm={onDelete}
						title={deleteTitle}
						description={deleteDescription}
					/>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
