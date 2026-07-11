import { Pencil, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { EmptyState, ErrorState, RowSkeletonList } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import {
	useCreateSearchQuery,
	useDeleteSearchQuery,
	useSearchQueries,
	useUpdateSearchQuery,
} from "~/lib/api/discovery";
import type { SearchQuery, SearchQueryInput } from "~/lib/api/types/discovery";
import { listContainer, listItem } from "~/lib/motion";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";

import { SearchQueryDialog } from "./search-query-dialog";

export function SearchQueriesSection() {
	const queryResult = useSearchQueries();
	const createQuery = useCreateSearchQuery();
	const updateQuery = useUpdateSearchQuery();
	const deleteQuery = useDeleteSearchQuery();
	const [editing, setEditing] = useState<SearchQuery | "new">("new");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogVersion, setDialogVersion] = useState(0);
	const queries = queryResult.data ?? [];
	const showSkeleton = useDelayedFlag(queryResult.isLoading);

	function openDialog(query: SearchQuery | "new") {
		setEditing(query);
		setDialogVersion((version) => version + 1);
		setDialogOpen(true);
	}

	function submit(input: SearchQueryInput) {
		if (editing === "new") {
			createQuery.mutate(input, {
				onSuccess: () => {
					toast.success("Search query created");
					setDialogOpen(false);
				},
			});
		} else {
			updateQuery.mutate(
				{ id: editing.id, input },
				{
					onSuccess: () => {
						toast.success("Search query updated");
						setDialogOpen(false);
					},
				}
			);
		}
	}

	return (
		<section className="space-y-3">
			<div className="flex items-end justify-between gap-3">
				<div>
					<h2 className="font-heading text-lg font-medium">Search queries</h2>
					<p className="text-sm text-muted-foreground">
						Reusable searches sent to every selected platform.
					</p>
				</div>
				<Button size="sm" onClick={() => openDialog("new")}>
					<Plus />
					Add query
				</Button>
			</div>
			{showSkeleton && <RowSkeletonList count={3} />}
			{queryResult.isError && (
				<ErrorState
					error={queryResult.error}
					onRetry={() => queryResult.refetch()}
					title="Couldn't load search queries"
				/>
			)}
			{!queryResult.isLoading && !queryResult.isError && queries.length === 0 && (
				<EmptyState
					icon={Search}
					title="No search queries"
					description="Create a query to tell discovery which roles to look for."
					action={
						<Button size="sm" onClick={() => openDialog("new")}>
							<Plus />
							Create query
						</Button>
					}
				/>
			)}
			{queries.length > 0 && (
				<motion.div
					variants={listContainer}
					initial="hidden"
					animate="visible"
					className="grid gap-3 lg:grid-cols-2"
				>
					{queries.map((query) => (
						<SearchQueryCard
							key={query.id}
							query={query}
							onEdit={() => openDialog(query)}
							onToggle={(enabled) =>
								updateQuery.mutate({ id: query.id, input: { enabled } })
							}
							onDelete={() =>
								deleteQuery.mutate(query.id, {
									onSuccess: () => toast.success("Search query deleted"),
								})
							}
						/>
					))}
				</motion.div>
			)}
			<SearchQueryDialog
				key={`${editing === "new" ? "new" : editing.id}-${dialogVersion}`}
				open={dialogOpen}
				query={editing === "new" ? undefined : editing}
				isSubmitting={createQuery.isPending || updateQuery.isPending}
				onClose={() => setDialogOpen(false)}
				onSubmit={submit}
			/>
		</section>
	);
}

function SearchQueryCard({
	query,
	onEdit,
	onToggle,
	onDelete,
}: {
	query: SearchQuery;
	onEdit: () => void;
	onToggle: (enabled: boolean) => void;
	onDelete: () => void;
}) {
	return (
		<motion.div variants={listItem}>
			<Card className={!query.enabled ? "opacity-70" : undefined}>
				<CardHeader>
					<CardTitle>{query.name}</CardTitle>
					<CardAction className="flex items-center gap-1">
						<Switch
							checked={query.enabled}
							onCheckedChange={onToggle}
							size="sm"
							aria-label={`Enable ${query.name}`}
						/>
						<Button variant="ghost" size="icon-sm" onClick={onEdit}>
							<Pencil />
							<span className="sr-only">Edit</span>
						</Button>
						<ConfirmDelete
							onConfirm={onDelete}
							title={`Delete “${query.name}”?`}
							description="This removes the saved search. Previously discovered vacancies are kept."
						/>
					</CardAction>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-wrap gap-1.5">
						{query.platforms.map((platform) => (
							<Badge key={platform} variant="outline" className="capitalize">
								{platform}
							</Badge>
						))}
						{query.remoteOnly && <Badge variant="secondary">Remote</Badge>}
						{query.seniority && (
							<Badge variant="secondary" className="capitalize">
								{query.seniority}
							</Badge>
						)}
					</div>
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
						{query.salaryMin !== null && (
							<span>
								From {query.salaryMin.toLocaleString()} {query.salaryCurrency}
							</span>
						)}
						{query.location && <span>{query.location}</span>}
						{query.englishLevel && (
							<span className="capitalize">{query.englishLevel} English</span>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
