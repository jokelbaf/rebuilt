import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ListField } from "~/components/common/list-field";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { UpdateVacancyInput } from "~/lib/api/types/vacancies";
import { formatList, parseList } from "~/lib/format";
import { LANGUAGES } from "~/lib/languages";

const UNSPECIFIED = "unspecified";
const SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal"] as const;

interface VacancyFormProps {
	defaultValues: UpdateVacancyInput;
	onSubmit: (values: UpdateVacancyInput) => void;
	isSubmitting: boolean;
	submitLabel: string;
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function VacancyForm({
	defaultValues,
	onSubmit,
	isSubmitting,
	submitLabel,
}: VacancyFormProps) {
	const [title, setTitle] = useState(defaultValues.title);
	const [language, setLanguage] = useState(defaultValues.language);
	const [description, setDescription] = useState(defaultValues.description);
	const [source, setSource] = useState(defaultValues.source ?? "");
	const [seniority, setSeniority] = useState(defaultValues.seniority || UNSPECIFIED);
	const [tech, setTech] = useState(formatList(defaultValues.tech));
	const [keywords, setKeywords] = useState(formatList(defaultValues.keywords));
	const [roles, setRoles] = useState(formatList(defaultValues.roles));

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}
		const trimmedSource = source.trim();
		onSubmit({
			title: title.trim(),
			language,
			description: description.trim(),
			source: trimmedSource || null,
			seniority: seniority === UNSPECIFIED ? "" : seniority,
			tech: parseList(tech),
			keywords: parseList(keywords),
			roles: parseList(roles),
		});
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="vacancy-title">Title</Label>
					<Input
						id="vacancy-title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Senior Frontend Engineer"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="vacancy-language">Language</Label>
					<Select value={language} onValueChange={setLanguage}>
						<SelectTrigger id="vacancy-language" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGES.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="vacancy-source">Source URL</Label>
				<div className="flex gap-2">
					<Input
						id="vacancy-source"
						type="url"
						value={source}
						onChange={(event) => setSource(event.target.value)}
						placeholder="https://job-board.com/posting"
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={!isValidUrl(source.trim())}
						onClick={() => window.open(source.trim(), "_blank", "noopener,noreferrer")}
						aria-label="Open source URL"
					>
						<ExternalLink className="size-4" />
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="vacancy-description">Description</Label>
				<Textarea
					id="vacancy-description"
					rows={12}
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					placeholder="The full job description..."
					className="resize-none"
				/>
			</div>

			<div className="space-y-2 sm:max-w-xs">
				<Label htmlFor="vacancy-seniority">Seniority</Label>
				<Select value={seniority} onValueChange={setSeniority}>
					<SelectTrigger id="vacancy-seniority" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={UNSPECIFIED}>Unspecified</SelectItem>
						{SENIORITY_LEVELS.map((option) => (
							<SelectItem key={option} value={option} className="capitalize">
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<ListField
				id="vacancy-tech"
				label="Tech"
				value={tech}
				onChange={setTech}
				placeholder={"react\ntypescript\npostgresql"}
			/>
			<ListField
				id="vacancy-keywords"
				label="Keywords"
				value={keywords}
				onChange={setKeywords}
				placeholder={"fintech\nmicroservices"}
			/>
			<ListField
				id="vacancy-roles"
				label="Roles"
				value={roles}
				onChange={setRoles}
				placeholder={"backend developer\nteam lead"}
			/>

			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Saving..." : submitLabel}
			</Button>
		</form>
	);
}
