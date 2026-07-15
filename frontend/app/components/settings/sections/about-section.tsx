import { Info } from "lucide-react";

import { ErrorState, LoadingState } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { useAppInfo } from "~/lib/api/settings";

export function AboutSection() {
	const { data, isLoading, isError, error, refetch } = useAppInfo();

	return (
		<div className="space-y-5">
			<div>
				<h2 className="text-lg font-semibold">About</h2>
				<p className="text-muted-foreground text-sm">
					Application information for this ReBuilt installation.
				</p>
			</div>

			{isLoading && <LoadingState label="Loading application information..." />}
			{isError && (
				<ErrorState
					error={error}
					onRetry={() => refetch()}
					title="Couldn't load application information"
				/>
			)}
			{data && (
				<div className="flex items-center gap-4 rounded-lg border p-4">
					<div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
						<Info className="size-5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-semibold">{data.name}</p>
						<p className="text-muted-foreground text-sm">AI-powered resume builder</p>
					</div>
					<Badge variant="secondary">Version {data.version}</Badge>
				</div>
			)}
		</div>
	);
}
