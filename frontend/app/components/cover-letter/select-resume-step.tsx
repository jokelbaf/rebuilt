import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";

import { BuilderSelection } from "~/components/builder/builder-selection";
import { SelectableCard } from "~/components/builder/selectable-card";
import { EmptyState } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useResumes } from "~/lib/api/resume";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

const MAX_RESULTS = 6;

interface SelectResumeStepProps {
	value?: string;
	onChange: (id: string) => void;
}

export function SelectResumeStep({ value, onChange }: SelectResumeStepProps) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const { data, isLoading, isError, error, refetch } = useResumes(debouncedSearch);

	const resumes = data ?? [];
	const shown = resumes.slice(0, MAX_RESULTS);

	return (
		<BuilderSelection
			isLoading={isLoading}
			isError={isError}
			error={error}
			onRetry={() => refetch()}
			isEmpty={resumes.length === 0}
			search={search}
			onSearchChange={setSearch}
			searchPlaceholder="Search resumes..."
			isSearching={debouncedSearch.trim().length > 0}
			hiddenCount={resumes.length - shown.length}
			emptyState={
				<EmptyState
					icon={FileText}
					title="No resumes yet"
					description="Generate a resume before creating a cover letter."
					action={
						<Button asChild variant="outline">
							<Link to="/resume">Build a resume</Link>
						</Button>
					}
				/>
			}
		>
			{shown.map((resume) => (
				<motion.div key={resume.id} variants={listItem}>
					<SelectableCard
						selected={value === resume.id}
						onSelect={() => onChange(resume.id)}
						className="w-full"
					>
						<div className="flex items-center justify-between gap-2 pr-6">
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">{resume.name}</p>
								<p className="text-muted-foreground text-xs">
									Updated {formatRelativeDate(resume.updatedAt)}
								</p>
							</div>
							<Badge variant="secondary" className="uppercase">
								{resume.language}
							</Badge>
						</div>
					</SelectableCard>
				</motion.div>
			))}
		</BuilderSelection>
	);
}
