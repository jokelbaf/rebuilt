import { useParams } from "react-router";
import { toast } from "sonner";

import { BackLink } from "~/components/common/back-link";
import { PageBody, PageHeader } from "~/components/layout/page";
import { ErrorPage, LoadingPage } from "~/components/layout/page-status";
import { ProjectForm } from "~/components/projects/project-form";
import { useProject, useUpdateProject } from "~/lib/api/projects";

function ProjectEditForm({ id }: { id: string }) {
	const { data, isLoading, isError, error, refetch } = useProject(id);
	const updateProject = useUpdateProject(id);

	if (isLoading) return <LoadingPage backTo="/projects" title="Project" />;
	if (isError || !data)
		return (
			<ErrorPage backTo="/projects" title="Project" error={error} onRetry={() => refetch()} />
		);

	return (
		<>
			<PageHeader
				title={
					<div className="flex items-center gap-2">
						<BackLink to="/projects" />
						<span className="text-base font-semibold">{data.title}</span>
					</div>
				}
			/>
			<PageBody className="max-w-2xl">
				<ProjectForm
					defaultValues={{
						title: data.title,
						description: data.description,
						level: data.level,
						tech: data.tech,
						roles: data.roles,
						resumeBullets: data.resumeBullets,
						keywords: data.keywords,
					}}
					isSubmitting={updateProject.isPending}
					submitLabel="Save Changes"
					onSubmit={(values) =>
						updateProject.mutate(values, {
							onSuccess: () => toast.success("Project saved"),
						})
					}
				/>
			</PageBody>
		</>
	);
}

export default function EditProjectPage() {
	const { id } = useParams();
	if (!id) return null;
	return <ProjectEditForm key={id} id={id} />;
}
