import { BriefcaseBusiness, Clock3, Languages, MapPin, Radio, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import type { DiscoveredVacancyDetail } from "~/lib/api/types/discovery";
import { formatRelativeDate } from "~/lib/format";

import { companyMonogram, findSeniority, formatEmployment, platformLabel } from "./format";
import { ScoreBadge } from "./score-badge";
import { VacancySalary } from "./salary";

export function VacancyDetailHeader({ vacancy }: { vacancy: DiscoveredVacancyDetail }) {
	const seniority = findSeniority(vacancy.tags);
	const facts = [
		vacancy.location ? { icon: MapPin, label: vacancy.location } : null,
		vacancy.remote ? { icon: Radio, label: "Remote" } : null,
		vacancy.employment
			? { icon: BriefcaseBusiness, label: formatEmployment(vacancy.employment) }
			: null,
		vacancy.experienceYears ? { icon: Clock3, label: vacancy.experienceYears } : null,
		vacancy.englishLevel ? { icon: Languages, label: vacancy.englishLevel } : null,
		seniority ? { icon: Users, label: seniority } : null,
	].filter((fact) => fact !== null);

	return (
		<div className="space-y-6 rounded-2xl border bg-card p-5 md:p-7">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
				<Avatar className="size-16 rounded-xl" size="lg">
					{vacancy.companyLogoUrl && (
						<AvatarImage
							src={vacancy.companyLogoUrl}
							alt={`${vacancy.company} logo`}
							className="rounded-xl"
						/>
					)}
					<AvatarFallback className="rounded-xl text-xl font-semibold">
						{companyMonogram(vacancy.company)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="text-muted-foreground text-sm font-medium">
						{vacancy.company || "Company not specified"}
					</p>
					<h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
						{vacancy.title}
					</h1>
					<VacancySalary vacancy={vacancy} prominent className="mt-3" />
				</div>
				<ScoreBadge score={vacancy.score} />
			</div>

			{facts.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{facts.map(({ icon: Icon, label }) => (
						<Badge key={label} variant="secondary" className="gap-1.5">
							<Icon />
							{label}
						</Badge>
					))}
				</div>
			)}

			{vacancy.tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{vacancy.tags.map((tag) => (
						<Badge key={tag} variant="outline">
							{tag}
						</Badge>
					))}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-2 text-xs">
				<Badge>{platformLabel(vacancy.platform)}</Badge>
				<Badge variant={vacancy.status === "dismissed" ? "destructive" : "secondary"}>
					{vacancy.status}
				</Badge>
				<span className="text-muted-foreground">
					{vacancy.postedAt
						? `Posted ${formatRelativeDate(vacancy.postedAt)}`
						: `Found ${formatRelativeDate(vacancy.createdAt)}`}
				</span>
			</div>

			{vacancy.verdict && (
				<div className="rounded-xl border border-foreground/10 bg-muted/50 p-4">
					<p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
						AI verdict
					</p>
					<p className="text-sm leading-relaxed">{vacancy.verdict}</p>
				</div>
			)}
			{vacancy.status === "dismissed" && vacancy.dismissReason && (
				<p className="text-muted-foreground text-sm">
					Dismissed because: {vacancy.dismissReason}
				</p>
			)}
		</div>
	);
}
