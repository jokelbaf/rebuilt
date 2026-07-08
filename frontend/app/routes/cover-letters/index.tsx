import { Mails, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader } from "~/components/layout/page";
import { CoverLetterCard } from "~/components/library/cover-letter-card";
import { Button } from "~/components/ui/button";
import { useLibraryCoverLetters } from "~/lib/api/library";
import { prettifyName } from "~/lib/format";
import { listContainer } from "~/lib/motion";

export default function CoverLettersPage() {
	const [search, setSearch] = useState("");
	const { data, isLoading, isError, error, refetch } = useLibraryCoverLetters();

	const coverLetters = data ?? [];
	const filtered = useMemo(() => {
		const items = data ?? [];
		const query = search.trim().toLowerCase();
		if (!query) return items;
		return items.filter((coverLetter) =>
			(coverLetter.vacancyTitle ?? prettifyName(coverLetter.name))
				.toLowerCase()
				.includes(query)
		);
	}, [data, search]);

	return (
		<>
			<PageHeader
				title="Cover Letters"
				description="Cover letters you've created and saved."
				actions={
					<Button asChild>
						<Link to="/cover-letter">
							<Plus className="size-4" />
							Build Cover Letter
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-5">
				{coverLetters.length > 0 && (
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search cover letters..."
						className="max-w-sm"
					/>
				)}

				{isLoading && <CardSkeletonGrid />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load cover letters"
					/>
				)}

				{!isLoading && !isError && coverLetters.length === 0 && (
					<EmptyState
						icon={Mails}
						title="No cover letters yet"
						description="Generate a cover letter from a saved resume and it will show up here."
						action={
							<Button asChild>
								<Link to="/cover-letter">
									<Plus className="size-4" />
									Build Cover Letter
								</Link>
							</Button>
						}
					/>
				)}

				{!isLoading && !isError && coverLetters.length > 0 && filtered.length === 0 && (
					<EmptyState
						icon={Mails}
						title="No matches"
						description="No cover letters match your search."
					/>
				)}

				{filtered.length > 0 && (
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					>
						{filtered.map((coverLetter) => (
							<CoverLetterCard key={coverLetter.id} coverLetter={coverLetter} />
						))}
					</motion.div>
				)}
			</PageBody>
		</>
	);
}
