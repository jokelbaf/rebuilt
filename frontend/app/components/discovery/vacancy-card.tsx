import { Building2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardAction, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import type { DiscoveredVacancy } from "~/lib/api/types/discovery";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

import { companyMonogram, formatEmployment, platformLabel } from "./format";
import { ScoreBadge } from "./score-badge";
import { VacancySalary } from "./salary";
import { VacancyActions } from "./vacancy-actions";

interface DiscoveredVacancyCardProps {
	vacancy: DiscoveredVacancy;
	onApprove: () => void;
	onDismiss: (reason: string) => void;
	onRestore: () => void;
	isPending: boolean;
}

export function DiscoveredVacancyCard({
	vacancy,
	onApprove,
	onDismiss,
	onRestore,
	isPending,
}: DiscoveredVacancyCardProps) {
	return (
		<motion.div variants={listItem} layout>
			<Card className="h-full transition-shadow hover:shadow-md">
				<CardHeader className="grid-cols-[auto_1fr_auto] items-start gap-x-3">
					<Avatar size="lg" className="row-span-2">
						{vacancy.companyLogoUrl && (
							<AvatarImage
								src={vacancy.companyLogoUrl}
								alt={`${vacancy.company} logo`}
							/>
						)}
						<AvatarFallback>{companyMonogram(vacancy.company)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<Link
							to={`/discovery/vacancies/${vacancy.id}`}
							className="line-clamp-2 font-medium hover:underline"
						>
							{vacancy.title}
						</Link>
						<p className="text-muted-foreground mt-0.5 truncate text-xs">
							{vacancy.company || "Company not specified"}
						</p>
					</div>
					<CardAction>
						<ScoreBadge score={vacancy.score} compact />
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-1 flex-col gap-3">
					<VacancySalary vacancy={vacancy} />
					<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						{vacancy.location && (
							<span className="flex items-center gap-1">
								<MapPin className="size-3" />
								{vacancy.location}
							</span>
						)}
						{vacancy.remote && <Badge variant="secondary">Remote</Badge>}
						{vacancy.employment && (
							<span className="flex items-center gap-1">
								<Building2 className="size-3" />
								{formatEmployment(vacancy.employment)}
							</span>
						)}
					</div>
					{vacancy.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{vacancy.tags.slice(0, 6).map((tag) => (
								<Badge key={tag} variant="outline">
									{tag}
								</Badge>
							))}
							{vacancy.tags.length > 6 && (
								<Badge variant="ghost">+{vacancy.tags.length - 6}</Badge>
							)}
						</div>
					)}
					{vacancy.verdict && (
						<p className="text-muted-foreground line-clamp-2 border-l-2 pl-2 text-xs italic">
							{vacancy.verdict}
						</p>
					)}
				</CardContent>
				<CardFooter className="group/actions min-h-14 justify-between gap-3">
					<div className="text-muted-foreground min-w-0 text-xs">
						<p className="font-medium">{platformLabel(vacancy.platform)}</p>
						<p>
							{vacancy.postedAt
								? `Posted ${formatRelativeDate(vacancy.postedAt)}`
								: `Found ${formatRelativeDate(vacancy.createdAt)}`}
						</p>
					</div>
					<VacancyActions
						vacancy={vacancy}
						onApprove={onApprove}
						onDismiss={onDismiss}
						onRestore={onRestore}
						isPending={isPending}
						className="justify-end opacity-100 transition-opacity md:opacity-0 md:group-hover/card:opacity-100 md:group-focus-within/card:opacity-100"
					/>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
