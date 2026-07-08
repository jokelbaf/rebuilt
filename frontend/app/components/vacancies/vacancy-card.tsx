import { ExternalLink, Pencil } from "lucide-react";
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
import type { Vacancy } from "~/lib/api/types/vacancies";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

interface VacancyCardProps {
	vacancy: Vacancy;
	onDelete: () => void;
}

export function VacancyCard({ vacancy, onDelete }: VacancyCardProps) {
	return (
		<motion.div variants={listItem} layout>
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="text-base leading-snug">{vacancy.title}</CardTitle>
					<CardAction>
						<Badge variant="secondary" className="uppercase">
							{vacancy.language}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="flex-1">
					<p className="text-muted-foreground line-clamp-3 text-sm whitespace-pre-line">
						{vacancy.description}
					</p>
				</CardContent>
				<CardFooter className="justify-between gap-2">
					<span className="text-muted-foreground text-xs">
						Added {formatRelativeDate(vacancy.createdAt)}
					</span>
					<div className="flex items-center gap-1">
						{vacancy.source && (
							<Button
								asChild
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground size-8"
							>
								<a
									href={vacancy.source}
									target="_blank"
									rel="noopener noreferrer"
									aria-label="Open job posting"
								>
									<ExternalLink className="size-4" />
								</a>
							</Button>
						)}
						<Button
							asChild
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground size-8"
						>
							<Link to={`/vacancies/${vacancy.id}/edit`} aria-label="Edit vacancy">
								<Pencil className="size-4" />
							</Link>
						</Button>
						<ConfirmDelete
							onConfirm={onDelete}
							title="Delete vacancy?"
							description={`"${vacancy.title}" will be permanently removed.`}
						/>
					</div>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
