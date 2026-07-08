import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

interface PageHeaderProps {
	title: React.ReactNode;
	description?: string;
	actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="h-5" />
			<div className="min-w-0 flex-1">
				{typeof title === "string" ? (
					<h1 className="truncate text-base leading-tight font-semibold">{title}</h1>
				) : (
					title
				)}
				{description && (
					<p className="text-muted-foreground truncate text-xs">{description}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</header>
	);
}

export function PageBody({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex-1 overflow-y-auto">
			<div className={cn("mx-auto w-full max-w-5xl p-4 md:p-6", className)}>{children}</div>
		</div>
	);
}

export function PageContent({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex min-h-0 flex-1 flex-col p-4 md:p-6", className)}>{children}</div>
	);
}
