import { LayoutTemplate } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

import { BuilderSelection } from "~/components/builder/builder-selection";
import { SelectableCard } from "~/components/builder/selectable-card";
import { EmptyState } from "~/components/common/states";
import { Button } from "~/components/ui/button";
import { useTemplates } from "~/lib/api/templates";
import { formatRelativeDate } from "~/lib/format";
import { listItem } from "~/lib/motion";

interface SelectTemplateStepProps {
	value?: string;
	onChange: (name: string) => void;
}

export function SelectTemplateStep({ value, onChange }: SelectTemplateStepProps) {
	const { data, isLoading, isError, error, refetch } = useTemplates();
	const templates = data ?? [];

	return (
		<BuilderSelection
			isLoading={isLoading}
			isError={isError}
			error={error}
			onRetry={() => refetch()}
			isEmpty={templates.length === 0}
			emptyState={
				<EmptyState
					icon={LayoutTemplate}
					title="No templates yet"
					description="Create a template before generating a document."
					action={
						<Button asChild variant="outline">
							<Link to="/templates/new">New Template</Link>
						</Button>
					}
				/>
			}
		>
			{templates.map((template) => (
				<motion.div key={template.name} variants={listItem}>
					<SelectableCard
						selected={value === template.name}
						onSelect={() => onChange(template.name)}
						className="w-full"
					>
						<div className="flex items-center gap-3 pr-6">
							<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
								<LayoutTemplate className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">{template.name}</p>
								<p className="text-muted-foreground text-xs">
									Updated {formatRelativeDate(template.updatedAt)}
								</p>
							</div>
						</div>
					</SelectableCard>
				</motion.div>
			))}
		</BuilderSelection>
	);
}
