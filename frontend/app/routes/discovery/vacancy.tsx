import { FileSearch } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { BackLink } from "~/components/common/back-link";
import { EmptyState } from "~/components/common/states";
import { VacancyActions } from "~/components/discovery/vacancy-actions";
import { VacancyDescription } from "~/components/discovery/vacancy-description";
import { VacancyDetailHeader } from "~/components/discovery/vacancy-detail-header";
import { PageBody, PageHeader, PageTransition } from "~/components/layout/page";
import { ErrorPage, LoadingPage } from "~/components/layout/page-status";
import {
	useApproveVacancy,
	useDiscoveredVacancy,
	useDismissVacancy,
	useRestoreVacancy,
} from "~/lib/api/discovery";
import { formatDateTime } from "~/lib/format";

function DiscoveredVacancyDetailPage({ id }: { id: string }) {
	const navigate = useNavigate();
	const { data, isLoading, isError, error, refetch } = useDiscoveredVacancy(id);
	const approve = useApproveVacancy();
	const dismiss = useDismissVacancy();
	const restore = useRestoreVacancy();

	if (isLoading) return <LoadingPage backTo="/discovery" title="Found vacancy" />;
	if (isError || !data) {
		return (
			<ErrorPage
				backTo="/discovery"
				title="Found vacancy"
				error={error}
				onRetry={() => refetch()}
			/>
		);
	}

	const isPending = approve.isPending || dismiss.isPending || restore.isPending;
	const description = data.description || data.snippet;

	return (
		<>
			<PageHeader
				title={
					<div className="flex min-w-0 items-center gap-2">
						<BackLink to="/discovery" />
						<span className="truncate text-base font-semibold">{data.title}</span>
					</div>
				}
			/>
			<PageTransition>
				<PageBody className="max-w-4xl space-y-5 pb-24">
					<VacancyDetailHeader vacancy={data} />
					<section className="rounded-2xl border bg-card p-5 md:p-7">
						<h2 className="mb-5 text-lg font-semibold">About the role</h2>
						{description || data.descriptionHtml ? (
							<VacancyDescription html={data.descriptionHtml} text={description} />
						) : (
							<EmptyState
								icon={FileSearch}
								title="Description unavailable"
								description="Open the original posting to see the source description."
							/>
						)}
					</section>
					<p className="text-muted-foreground px-1 text-xs">
						Source ID: {data.externalId} · Discovered {formatDateTime(data.createdAt)}
					</p>
					<div className="sticky bottom-4 z-10 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
						<VacancyActions
							vacancy={data}
							detail
							isPending={isPending}
							onApprove={() =>
								approve.mutate(id, {
									onSuccess: ({ vacancyId }) =>
										toast.success("Vacancy approved", {
											action: {
												label: "Open",
												onClick: () =>
													navigate(`/vacancies/${vacancyId}/edit`),
											},
										}),
								})
							}
							onDismiss={(reason) =>
								dismiss.mutate(
									{ id, reason },
									{ onSuccess: () => toast.success("Vacancy dismissed") }
								)
							}
							onRestore={() =>
								restore.mutate(id, {
									onSuccess: () => toast.success("Vacancy restored"),
								})
							}
						/>
					</div>
				</PageBody>
			</PageTransition>
		</>
	);
}

export default function DiscoveryVacancyPage() {
	const { id } = useParams();
	if (!id) return null;
	return <DiscoveredVacancyDetailPage key={id} id={id} />;
}
