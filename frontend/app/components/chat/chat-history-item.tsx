import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { RenameChatDialog } from "~/components/chat/rename-chat-dialog";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Chat } from "~/lib/api/types/chat";
import { formatRelativeDate } from "~/lib/format";
import { cn } from "~/lib/utils";

interface ChatHistoryItemProps {
	chat: Chat;
	isActive: boolean;
	isUpdating: boolean;
	onTogglePin: () => void;
	onRename: (title: string) => void;
	onDelete: () => void;
	onNavigate?: () => void;
}

export function ChatHistoryItem({
	chat,
	isActive,
	isUpdating,
	onTogglePin,
	onRename,
	onDelete,
	onNavigate,
}: ChatHistoryItemProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<div
			className={cn(
				"group/chat-item hover:bg-accent relative rounded-lg transition-colors",
				isActive && "bg-accent"
			)}
		>
			<Link to={`/chat/${chat.id}`} onClick={onNavigate} className="block px-3 py-2 pr-9">
				<span className="flex items-center gap-1.5">
					{chat.pinned && <Pin className="text-muted-foreground size-3 shrink-0" />}
					<span className="min-w-0 flex-1 truncate text-sm font-medium">
						{chat.title}
					</span>
				</span>
				<span className="text-muted-foreground block text-xs">
					{formatRelativeDate(chat.updatedAt)}
				</span>
			</Link>

			<div
				className={cn(
					"absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity group-focus-within/chat-item:opacity-100 group-hover/chat-item:opacity-100",
					menuOpen && "opacity-100"
				)}
			>
				<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground size-8"
						>
							<MoreHorizontal className="size-4" />
							<span className="sr-only">Chat options</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-36">
						<DropdownMenuItem disabled={isUpdating} onSelect={onTogglePin}>
							{chat.pinned ? <PinOff /> : <Pin />}
							{chat.pinned ? "Unpin" : "Pin"}
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => setRenameOpen(true)}>
							<Pencil />
							Rename
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => setDeleteOpen(true)}
						>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<RenameChatDialog
				open={renameOpen}
				onOpenChange={setRenameOpen}
				currentTitle={chat.title}
				isPending={isUpdating}
				onRename={(title) => {
					onRename(title);
					setRenameOpen(false);
				}}
			/>
			<ConfirmDelete
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={onDelete}
				title="Delete this chat?"
				description="The conversation and its attachments will be permanently removed."
			/>
		</div>
	);
}
