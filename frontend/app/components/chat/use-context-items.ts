import { useMemo } from "react";

import { useMarkdownFiles } from "~/lib/api/files";
import { useProjects } from "~/lib/api/projects";
import type { ChatContextRef } from "~/lib/api/types/chat";
import { useVacancies } from "~/lib/api/vacancies";

const MAX_ITEMS = 8;

export function useContextItems(query: string, exclude: ChatContextRef[]): ChatContextRef[] {
	const vacancies = useVacancies();
	const projects = useProjects("");
	const profile = useMarkdownFiles("profile", "");
	const experience = useMarkdownFiles("experience", "");

	return useMemo(() => {
		const items: ChatContextRef[] = [
			...(vacancies.data ?? []).map((vacancy): ChatContextRef => ({
				type: "vacancy",
				id: vacancy.id,
				title: vacancy.title,
			})),
			...(projects.data ?? []).map((project): ChatContextRef => ({
				type: "project",
				id: project.id,
				title: project.title,
			})),
			...(profile.data ?? []).map((file): ChatContextRef => ({
				type: "profile",
				id: file.name,
				title: file.name,
			})),
			...(experience.data ?? []).map((file): ChatContextRef => ({
				type: "experience",
				id: file.name,
				title: file.name,
			})),
		];

		const excluded = new Set(exclude.map((ref) => `${ref.type}:${ref.id}`));
		const needle = query.trim().toLowerCase();

		return items
			.filter((item) => !excluded.has(`${item.type}:${item.id}`))
			.filter(
				(item) =>
					!needle ||
					item.title.toLowerCase().includes(needle) ||
					item.type.startsWith(needle)
			)
			.slice(0, MAX_ITEMS);
	}, [vacancies.data, projects.data, profile.data, experience.data, query, exclude]);
}
