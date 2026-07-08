import { Plus, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "~/components/common/search-input";
import { EmptyState, ErrorState, RowSkeletonList } from "~/components/common/states";
import { FileListItem } from "~/components/files/file-list-item";
import { PageBody, PageHeader } from "~/components/layout/page";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDeleteMarkdownFile, useMarkdownFiles } from "~/lib/api/files";
import type { FileCollection } from "~/lib/api/types/files";
import { fileCollectionConfig } from "~/lib/files-config";
import { listContainer } from "~/lib/motion";

export function MarkdownFilesPage({ collection }: { collection: FileCollection }) {
	const config = fileCollectionConfig[collection];
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);

	const { data, isLoading, isError, error, refetch } = useMarkdownFiles(
		collection,
		debouncedSearch
	);
	const deleteFile = useDeleteMarkdownFile(collection);

	const files = data ?? [];
	const isSearching = debouncedSearch.trim().length > 0;

	function handleDelete(name: string) {
		deleteFile.mutate(name, { onSuccess: () => toast.success("File deleted") });
	}

	return (
		<>
			<PageHeader
				title={config.title}
				description={config.description}
				actions={
					<Button asChild>
						<Link to={`${config.basePath}/new`}>
							<Plus className="size-4" />
							New File
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-4">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder={`Search ${config.title.toLowerCase()} by name or content...`}
					className="max-w-sm"
				/>

				{isLoading && <RowSkeletonList />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title={`Couldn't load ${config.title.toLowerCase()}`}
					/>
				)}

				{!isLoading && !isError && files.length === 0 && isSearching && (
					<EmptyState
						icon={SearchX}
						title="No matches"
						description="No files match your search."
					/>
				)}
				{!isLoading && !isError && files.length === 0 && !isSearching && (
					<EmptyState
						icon={config.icon}
						title={`No ${config.title.toLowerCase()} files yet`}
						description="Create a markdown file to capture this context."
						action={
							<Button asChild>
								<Link to={`${config.basePath}/new`}>
									<Plus className="size-4" />
									New File
								</Link>
							</Button>
						}
					/>
				)}

				{files.length > 0 && (
					<motion.ul
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="space-y-2"
					>
						{files.map((file) => (
							<FileListItem
								key={file.name}
								file={file}
								basePath={config.basePath}
								onDelete={() => handleDelete(file.name)}
							/>
						))}
					</motion.ul>
				)}
			</PageBody>
		</>
	);
}
