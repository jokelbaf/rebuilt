export interface ResumeListItem {
	id: string;
	name: string;
	vacancyTitle: string | null;
	language: string;
	createdAt: string;
	updatedAt: string;
}

export interface ResumeDocument extends ResumeListItem {
	html: string;
}

export interface CoverLetterListItem {
	id: string;
	name: string;
	vacancyTitle: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CoverLetterDocument extends CoverLetterListItem {
	html: string;
}

export interface UpdateLibraryDocumentInput {
	id: string;
	html: string;
}
