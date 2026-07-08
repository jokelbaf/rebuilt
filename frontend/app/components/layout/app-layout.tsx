import { useState } from "react";
import { Outlet } from "react-router";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { SettingsDialog } from "~/components/settings/settings-dialog";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

export default function AppLayout() {
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<SidebarProvider>
			<AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
			<SidebarInset className="flex h-svh flex-col overflow-hidden">
				<Outlet />
			</SidebarInset>
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</SidebarProvider>
	);
}
