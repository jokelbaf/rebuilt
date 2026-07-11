import type { DiscoveryPlatform } from "~/lib/api/types/discovery";

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "UAH", "PLN"] as const;

export const DISCOVERY_PLATFORMS: {
	value: DiscoveryPlatform;
	label: string;
	description: string;
}[] = [
	{ value: "robota", label: "robota.ua", description: "Ukrainian jobs and employers" },
	{ value: "djinni", label: "Djinni", description: "Ukrainian and international tech jobs" },
];

export const INTERVALS = [
	{ value: 60, label: "Every hour" },
	{ value: 120, label: "Every 2 hours" },
	{ value: 240, label: "Every 4 hours" },
	{ value: 480, label: "Every 8 hours" },
	{ value: 1_440, label: "Daily" },
] as const;

export const SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal"] as const;
export const ENGLISH_LEVELS = [
	"basic",
	"pre-intermediate",
	"intermediate",
	"upper-intermediate",
	"advanced",
	"fluent",
] as const;
