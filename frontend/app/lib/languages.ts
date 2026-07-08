export interface LanguageOption {
	value: string;
	label: string;
}

export const LANGUAGES: LanguageOption[] = [
	{ value: "en", label: "English" },
	{ value: "uk", label: "Ukrainian" },
	{ value: "de", label: "German" },
	{ value: "fr", label: "French" },
	{ value: "es", label: "Spanish" },
	{ value: "pl", label: "Polish" },
];

export function languageLabel(value: string): string {
	return LANGUAGES.find((language) => language.value === value)?.label ?? value.toUpperCase();
}
