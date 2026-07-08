export type FileCollection = "profile" | "experience";

export interface MarkdownFileSummary {
	name: string;
	excerpt: string;
	updatedAt: string;
}

export interface MarkdownFile extends MarkdownFileSummary {
	content: string;
}

export interface CreateMarkdownFileInput {
	name: string;
	content: string;
}

export interface UpdateMarkdownFileInput {
	content: string;
}
