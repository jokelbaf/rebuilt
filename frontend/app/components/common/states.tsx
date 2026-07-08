import { AlertTriangle, type LucideIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import { getErrorMessage } from "~/lib/api/errors";
import { cn } from "~/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
	return (
		<Empty className={cn("border", className)}>
			<EmptyHeader>
				{Icon && (
					<EmptyMedia variant="icon">
						<Icon />
					</EmptyMedia>
				)}
				<EmptyTitle>{title}</EmptyTitle>
				{description && <EmptyDescription>{description}</EmptyDescription>}
			</EmptyHeader>
			{action && <EmptyContent>{action}</EmptyContent>}
		</Empty>
	);
}

interface ErrorStateProps {
	error: unknown;
	onRetry?: () => void;
	title?: string;
	className?: string;
}

export function ErrorState({
	error,
	onRetry,
	title = "Something went wrong",
	className,
}: ErrorStateProps) {
	return (
		<Empty className={cn("border", className)}>
			<EmptyHeader>
				<EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
					<AlertTriangle />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
			</EmptyHeader>
			{onRetry && (
				<EmptyContent>
					<Button variant="outline" size="sm" onClick={onRetry}>
						Try again
					</Button>
				</EmptyContent>
			)}
		</Empty>
	);
}

export function LoadingState({
	label = "Loading...",
	className,
}: {
	label?: string;
	className?: string;
}) {
	const show = useDelayedFlag(true);
	if (!show) return null;

	return (
		<div
			className={cn(
				"text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm",
				className
			)}
		>
			<Spinner className="size-4" />
			{label}
		</div>
	);
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
	const show = useDelayedFlag(true);
	if (!show) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{Array.from({ length: count }).map((_, index) => (
				<Skeleton key={index} className="h-32 w-full rounded-xl" />
			))}
		</div>
	);
}

export function RowSkeletonList({ count = 5 }: { count?: number }) {
	const show = useDelayedFlag(true);
	if (!show) return null;

	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, index) => (
				<Skeleton key={index} className="h-16 w-full rounded-lg" />
			))}
		</div>
	);
}
