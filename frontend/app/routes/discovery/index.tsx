import { useQueryClient } from "@tanstack/react-query";
import { Radar, Search, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { InboxToolbar } from "~/components/discovery/inbox-toolbar";
import { DiscoveredVacancyCard } from "~/components/discovery/vacancy-card";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader, PageTransition } from "~/components/layout/page";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import {
	useApproveVacancy,
	useDiscoveredVacancies,
	useDiscoveryRuns,
	useDismissVacancy,
	usePlatformAccounts,
	useRestoreVacancy,
	useStartDiscoveryRun,
} from "~/lib/api/discovery";
import { queryKeys } from "~/lib/api/query-keys";
import type { DiscoveryPlatform, DiscoveryVacancyStatus } from "~/lib/api/types/discovery";
import { listContainer } from "~/lib/motion";

const EMPTY_COPY: Record<DiscoveryVacancyStatus, { title: string; description: string }> = {
	new: {
		title: "Your inbox is clear",
		description: "Run discovery to find vacancies matched to your profile and experience.",
	},
	approved: {
		title: "No approved discoveries",
		description: "Vacancies you approve will appear here and in your vacancy library.",
	},
	dismissed: {
		title: "No dismissed vacancies",
		description:
			"Dismissed results stay out of future discovery runs and can be restored here.",
	},
};

export default function DiscoveryInboxPage() {
	const navigate = useNavigate();
	const [status, setStatus] = useState<DiscoveryVacancyStatus>("new");
	const [platform, setPlatform] = useState<DiscoveryPlatform | "all">("all");
	const [minScore, setMinScore] = useState(0);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const filters = {
		status,
		platform: platform === "all" ? undefined : platform,
		minScore: minScore || undefined,
		q: debouncedSearch || undefined,
	};
	const { data, isLoading, isError, error, refetch } = useDiscoveredVacancies(filters);
	const { data: accounts } = usePlatformAccounts();
	const { data: runs } = useDiscoveryRuns(10);
	const startRun = useStartDiscoveryRun();
	const approve = useApproveVacancy();
	const dismiss = useDismissVacancy();
	const restore = useRestoreVacancy();
	const queryClient = useQueryClient();
	const vacancies = data ?? [];
	const showSkeleton = useDelayedFlag(isLoading);
	const isRunActive = runs?.some((run) => run.status === "running") ?? false;
	const configuredPlatforms = new Set(
		accounts?.filter((account) => account.status === "ok").map((account) => account.platform)
	);
	const needsAccountSetup = accounts !== undefined && configuredPlatforms.size < 2;
	const isDecisionPending = approve.isPending || dismiss.isPending || restore.isPending;

	const wasRunActive = useRef(false);
	useEffect(() => {
		if (wasRunActive.current && !isRunActive) {
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.vacancies.all });
			const finished = runs?.[0];
			if (finished?.error)
				toast.warning("Discovery run finished with issues", {
					description: finished.error,
				});
		}
		wasRunActive.current = isRunActive;
	}, [isRunActive, runs, queryClient]);

	function approveVacancy(id: string) {
		approve.mutate(id, {
			onSuccess: ({ vacancyId }) =>
				toast.success("Vacancy approved", {
					action: {
						label: "Open",
						onClick: () => navigate(`/vacancies/${vacancyId}/edit`),
					},
				}),
		});
	}

	function startDiscovery() {
		startRun.mutate(undefined, { onSuccess: () => toast.success("Discovery search started") });
	}

	return (
		<>
			<PageHeader
				title="Found vacancies"
				description="AI-ranked vacancies waiting for your review."
				actions={
					<Button onClick={startDiscovery} disabled={isRunActive || startRun.isPending}>
						<Search />
						{isRunActive ? "Searching..." : "Search now"}
					</Button>
				}
			/>
			<PageTransition>
				<PageBody className="max-w-7xl space-y-4">
					{needsAccountSetup && (
						<Alert>
							<Settings2 />
							<AlertTitle>Finish discovery setup</AlertTitle>
							<AlertDescription>
								Connect and verify both job-board accounts to search every platform.
							</AlertDescription>
							<AlertAction>
								<Button asChild variant="outline" size="sm">
									<Link to="/discovery/settings">Set up</Link>
								</Button>
							</AlertAction>
						</Alert>
					)}

					<InboxToolbar
						status={status}
						onStatusChange={setStatus}
						platform={platform}
						onPlatformChange={setPlatform}
						minScore={minScore}
						onMinScoreChange={setMinScore}
						search={search}
						onSearchChange={setSearch}
					/>

					{showSkeleton && <CardSkeletonGrid />}
					{isError && (
						<ErrorState
							error={error}
							onRetry={() => refetch()}
							title="Couldn't load discovered vacancies"
						/>
					)}
					{!isLoading && !isError && vacancies.length === 0 && (
						<EmptyState
							icon={
								debouncedSearch || platform !== "all" || minScore > 0
									? Radar
									: Search
							}
							title={
								debouncedSearch ? "No matching vacancies" : EMPTY_COPY[status].title
							}
							description={
								debouncedSearch
									? "Try a different title, company, platform, or score filter."
									: EMPTY_COPY[status].description
							}
						/>
					)}

					{vacancies.length > 0 && (
						<motion.div
							variants={listContainer}
							initial="hidden"
							animate="visible"
							className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
						>
							{vacancies.map((vacancy) => (
								<DiscoveredVacancyCard
									key={vacancy.id}
									vacancy={vacancy}
									onApprove={() => approveVacancy(vacancy.id)}
									onDismiss={(reason) =>
										dismiss.mutate(
											{ id: vacancy.id, reason },
											{ onSuccess: () => toast.success("Vacancy dismissed") }
										)
									}
									onRestore={() =>
										restore.mutate(vacancy.id, {
											onSuccess: () => toast.success("Vacancy restored"),
										})
									}
									isPending={isDecisionPending}
								/>
							))}
						</motion.div>
					)}
				</PageBody>
			</PageTransition>
		</>
	);
}
