import { Check, Copy } from "lucide-react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { useCopyToClipboard } from "~/hooks/use-copy-to-clipboard";
import { cn } from "~/lib/utils";

interface CopyMessageButtonProps {
	content: string;
	className?: string;
}

export function CopyMessageButton({ content, className }: CopyMessageButtonProps) {
	const { copied, copy } = useCopyToClipboard();
	const Icon = copied ? Check : Copy;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"text-muted-foreground hover:text-foreground size-7",
						copied && "text-emerald-500 hover:text-emerald-500",
						className
					)}
					onClick={() => void copy(content)}
				>
					<Icon className="size-3.5" />
					<span className="sr-only">Copy message</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{copied ? "Copied!" : "Copy message"}</TooltipContent>
		</Tooltip>
	);
}

interface MessageContextMenuProps {
	content: string;
	children: React.ReactNode;
}

export function MessageContextMenu({ content, children }: MessageContextMenuProps) {
	const { copied, copy } = useCopyToClipboard();
	const Icon = copied ? Check : Copy;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onSelect={() => void copy(content)}>
					<Icon className={cn(copied && "text-emerald-500")} />
					Copy message
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
