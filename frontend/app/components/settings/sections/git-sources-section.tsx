import { GitBranch, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { EmptyState, ErrorState, RowSkeletonList } from "~/components/common/states";
import { AddSourceDialog } from "~/components/settings/add-source-dialog";
import { useDeleteGitSource, useGitSources } from "~/lib/api/git";
import type { GitSource } from "~/lib/api/types/git";
import { formatRelativeDate } from "~/lib/format";
import { listContainer, listItem } from "~/lib/motion";

export function GitSourcesSection() {
	const { data, isLoading, isError, error, refetch } = useGitSources();
	const deleteSource = useDeleteGitSource();
	const sources = data ?? [];

	function handleDelete(source: GitSource) {
		deleteSource.mutate(source.id, {
			onSuccess: () => toast.success(`Removed ${source.username}`),
		});
	}

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Git Sources</h2>
					<p className="text-muted-foreground text-sm">
						Credentials used to clone repositories when importing projects.
					</p>
				</div>
				<AddSourceDialog />
			</div>

			{isLoading && <RowSkeletonList count={3} />}
			{isError && (
				<ErrorState error={error} onRetry={() => refetch()} title="Couldn't load sources" />
			)}
			{!isLoading && !isError && sources.length === 0 && (
				<EmptyState
					icon={GitBranch}
					title="No git sources yet"
					description="Add a source to import projects directly from your repositories."
				/>
			)}

			{sources.length > 0 && (
				<motion.ul
					variants={listContainer}
					initial="hidden"
					animate="visible"
					className="space-y-2"
				>
					{sources.map((source) => (
						<motion.li
							key={source.id}
							variants={listItem}
							className="flex items-center gap-3 rounded-lg border p-3"
						>
							<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
								<KeyRound className="size-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{source.username}</p>
								<p className="text-muted-foreground text-xs">
									Added {formatRelativeDate(source.createdAt)}
								</p>
							</div>
							<ConfirmDelete
								onConfirm={() => handleDelete(source)}
								title="Remove this git source?"
								description={`Credentials for ${source.username} will be deleted.`}
							/>
						</motion.li>
					))}
				</motion.ul>
			)}
		</div>
	);
}
