import { useState } from "react";
import { Outlet } from "react-router";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { SettingsDialog } from "~/components/settings/settings-dialog";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { UsageDialog } from "~/components/usage/usage-dialog";

export default function AppLayout() {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [usageOpen, setUsageOpen] = useState(false);

	return (
		<SidebarProvider>
			<AppSidebar
				onOpenSettings={() => setSettingsOpen(true)}
				onOpenUsage={() => setUsageOpen(true)}
			/>
			<SidebarInset className="flex h-svh flex-col overflow-hidden">
				<Outlet />
			</SidebarInset>
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
			<UsageDialog open={usageOpen} onOpenChange={setUsageOpen} />
		</SidebarProvider>
	);
}
