import { Settings } from "lucide-react";
import { Link, useLocation } from "react-router";

import { ThemeMenuButton } from "~/components/layout/theme-menu-button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";
import { isNavItemActive, navGroups } from "~/lib/navigation";

export function AppSidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
	const { pathname } = useLocation();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild size="lg" tooltip="ReBuilt">
							<Link to="/resume">
								<img
									src="/favicon.png"
									alt="ReBuilt"
									className="size-10 shrink-0 rounded-lg object-cover group-data-[collapsible=icon]:size-8"
								/>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold">ReBuilt</span>
									<span className="text-muted-foreground text-xs">
										Resume builder
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.url}>
										<SidebarMenuButton
											asChild
											isActive={isNavItemActive(pathname, item.url)}
											tooltip={item.title}
										>
											<Link to={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<ThemeMenuButton />
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={onOpenSettings} tooltip="Settings">
							<Settings />
							<span>Settings</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
