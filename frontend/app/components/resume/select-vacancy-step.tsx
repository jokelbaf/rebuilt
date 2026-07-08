import { Megaphone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";

import { BuilderSelection } from "~/components/builder/builder-selection";
import { SelectableCard } from "~/components/builder/selectable-card";
import { EmptyState } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useVacancies } from "~/lib/api/vacancies";
import { listItem } from "~/lib/motion";

const MAX_RESULTS = 6;

interface SelectVacancyStepProps {
	value?: string;
	onChange: (id: string) => void;
}

export function SelectVacancyStep({ value, onChange }: SelectVacancyStepProps) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const { data, isLoading, isError, error, refetch } = useVacancies(debouncedSearch);

	const vacancies = data ?? [];
	const shown = vacancies.slice(0, MAX_RESULTS);

	return (
		<BuilderSelection
			isLoading={isLoading}
			isError={isError}
			error={error}
			onRetry={() => refetch()}
			isEmpty={vacancies.length === 0}
			search={search}
			onSearchChange={setSearch}
			searchPlaceholder="Search vacancies..."
			isSearching={debouncedSearch.trim().length > 0}
			hiddenCount={vacancies.length - shown.length}
			emptyState={
				<EmptyState
					icon={Megaphone}
					title="No vacancies yet"
					description="Add a vacancy to target with your resume."
					action={
						<Button asChild variant="outline">
							<Link to="/vacancies/new">Add Vacancy</Link>
						</Button>
					}
				/>
			}
		>
			{shown.map((vacancy) => (
				<motion.div key={vacancy.id} variants={listItem}>
					<SelectableCard
						selected={value === vacancy.id}
						onSelect={() => onChange(vacancy.id)}
						className="w-full"
					>
						<div className="space-y-2 pr-6">
							<p className="leading-snug font-medium">{vacancy.title}</p>
							<Badge variant="secondary" className="uppercase">
								{vacancy.language}
							</Badge>
							<p className="text-muted-foreground line-clamp-2 text-xs">
								{vacancy.description}
							</p>
						</div>
					</SelectableCard>
				</motion.div>
			))}
		</BuilderSelection>
	);
}
