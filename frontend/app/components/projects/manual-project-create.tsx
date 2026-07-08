import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ProjectForm } from "~/components/projects/project-form";
import { useCreateProject } from "~/lib/api/projects";
import type { ProjectInput } from "~/lib/api/types/projects";

const EMPTY_PROJECT: ProjectInput = {
	title: "",
	description: "",
	level: "mid",
	tech: [],
	roles: [],
	resumeBullets: [],
	keywords: [],
};

export function ManualProjectCreate() {
	const navigate = useNavigate();
	const createProject = useCreateProject();

	return (
		<ProjectForm
			defaultValues={EMPTY_PROJECT}
			isSubmitting={createProject.isPending}
			submitLabel="Add Project"
			onSubmit={(values) =>
				createProject.mutate(values, {
					onSuccess: () => {
						toast.success("Project added");
						navigate("/projects");
					},
				})
			}
		/>
	);
}
