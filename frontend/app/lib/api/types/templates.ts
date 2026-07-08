export interface TemplateSummary {
	name: string;
	updatedAt: string;
}

export interface Template extends TemplateSummary {
	html: string;
}

export interface CreateTemplateInput {
	name: string;
	html: string;
}

export interface UpdateTemplateInput {
	html: string;
}
