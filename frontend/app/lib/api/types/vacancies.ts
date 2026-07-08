export interface Vacancy {
	id: string;
	title: string;
	description: string;
	language: string;
	source: string | null;
	createdAt: string;
}

export interface VacancyDetail extends Vacancy {
	tech: string[];
	keywords: string[];
	roles: string[];
	seniority: string;
}

export interface CreateVacancyInput {
	title: string;
	description: string;
}

export interface ParseVacancyInput {
	url: string;
}

export interface UpdateVacancyInput {
	title: string;
	description: string;
	language: string;
	source: string | null;
	tech: string[];
	keywords: string[];
	roles: string[];
	seniority: string;
}
