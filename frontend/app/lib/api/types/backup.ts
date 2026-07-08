export interface BackupSummary {
	vacancies: number;
	projects: number;
	templates: number;
	resumes: number;
	coverLetters: number;
	markdownFiles: number;
	gitSources: number;
	chats: number;
	chatMessages: number;
	files: number;
}

export interface BackupDownloadProgress {
	loaded: number;
	total: number | null;
}
