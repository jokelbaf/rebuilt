import { SearchX } from "lucide-react";
import { motion } from "motion/react";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { listContainer } from "~/lib/motion";

interface BuilderSelectionProps {
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	onRetry: () => void;
	isEmpty: boolean;
	emptyState: React.ReactNode;
	children: React.ReactNode;
	search?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	isSearching?: boolean;
	hiddenCount?: number;
}

export function BuilderSelection({
	isLoading,
	isError,
	error,
	onRetry,
	isEmpty,
	emptyState,
	children,
	search,
	onSearchChange,
	searchPlaceholder,
	isSearching = false,
	hiddenCount = 0,
}: BuilderSelectionProps) {
	const showSearch = onSearchChange !== undefined && (!isEmpty || isSearching);

	return (
		<div className="space-y-4">
			{showSearch && (
				<SearchInput
					value={search ?? ""}
					onChange={onSearchChange}
					placeholder={searchPlaceholder ?? "Search..."}
					className="max-w-sm"
				/>
			)}

			{isLoading ? (
				<CardSkeletonGrid count={4} />
			) : isError ? (
				<ErrorState error={error} onRetry={onRetry} />
			) : isEmpty ? (
				isSearching ? (
					<EmptyState
						icon={SearchX}
						title="No matches"
						description="Nothing matches your search."
					/>
				) : (
					<>{emptyState}</>
				)
			) : (
				<>
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-3 sm:grid-cols-2"
					>
						{children}
					</motion.div>
					{hiddenCount > 0 && (
						<p className="text-muted-foreground text-xs">
							{hiddenCount} more not shown - refine your search to narrow it down.
						</p>
					)}
				</>
			)}
		</div>
	);
}
