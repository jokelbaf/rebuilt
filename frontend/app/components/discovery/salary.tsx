import type { DiscoveredVacancy } from "~/lib/api/types/discovery";
import { cn } from "~/lib/utils";

import { formatVacancySalary } from "./format";

export function VacancySalary({
	vacancy,
	className,
	prominent = false,
}: {
	vacancy: DiscoveredVacancy;
	className?: string;
	prominent?: boolean;
}) {
	const salary = formatVacancySalary(vacancy);
	if (!salary.original) return null;

	return (
		<div className={cn(prominent ? "text-xl font-semibold" : "text-sm font-medium", className)}>
			<span>{salary.original}</span>
			{salary.converted && (
				<span className="text-muted-foreground ml-1.5 text-[0.85em] font-normal">
					(~{salary.converted})
				</span>
			)}
		</div>
	);
}
