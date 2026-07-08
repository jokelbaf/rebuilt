export interface ResumeSummary {
	id: string;
	name: string;
	vacancyId: string;
	language: string;
	updatedAt: string;
}

export interface GenerateResumeInput {
	vacancyId: string;
	language: string;
	templateId: string;
	notes?: string;
}

export interface GeneratedDocument {
	id: string;
	html: string;
}

export interface ExportPdfInput {
	id: string;
	html: string;
}

export interface ExportPdfResult {
	fileName: string;
	downloadUrl: string;
}

export interface SaveResumeInput {
	id: string;
	name: string;
	html: string;
	vacancyId: string;
	language: string;
}
