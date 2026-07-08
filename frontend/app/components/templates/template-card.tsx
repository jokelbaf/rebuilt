import { LayoutTemplate, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import type { TemplateSummary } from "~/lib/api/types/templates";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

interface TemplateCardProps {
	template: TemplateSummary;
	onDelete: () => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
	return (
		<motion.div variants={listItem} layout>
			<Card className="h-full">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
							<LayoutTemplate className="size-4" />
						</div>
						<CardTitle className="truncate text-base">{template.name}</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="flex-1">
					<p className="text-muted-foreground text-xs">
						Updated {formatRelativeDate(template.updatedAt)}
					</p>
				</CardContent>
				<CardFooter className="gap-2">
					<Button asChild variant="outline" size="sm" className="flex-1">
						<Link to={`/templates/${template.name}/edit`}>
							<Pencil className="size-4" />
							Edit
						</Link>
					</Button>
					<ConfirmDelete
						onConfirm={onDelete}
						title="Delete template?"
						description={`"${template.name}" will be permanently removed.`}
					/>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
