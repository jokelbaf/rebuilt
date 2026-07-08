import { Files, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader } from "~/components/layout/page";
import { ResumeCard } from "~/components/library/resume-card";
import { Button } from "~/components/ui/button";
import { useLibraryResumes } from "~/lib/api/library";
import { prettifyName } from "~/lib/format";
import { listContainer } from "~/lib/motion";

export default function ResumesPage() {
	const [search, setSearch] = useState("");
	const { data, isLoading, isError, error, refetch } = useLibraryResumes();

	const resumes = data ?? [];
	const filtered = useMemo(() => {
		const items = data ?? [];
		const query = search.trim().toLowerCase();
		if (!query) return items;
		return items.filter((resume) =>
			(resume.vacancyTitle ?? prettifyName(resume.name)).toLowerCase().includes(query)
		);
	}, [data, search]);

	return (
		<>
			<PageHeader
				title="Resumes"
				description="Resumes you've created and saved."
				actions={
					<Button asChild>
						<Link to="/resume">
							<Plus className="size-4" />
							Build Resume
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-5">
				{resumes.length > 0 && (
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search resumes..."
						className="max-w-sm"
					/>
				)}

				{isLoading && <CardSkeletonGrid />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load resumes"
					/>
				)}

				{!isLoading && !isError && resumes.length === 0 && (
					<EmptyState
						icon={Files}
						title="No resumes yet"
						description="Build a resume tailored to a vacancy and it will show up here."
						action={
							<Button asChild>
								<Link to="/resume">
									<Plus className="size-4" />
									Build Resume
								</Link>
							</Button>
						}
					/>
				)}

				{!isLoading && !isError && resumes.length > 0 && filtered.length === 0 && (
					<EmptyState
						icon={Files}
						title="No matches"
						description="No resumes match your search."
					/>
				)}

				{filtered.length > 0 && (
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					>
						{filtered.map((resume) => (
							<ResumeCard key={resume.id} resume={resume} />
						))}
					</motion.div>
				)}
			</PageBody>
		</>
	);
}
