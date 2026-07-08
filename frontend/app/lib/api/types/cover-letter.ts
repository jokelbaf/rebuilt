export interface GenerateCoverLetterInput {
	resumeId: string;
	templateId: string;
	notes?: string;
}

export interface SaveCoverLetterInput {
	id: string;
	name: string;
	html: string;
	resumeId: string;
}
