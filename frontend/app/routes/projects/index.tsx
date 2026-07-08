import { FolderGit2, Plus, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader } from "~/components/layout/page";
import { ProjectCard } from "~/components/projects/project-card";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDeleteProject, useProjects } from "~/lib/api/projects";
import { listContainer } from "~/lib/motion";

export default function ProjectsPage() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const { data, isLoading, isError, error, refetch } = useProjects(debouncedSearch);
	const deleteProject = useDeleteProject();

	const projects = data ?? [];
	const isSearching = debouncedSearch.trim().length > 0;

	function handleDelete(id: string) {
		deleteProject.mutate(id, { onSuccess: () => toast.success("Project deleted") });
	}

	return (
		<>
			<PageHeader
				title="Projects"
				description="Projects used as building blocks for your resumes."
				actions={
					<Button asChild>
						<Link to="/projects/new">
							<Plus className="size-4" />
							Add Project
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-5">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search projects by name or content..."
					className="max-w-sm"
				/>

				{isLoading && <CardSkeletonGrid />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load projects"
					/>
				)}

				{!isLoading && !isError && projects.length === 0 && isSearching && (
					<EmptyState
						icon={SearchX}
						title="No matches"
						description="No projects match your search."
					/>
				)}
				{!isLoading && !isError && projects.length === 0 && !isSearching && (
					<EmptyState
						icon={FolderGit2}
						title="No projects yet"
						description="Add a project manually or import one from a git repository."
						action={
							<Button asChild>
								<Link to="/projects/new">
									<Plus className="size-4" />
									Add Project
								</Link>
							</Button>
						}
					/>
				)}

				{projects.length > 0 && (
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					>
						{projects.map((project) => (
							<ProjectCard
								key={project.id}
								project={project}
								onDelete={() => handleDelete(project.id)}
							/>
						))}
					</motion.div>
				)}
			</PageBody>
		</>
	);
}
