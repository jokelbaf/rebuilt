import type { DiscoveredVacancy } from "~/lib/api/types/discovery";

const CURRENCY_LOCALES: Record<string, string> = {
	EUR: "de-DE",
	GBP: "en-GB",
	PLN: "pl-PL",
	UAH: "uk-UA",
	USD: "en-US",
};

function formatAmount(amount: number, currency: string): string {
	return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? undefined, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatRange(minimum: number | null, maximum: number | null, currency: string): string {
	if (minimum !== null && maximum !== null) {
		return minimum === maximum
			? formatAmount(minimum, currency)
			: `${formatAmount(minimum, currency)}–${formatAmount(maximum, currency)}`;
	}
	if (minimum !== null) return `from ${formatAmount(minimum, currency)}`;
	if (maximum !== null) return `up to ${formatAmount(maximum, currency)}`;
	return "";
}

export function formatVacancySalary(vacancy: DiscoveredVacancy): {
	original: string;
	converted: string;
} {
	const original = vacancy.salaryCurrency
		? formatRange(vacancy.salaryMin, vacancy.salaryMax, vacancy.salaryCurrency)
		: "";
	const converted = vacancy.convertedSalaryCurrency
		? formatRange(
				vacancy.convertedSalaryMin,
				vacancy.convertedSalaryMax,
				vacancy.convertedSalaryCurrency
			)
		: "";
	return { original, converted };
}

export function platformLabel(platform: string): string {
	return platform === "robota" ? "robota.ua" : platform === "djinni" ? "Djinni" : platform;
}

export function formatEmployment(value: string): string {
	const labels: Record<string, string> = {
		FULL_TIME: "Full-time",
		PART_TIME: "Part-time",
		CONTRACTOR: "Contract",
		TEMPORARY: "Temporary",
		INTERN: "Internship",
		VOLUNTEER: "Volunteer",
		PER_DIEM: "Per diem",
	};
	return (
		labels[value.toUpperCase()] ??
		value
			.replaceAll("_", " ")
			.toLowerCase()
			.replace(/^./, (letter) => letter.toUpperCase())
	);
}

export function companyMonogram(company: string): string {
	return company.trim().charAt(0).toUpperCase() || "?";
}

export function findSeniority(tags: string[]): string {
	return tags.find((tag) => /^(trainee|intern|junior|middle|mid|senior|lead)$/i.test(tag)) ?? "";
}
