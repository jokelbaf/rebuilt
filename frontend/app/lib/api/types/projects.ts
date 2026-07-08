export const PROJECT_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal"] as const;

export type ProjectLevel = (typeof PROJECT_LEVELS)[number];

export interface ProjectSummary {
	id: string;
	name: string;
	title: string;
	tech: string[];
	level: ProjectLevel;
	updatedAt: string;
}

export interface Project extends ProjectSummary {
	description: string;
	roles: string[];
	resumeBullets: string[];
	keywords: string[];
}

export interface ProjectInput {
	title: string;
	description: string;
	tech: string[];
	roles: string[];
	level: ProjectLevel;
	resumeBullets: string[];
	keywords: string[];
}

export interface ImportProjectFromGitInput {
	owner: string;
	repo: string;
}
