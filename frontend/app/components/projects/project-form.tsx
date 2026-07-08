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
import { PROJECT_LEVELS, type ProjectInput, type ProjectLevel } from "~/lib/api/types/projects";
import { formatList, parseList } from "~/lib/format";

interface ProjectFormProps {
	defaultValues: ProjectInput;
	onSubmit: (values: ProjectInput) => void;
	isSubmitting: boolean;
	submitLabel: string;
}

export function ProjectForm({
	defaultValues,
	onSubmit,
	isSubmitting,
	submitLabel,
}: ProjectFormProps) {
	const [title, setTitle] = useState(defaultValues.title);
	const [description, setDescription] = useState(defaultValues.description);
	const [level, setLevel] = useState<ProjectLevel>(defaultValues.level);
	const [tech, setTech] = useState(formatList(defaultValues.tech));
	const [roles, setRoles] = useState(formatList(defaultValues.roles));
	const [resumeBullets, setResumeBullets] = useState(formatList(defaultValues.resumeBullets));
	const [keywords, setKeywords] = useState(formatList(defaultValues.keywords));

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}
		onSubmit({
			title: title.trim(),
			description: description.trim(),
			level,
			tech: parseList(tech),
			roles: parseList(roles),
			resumeBullets: parseList(resumeBullets),
			keywords: parseList(keywords),
		});
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="project-title">Title</Label>
					<Input
						id="project-title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Realtime collaboration platform"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="project-level">Level</Label>
					<Select
						value={level}
						onValueChange={(value) => setLevel(value as ProjectLevel)}
					>
						<SelectTrigger id="project-level" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PROJECT_LEVELS.map((option) => (
								<SelectItem key={option} value={option} className="capitalize">
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="project-description">Description</Label>
				<Textarea
					id="project-description"
					rows={3}
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					placeholder="A short summary of what this project is and does."
					className="resize-none"
				/>
			</div>

			<ListField
				id="project-tech"
				label="Tech"
				value={tech}
				onChange={setTech}
				placeholder={"React\nTypeScript\nPostgreSQL"}
			/>
			<ListField
				id="project-roles"
				label="Roles"
				value={roles}
				onChange={setRoles}
				placeholder={"Lead developer\nArchitect"}
			/>
			<ListField
				id="project-bullets"
				label="Resume bullets"
				value={resumeBullets}
				onChange={setResumeBullets}
				placeholder={"Shipped X that improved Y by Z%"}
				rows={5}
			/>
			<ListField
				id="project-keywords"
				label="Keywords"
				value={keywords}
				onChange={setKeywords}
				placeholder={"distributed-systems\nwebsockets"}
			/>

			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Saving..." : submitLabel}
			</Button>
		</form>
	);
}
