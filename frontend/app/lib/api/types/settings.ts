export interface AiProvider {
	id: string;
	label: string;
	description: string;
	available: boolean;
	installHint: string;
}

export interface AiSettings {
	provider: string;
	providers: AiProvider[];
}

export interface AiSettingsUpdate {
	provider: string;
}

export interface AiUsageWindow {
	usedPercent: number;
	resetsAt: string | null;
}

export interface AiUsage {
	provider: string;
	providerLabel: string;
	fiveHour: AiUsageWindow | null;
	weekly: AiUsageWindow | null;
}

export interface AppInfo {
	name: string;
	version: string;
}
