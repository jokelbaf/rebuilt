import {
	Briefcase,
	FileText,
	Files,
	FolderGit2,
	LayoutTemplate,
	Mail,
	Mails,
	Megaphone,
	Sparkles,
	User,
	type LucideIcon,
} from "lucide-react";

export interface NavItem {
	title: string;
	url: string;
	icon: LucideIcon;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export const navGroups: NavGroup[] = [
	{
		label: "Building",
		items: [
			{ title: "Resume", url: "/resume", icon: FileText },
			{ title: "Cover Letter", url: "/cover-letter", icon: Mail },
		],
	},
	{
		label: "Assistant",
		items: [{ title: "AI Chat", url: "/chat", icon: Sparkles }],
	},
	{
		label: "Library",
		items: [
			{ title: "Resumes", url: "/resumes", icon: Files },
			{ title: "Cover Letters", url: "/cover-letters", icon: Mails },
		],
	},
	{
		label: "Sources",
		items: [
			{ title: "Profile", url: "/profile", icon: User },
			{ title: "Experience", url: "/experience", icon: Briefcase },
			{ title: "Projects", url: "/projects", icon: FolderGit2 },
			{ title: "Templates", url: "/templates", icon: LayoutTemplate },
			{ title: "Vacancies", url: "/vacancies", icon: Megaphone },
		],
	},
];

export function isNavItemActive(pathname: string, url: string): boolean {
	return pathname === url || pathname.startsWith(`${url}/`);
}
