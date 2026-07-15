import { AlertTriangle, Bot, DatabaseBackup, GitBranch, Info, type LucideIcon } from "lucide-react";

export type SettingsSectionId = "ai-backend" | "git-sources" | "backups" | "about" | "danger";

export interface SettingsSection {
	id: SettingsSectionId;
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
	badge?: string;
}

export const settingsSections: SettingsSection[] = [
	{ id: "ai-backend", label: "AI Backend", icon: Bot },
	{ id: "git-sources", label: "Git Sources", icon: GitBranch },
	{ id: "backups", label: "Backups", icon: DatabaseBackup },
	{ id: "about", label: "About", icon: Info },
	{ id: "danger", label: "Danger", icon: AlertTriangle },
];

export const defaultSettingsSection: SettingsSectionId = "ai-backend";
