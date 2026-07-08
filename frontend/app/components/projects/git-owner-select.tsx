import { ErrorState } from "~/components/common/states";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import { useGitOwners } from "~/lib/api/git";

interface GitOwnerSelectProps {
	value?: string;
	onChange: (owner: string) => void;
}

export function GitOwnerSelect({ value, onChange }: GitOwnerSelectProps) {
	const { data, isLoading, isError, error, refetch } = useGitOwners(true);
	const showSkeleton = useDelayedFlag(isLoading);
	const owners = data ?? [];

	if (isLoading) return showSkeleton ? <Skeleton className="h-9 w-full sm:w-72" /> : null;
	if (isError)
		return <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load owners" />;

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full sm:w-72">
				<SelectValue placeholder="Select an owner" />
			</SelectTrigger>
			<SelectContent>
				{owners.map((owner) => (
					<SelectItem key={owner.login} value={owner.login}>
						{owner.login}
						{owner.type === "organization" && (
							<span className="text-muted-foreground"> · org</span>
						)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
