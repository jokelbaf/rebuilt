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
	platformAccounts: number;
	searchQueries: number;
	discoveryRuns: number;
	discoveryEvents: number;
	discoveredVacancies: number;
	files: number;
}

export interface BackupDownloadProgress {
	loaded: number;
	total: number | null;
}
