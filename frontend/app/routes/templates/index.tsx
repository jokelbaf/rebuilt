import { LayoutTemplate, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader } from "~/components/layout/page";
import { TemplateCard } from "~/components/templates/template-card";
import { Button } from "~/components/ui/button";
import { useDeleteTemplate, useTemplates } from "~/lib/api/templates";
import { listContainer } from "~/lib/motion";

export default function TemplatesPage() {
	const [search, setSearch] = useState("");
	const { data, isLoading, isError, error, refetch } = useTemplates();
	const deleteTemplate = useDeleteTemplate();

	const templates = data ?? [];
	const filtered = useMemo(() => {
		const items = data ?? [];
		const query = search.trim().toLowerCase();
		if (!query) return items;
		return items.filter((template) => template.name.toLowerCase().includes(query));
	}, [data, search]);

	function handleDelete(name: string) {
		deleteTemplate.mutate(name, { onSuccess: () => toast.success("Template deleted") });
	}

	return (
		<>
			<PageHeader
				title="Templates"
				description="HTML templates used to render resumes and cover letters."
				actions={
					<Button asChild>
						<Link to="/templates/new">
							<Plus className="size-4" />
							Add Template
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-5">
				{templates.length > 0 && (
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search templates..."
						className="max-w-sm"
					/>
				)}

				{isLoading && <CardSkeletonGrid />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load templates"
					/>
				)}

				{!isLoading && !isError && templates.length === 0 && (
					<EmptyState
						icon={LayoutTemplate}
						title="No templates yet"
						description="Create an HTML template to render your documents."
						action={
							<Button asChild>
								<Link to="/templates/new">
									<Plus className="size-4" />
									Add Template
								</Link>
							</Button>
						}
					/>
				)}

				{!isLoading && !isError && templates.length > 0 && filtered.length === 0 && (
					<EmptyState
						icon={LayoutTemplate}
						title="No matches"
						description="No templates match your search."
					/>
				)}

				{filtered.length > 0 && (
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					>
						{filtered.map((template) => (
							<TemplateCard
								key={template.name}
								template={template}
								onDelete={() => handleDelete(template.name)}
							/>
						))}
					</motion.div>
				)}
			</PageBody>
		</>
	);
}
