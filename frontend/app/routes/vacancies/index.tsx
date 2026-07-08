import { Megaphone, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "~/components/common/search-input";
import { CardSkeletonGrid, EmptyState, ErrorState } from "~/components/common/states";
import { PageBody, PageHeader } from "~/components/layout/page";
import { Button } from "~/components/ui/button";
import { VacancyCard } from "~/components/vacancies/vacancy-card";
import { useDeleteVacancy, useVacancies } from "~/lib/api/vacancies";
import { listContainer } from "~/lib/motion";

export default function VacanciesPage() {
	const [search, setSearch] = useState("");
	const { data, isLoading, isError, error, refetch } = useVacancies();
	const deleteVacancy = useDeleteVacancy();

	const vacancies = data ?? [];
	const filtered = useMemo(() => {
		const items = data ?? [];
		const query = search.trim().toLowerCase();
		if (!query) return items;
		return items.filter(
			(vacancy) =>
				vacancy.title.toLowerCase().includes(query) ||
				vacancy.description.toLowerCase().includes(query)
		);
	}, [data, search]);

	function handleDelete(id: string) {
		deleteVacancy.mutate(id, { onSuccess: () => toast.success("Vacancy deleted") });
	}

	return (
		<>
			<PageHeader
				title="Vacancies"
				description="Job postings you can target with a resume."
				actions={
					<Button asChild>
						<Link to="/vacancies/new">
							<Plus className="size-4" />
							Add Vacancy
						</Link>
					</Button>
				}
			/>
			<PageBody className="space-y-5">
				{vacancies.length > 0 && (
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search vacancies..."
						className="max-w-sm"
					/>
				)}

				{isLoading && <CardSkeletonGrid />}
				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load vacancies"
					/>
				)}

				{!isLoading && !isError && vacancies.length === 0 && (
					<EmptyState
						icon={Megaphone}
						title="No vacancies yet"
						description="Add a vacancy to start building targeted resumes."
						action={
							<Button asChild>
								<Link to="/vacancies/new">
									<Plus className="size-4" />
									Add Vacancy
								</Link>
							</Button>
						}
					/>
				)}

				{!isLoading && !isError && vacancies.length > 0 && filtered.length === 0 && (
					<EmptyState
						icon={Megaphone}
						title="No matches"
						description="No vacancies match your search."
					/>
				)}

				{filtered.length > 0 && (
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					>
						{filtered.map((vacancy) => (
							<VacancyCard
								key={vacancy.id}
								vacancy={vacancy}
								onDelete={() => handleDelete(vacancy.id)}
							/>
						))}
					</motion.div>
				)}
			</PageBody>
		</>
	);
}
