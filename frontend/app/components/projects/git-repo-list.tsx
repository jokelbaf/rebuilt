import { Check, FolderGit2 } from "lucide-react";
import { useState } from "react";

import { SearchInput } from "~/components/common/search-input";
import { EmptyState, ErrorState, RowSkeletonList } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useGitRepos } from "~/lib/api/git";
import { cn } from "~/lib/utils";

interface GitRepoListProps {
	owner: string;
	selected?: string;
	onSelect: (repo: string) => void;
}

export function GitRepoList({ owner, selected, onSelect }: GitRepoListProps) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const { data, isLoading, isError, error, refetch } = useGitRepos(owner, debouncedSearch);
	const repos = data ?? [];

	return (
		<div className="space-y-3">
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search repositories..."
				className="max-w-sm"
			/>

			{isLoading && <RowSkeletonList count={4} />}
			{isError && (
				<ErrorState
					error={error}
					onRetry={() => refetch()}
					title="Couldn't load repositories"
				/>
			)}
			{!isLoading && !isError && repos.length === 0 && (
				<EmptyState
					icon={FolderGit2}
					title="No repositories"
					description="No repositories were found for this owner."
				/>
			)}

			{repos.length > 0 && (
				<ScrollArea className="h-72 rounded-lg border">
					<ul className="divide-y">
						{repos.map((repo) => (
							<li key={repo.id}>
								<button
									type="button"
									onClick={() => onSelect(repo.name)}
									className={cn(
										"flex w-full items-start gap-3 p-3 text-left transition-colors",
										selected === repo.name ? "bg-accent" : "hover:bg-muted/50"
									)}
								>
									<FolderGit2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate text-sm font-medium">
												{repo.name}
											</span>
											{repo.private && (
												<Badge variant="outline" className="text-[10px]">
													Private
												</Badge>
											)}
										</div>
										{repo.description && (
											<p className="text-muted-foreground line-clamp-1 text-xs">
												{repo.description}
											</p>
										)}
									</div>
									{selected === repo.name && (
										<Check className="text-primary size-4 shrink-0" />
									)}
								</button>
							</li>
						))}
					</ul>
				</ScrollArea>
			)}
		</div>
	);
}
