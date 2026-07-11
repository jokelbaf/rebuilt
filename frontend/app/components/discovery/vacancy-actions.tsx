import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Textarea } from "~/components/ui/textarea";
import type { DiscoveredVacancy } from "~/lib/api/types/discovery";
import { cn } from "~/lib/utils";

interface VacancyActionsProps {
	vacancy: DiscoveredVacancy;
	onApprove: () => void;
	onDismiss: (reason: string) => void;
	onRestore: () => void;
	isPending?: boolean;
	className?: string;
	detail?: boolean;
}

export function VacancyActions({
	vacancy,
	onApprove,
	onDismiss,
	onRestore,
	isPending = false,
	className,
	detail = false,
}: VacancyActionsProps) {
	const [dismissOpen, setDismissOpen] = useState(false);
	const [reason, setReason] = useState("");

	function dismiss() {
		onDismiss(reason);
		setDismissOpen(false);
		setReason("");
	}

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			{vacancy.status === "new" && (
				<>
					<Button
						size={detail ? "default" : "sm"}
						onClick={onApprove}
						disabled={isPending}
					>
						<Check />
						Approve
					</Button>
					<Popover open={dismissOpen} onOpenChange={setDismissOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size={detail ? "default" : "sm"}
								disabled={isPending}
							>
								<X />
								Dismiss
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 gap-3">
							<div>
								<p className="font-medium">Dismiss vacancy</p>
								<p className="text-muted-foreground text-xs">
									A reason is optional and can improve future recommendations.
								</p>
							</div>
							<Textarea
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder="Not relevant because..."
								rows={3}
							/>
							<Button variant="destructive" size="sm" onClick={dismiss}>
								Dismiss vacancy
							</Button>
						</PopoverContent>
					</Popover>
				</>
			)}
			{vacancy.status === "dismissed" && (
				<Button
					variant="outline"
					size={detail ? "default" : "sm"}
					onClick={onRestore}
					disabled={isPending}
				>
					<RotateCcw />
					Restore
				</Button>
			)}
			{vacancy.status === "approved" && vacancy.vacancyId && (
				<Button asChild size={detail ? "default" : "sm"}>
					<Link to={`/vacancies/${vacancy.vacancyId}/edit`}>Open in vacancies</Link>
				</Button>
			)}
			<Button asChild variant="ghost" size={detail ? "default" : "sm"}>
				<a href={vacancy.url} target="_blank" rel="noopener noreferrer">
					<ExternalLink />
					Open original
				</a>
			</Button>
		</div>
	);
}
