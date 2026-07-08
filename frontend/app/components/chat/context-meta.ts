import { Briefcase, FolderGit2, Megaphone, User, type LucideIcon } from "lucide-react";

import type { ChatContextType } from "~/lib/api/types/chat";

export const contextTypeMeta: Record<ChatContextType, { label: string; icon: LucideIcon }> = {
	vacancy: { label: "Vacancy", icon: Megaphone },
	project: { label: "Project", icon: FolderGit2 },
	profile: { label: "Profile", icon: User },
	experience: { label: "Experience", icon: Briefcase },
};
