import { SearchInput } from "~/components/common/search-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { DiscoveryPlatform, DiscoveryVacancyStatus } from "~/lib/api/types/discovery";

interface InboxToolbarProps {
	status: DiscoveryVacancyStatus;
	onStatusChange: (status: DiscoveryVacancyStatus) => void;
	platform: DiscoveryPlatform | "all";
	onPlatformChange: (platform: DiscoveryPlatform | "all") => void;
	minScore: number;
	onMinScoreChange: (score: number) => void;
	search: string;
	onSearchChange: (search: string) => void;
}

export function InboxToolbar({
	status,
	onStatusChange,
	platform,
	onPlatformChange,
	minScore,
	onMinScoreChange,
	search,
	onSearchChange,
}: InboxToolbarProps) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
			<Tabs
				value={status}
				onValueChange={(value) => onStatusChange(value as DiscoveryVacancyStatus)}
			>
				<TabsList>
					<TabsTrigger value="new">New</TabsTrigger>
					<TabsTrigger value="approved">Approved</TabsTrigger>
					<TabsTrigger value="dismissed">Dismissed</TabsTrigger>
				</TabsList>
			</Tabs>
			<div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
				<Select
					value={platform}
					onValueChange={(value) => onPlatformChange(value as DiscoveryPlatform | "all")}
				>
					<SelectTrigger aria-label="Platform filter">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All platforms</SelectItem>
						<SelectItem value="robota">robota.ua</SelectItem>
						<SelectItem value="djinni">Djinni</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={String(minScore)}
					onValueChange={(value) => onMinScoreChange(Number(value))}
				>
					<SelectTrigger aria-label="Minimum score filter">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">Any score</SelectItem>
						<SelectItem value="50">50+ fit</SelectItem>
						<SelectItem value="75">75+ fit</SelectItem>
						<SelectItem value="90">90+ fit</SelectItem>
					</SelectContent>
				</Select>
				<SearchInput
					value={search}
					onChange={onSearchChange}
					placeholder="Search title or company..."
					className="min-w-56 flex-1 lg:max-w-xs"
				/>
			</div>
		</div>
	);
}
