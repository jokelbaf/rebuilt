const DAY_MS = 86_400_000;

export function formatRelativeDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";

	const diff = Date.now() - date.getTime();
	if (diff < DAY_MS) return "today";
	if (diff < 2 * DAY_MS) return "yesterday";
	if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)} days ago`;

	return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function prettifyName(value: string): string {
	return value
		.split(/[-_]+/)
		.map((word) => word.trim())
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function parseList(value: string): string[] {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

export function formatList(values: string[]): string {
	return values.join("\n");
}
