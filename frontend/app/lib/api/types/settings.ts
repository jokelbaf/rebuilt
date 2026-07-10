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
