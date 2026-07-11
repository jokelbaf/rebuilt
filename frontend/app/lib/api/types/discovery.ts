export type DiscoveryPlatform = "robota" | "djinni";
export type DiscoveryVacancyStatus = "new" | "approved" | "dismissed";
export type DiscoveryRunStatus = "running" | "completed" | "failed" | "cancelled";

export interface DiscoveryNotificationSettings {
	telegramEnabled: boolean;
	telegramBotToken: string;
	telegramChatId: string;
}

export interface DiscoveryNotificationTest {
	channel: "telegram";
	delivered: boolean;
}

export interface DiscoverySettings {
	enabled: boolean;
	intervalMinutes: number;
	maxPagesPerQuery: number;
	scoreThresholdNotify: number;
	preferredCurrency: string;
	notifications: DiscoveryNotificationSettings;
}

export interface DiscoveryExchangeRates {
	base: string;
	currencies: string[];
	fetchedAt: string | null;
}

export interface PlatformAccount {
	id: string;
	platform: DiscoveryPlatform;
	email: string;
	hasPassword: boolean;
	status: "unverified" | "ok" | "failed";
	lastVerifiedAt: string | null;
	createdAt: string;
}

export interface PlatformAccountInput {
	platform: DiscoveryPlatform;
	email: string;
	password: string;
}

export interface SearchQueryInput {
	name: string;
	enabled: boolean;
	platforms: DiscoveryPlatform[];
	wishes: string;
	salaryMin: number | null;
	salaryCurrency: string | null;
	seniority: string;
	remoteOnly: boolean;
	location: string;
	englishLevel: string;
}

export interface SearchQuery extends SearchQueryInput {
	id: string;
	createdAt: string;
	updatedAt: string;
}

export type SearchQueryUpdate = Partial<SearchQueryInput>;

export interface DiscoveryRun {
	id: string;
	trigger: "manual" | "scheduled" | "chat";
	status: DiscoveryRunStatus;
	startedAt: string;
	finishedAt: string | null;
	stats: Record<string, unknown>;
	error: string;
}

export interface DiscoveryEvent {
	id: number;
	runId: string;
	ts: string;
	level: "info" | "warning" | "error";
	kind: string;
	message: string;
	data: Record<string, unknown>;
}

export interface DiscoveryEventPage {
	items: DiscoveryEvent[];
	nextBefore: number | undefined;
}

export interface DiscoveredVacancy {
	id: string;
	platform: DiscoveryPlatform;
	externalId: string;
	url: string;
	title: string;
	company: string;
	companyLogoUrl: string | null;
	location: string;
	remote: boolean;
	employment: string;
	experienceYears: string;
	englishLevel: string;
	salaryMin: number | null;
	salaryMax: number | null;
	salaryCurrency: string | null;
	convertedSalaryMin: number | null;
	convertedSalaryMax: number | null;
	convertedSalaryCurrency: string | null;
	tags: string[];
	snippet: string;
	postedAt: string | null;
	score: number | null;
	verdict: string;
	status: DiscoveryVacancyStatus;
	dismissReason: string;
	vacancyId: string | null;
	runId: string;
	searchQueryId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DiscoveredVacancyDetail extends DiscoveredVacancy {
	description: string;
	descriptionHtml: string;
	raw: Record<string, unknown>;
}

export interface DiscoveredVacancyFilters {
	status?: DiscoveryVacancyStatus;
	platform?: DiscoveryPlatform;
	minScore?: number;
	q?: string;
}

export interface DiscoveredVacancyCount {
	count: number;
}

export interface DiscoveredVacancyApproval {
	vacancyId: string;
}
