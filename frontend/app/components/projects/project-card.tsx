import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

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
import type { ProjectSummary } from "~/lib/api/types/projects";
import { listItem } from "~/lib/motion";

interface ProjectCardProps {
	project: ProjectSummary;
	onDelete: () => void;
}

const MAX_TECH = 6;

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
	const visibleTech = project.tech.slice(0, MAX_TECH);
	const hiddenCount = project.tech.length - visibleTech.length;

	return (
		<motion.div variants={listItem} layout>
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="text-base leading-snug">{project.title}</CardTitle>
					<CardAction>
						<Badge variant="secondary" className="capitalize">
							{project.level}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="flex-1">
					{project.tech.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{visibleTech.map((tech) => (
								<Badge key={tech} variant="outline" className="font-normal">
									{tech}
								</Badge>
							))}
							{hiddenCount > 0 && (
								<Badge variant="outline" className="font-normal">
									+{hiddenCount}
								</Badge>
							)}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">No tech listed.</p>
					)}
				</CardContent>
				<CardFooter className="gap-2">
					<Button asChild variant="outline" size="sm" className="flex-1">
						<Link to={`/projects/${project.id}/edit`}>
							<Pencil className="size-4" />
							Edit
						</Link>
					</Button>
					<ConfirmDelete
						onConfirm={onDelete}
						title="Delete project?"
						description={`"${project.title}" will be permanently removed.`}
					/>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
