import { XIcon } from "lucide-react";
import { useState } from "react";

import { AiBackendSection } from "~/components/settings/sections/ai-backend-section";
import { BackupsSection } from "~/components/settings/sections/backups-section";
import { DangerSection } from "~/components/settings/sections/danger-section";
import { GitSourcesSection } from "~/components/settings/sections/git-sources-section";
import {
	defaultSettingsSection,
	settingsSections,
	type SettingsSectionId,
} from "~/components/settings/sections";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const sectionContent: Record<SettingsSectionId, React.ReactNode> = {
	"ai-backend": <AiBackendSection />,
	"git-sources": <GitSourcesSection />,
	backups: <BackupsSection />,
	danger: <DangerSection />,
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const [active, setActive] = useState<SettingsSectionId>(defaultSettingsSection);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="h-136 max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
			>
				<DialogClose asChild>
					<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3 z-10">
						<XIcon />
						<span className="sr-only">Close</span>
					</Button>
				</DialogClose>
				<div className="flex h-full">
					<aside className="bg-muted/30 flex w-56 shrink-0 flex-col border-r p-3">
						<DialogHeader className="space-y-0 px-2 py-2 text-left">
							<DialogTitle className="text-base">Settings</DialogTitle>
							<DialogDescription className="sr-only">
								Manage AI backend and git source settings.
							</DialogDescription>
						</DialogHeader>
						<nav className="mt-3 space-y-1">
							{settingsSections.map((section) => (
								<button
									key={section.id}
									type="button"
									disabled={section.disabled}
									onClick={() => setActive(section.id)}
									className={cn(
										"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
										active === section.id
											? "bg-background text-foreground font-medium shadow-sm"
											: "text-muted-foreground hover:bg-background/60",
										section.disabled &&
											"cursor-not-allowed opacity-60 hover:bg-transparent"
									)}
								>
									<section.icon className="size-4 shrink-0" />
									<span className="flex-1 text-left">{section.label}</span>
									{section.badge && (
										<Badge variant="secondary" className="text-[10px]">
											{section.badge}
										</Badge>
									)}
								</button>
							))}
						</nav>
					</aside>

					<div className="flex-1 pt-7">
						<ScrollArea className="w-full">
							<div className="p-6">{sectionContent[active]}</div>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
