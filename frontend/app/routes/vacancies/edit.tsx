import { ExternalLink } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { BackLink } from "~/components/common/back-link";
import { PageBody, PageHeader } from "~/components/layout/page";
import { ErrorPage, LoadingPage } from "~/components/layout/page-status";
import { Button } from "~/components/ui/button";
import { VacancyForm } from "~/components/vacancies/vacancy-form";
import { useUpdateVacancy, useVacancy } from "~/lib/api/vacancies";

function VacancyEditForm({ id }: { id: string }) {
	const { data, isLoading, isError, error, refetch } = useVacancy(id);
	const updateVacancy = useUpdateVacancy(id);

	if (isLoading) return <LoadingPage backTo="/vacancies" title="Vacancy" />;
	if (isError || !data)
		return (
			<ErrorPage
				backTo="/vacancies"
				title="Vacancy"
				error={error}
				onRetry={() => refetch()}
			/>
		);

	return (
		<>
			<PageHeader
				title={
					<div className="flex min-w-0 items-center gap-2">
						<BackLink to="/vacancies" />
						<span className="truncate text-base font-semibold">{data.title}</span>
					</div>
				}
				actions={
					data.source && (
						<Button asChild variant="outline" size="sm">
							<a href={data.source} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="size-4" />
								Open posting
							</a>
						</Button>
					)
				}
			/>
			<PageBody className="max-w-2xl">
				<VacancyForm
					defaultValues={{
						title: data.title,
						description: data.description,
						language: data.language,
						source: data.source,
						tech: data.tech,
						keywords: data.keywords,
						roles: data.roles,
						seniority: data.seniority,
					}}
					isSubmitting={updateVacancy.isPending}
					submitLabel="Save Changes"
					onSubmit={(values) =>
						updateVacancy.mutate(values, {
							onSuccess: () => toast.success("Vacancy saved"),
						})
					}
				/>
			</PageBody>
		</>
	);
}

export default function EditVacancyPage() {
	const { id } = useParams();
	if (!id) return null;
	return <VacancyEditForm key={id} id={id} />;
}
