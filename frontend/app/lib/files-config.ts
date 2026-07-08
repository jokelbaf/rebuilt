import { Briefcase, User, type LucideIcon } from "lucide-react";

import type { FileCollection } from "~/lib/api/types/files";

interface FileCollectionConfig {
	title: string;
	description: string;
	basePath: string;
	icon: LucideIcon;
	placeholder: string;
}

export const fileCollectionConfig: Record<FileCollection, FileCollectionConfig> = {
	profile: {
		title: "Profile",
		description: "Markdown notes about you, used as context when generating resumes.",
		basePath: "/profile",
		icon: User,
		placeholder: "# About me\n\nA short professional summary...",
	},
	experience: {
		title: "Experience",
		description: "Markdown notes describing your work history and achievements.",
		basePath: "/experience",
		icon: Briefcase,
		placeholder: "# Senior Engineer - Company\n\n- Did impactful things...",
	},
};
