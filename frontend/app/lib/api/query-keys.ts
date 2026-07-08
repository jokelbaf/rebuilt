import type { FileCollection } from "./types/files";

export const queryKeys = {
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
		models: ["chats", "models"] as const,
	},
} as const;
