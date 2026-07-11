import type { FileCollection } from "./types/files";
import type { DiscoveredVacancyFilters, DiscoveryVacancyStatus } from "./types/discovery";

export const queryKeys = {
	discovery: {
		all: ["discovery"] as const,
		settings: ["discovery", "settings"] as const,
		exchangeRates: ["discovery", "exchange-rates"] as const,
		accounts: ["discovery", "accounts"] as const,
		queries: ["discovery", "queries"] as const,
		vacancies: {
			all: ["discovery", "vacancies"] as const,
			lists: ["discovery", "vacancies", "list"] as const,
			list: (filters: DiscoveredVacancyFilters) =>
				["discovery", "vacancies", "list", filters] as const,
			count: (status: DiscoveryVacancyStatus) =>
				["discovery", "vacancies", "count", status] as const,
			detail: (id: string) => ["discovery", "vacancies", id] as const,
		},
		runs: {
			all: ["discovery", "runs"] as const,
			list: (limit: number) => ["discovery", "runs", limit] as const,
			detail: (id: string) => ["discovery", "runs", id] as const,
			events: (id: string) => ["discovery", "runs", id, "events"] as const,
		},
	},
	vacancies: {
		all: ["vacancies"] as const,
		list: (search: string) => ["vacancies", "list", search] as const,
		detail: (id: string) => ["vacancies", id] as const,
	},
	templates: {
		all: ["templates"] as const,
		detail: (name: string) => ["templates", name] as const,
	},
	files: {
		all: (collection: FileCollection) => [collection] as const,
		list: (collection: FileCollection, search: string) => [collection, "list", search] as const,
		detail: (collection: FileCollection, name: string) => [collection, name] as const,
	},
	projects: {
		all: ["projects"] as const,
		list: (search: string) => ["projects", "list", search] as const,
		detail: (name: string) => ["projects", name] as const,
	},
	resumes: {
		all: ["resumes"] as const,
		list: (search: string) => ["resumes", "list", search] as const,
	},
	library: {
		resumes: ["library", "resumes"] as const,
		resume: (id: string) => ["library", "resumes", id] as const,
		coverLetters: ["library", "cover-letters"] as const,
		coverLetter: (id: string) => ["library", "cover-letters", id] as const,
	},
	git: {
		sources: ["git", "sources"] as const,
		owners: ["git", "owners"] as const,
		repos: (owner: string, search: string) => ["git", "repos", owner, search] as const,
	},
	chats: {
		all: ["chats"] as const,
		list: (search: string) => ["chats", "list", search] as const,
		detail: (id: string) => ["chats", id] as const,
		modelCatalogs: ["chats", "models"] as const,
		models: (provider?: string) => ["chats", "models", provider ?? "active"] as const,
	},
	settings: {
		ai: ["settings", "ai"] as const,
	},
} as const;
