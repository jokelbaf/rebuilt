import { MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "~/components/common/search-input";
import { ErrorState } from "~/components/common/states";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import { useChats, useDeleteChat, useUpdateChat } from "~/lib/api/chat";
import { cn } from "~/lib/utils";

import { ChatHistoryItem } from "./chat-history-item";

interface ChatHistoryPanelProps {
	activeChatId?: string;
	className?: string;
	onNavigate?: () => void;
}

export function ChatHistoryPanel({ activeChatId, className, onNavigate }: ChatHistoryPanelProps) {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 250);
	const { data, isLoading, isError, error, refetch } = useChats(debouncedSearch);
	const deleteChat = useDeleteChat();
	const updateChat = useUpdateChat();
	const showSkeleton = useDelayedFlag(isLoading);

	const chats = data ?? [];

	function handleDelete(id: string) {
		deleteChat.mutate(id, {
			onSuccess: () => {
				toast.success("Chat deleted");
				if (id === activeChatId) navigate("/chat", { replace: true });
			},
		});
	}

	function handleTogglePin(id: string, pinned: boolean) {
		updateChat.mutate({ id, input: { pinned } });
	}

	function handleRename(id: string, title: string) {
		updateChat.mutate(
			{ id, input: { title } },
			{ onSuccess: () => toast.success("Chat renamed") }
		);
	}

	function handleNewChat() {
		navigate("/chat");
		onNavigate?.();
	}

	return (
		<div className={cn("flex flex-col gap-3 p-3", className)}>
			<Button variant="outline" size="sm" className="justify-start" onClick={handleNewChat}>
				<Plus className="size-4" />
				New Chat
			</Button>
			<SearchInput value={search} onChange={setSearch} placeholder="Search chats..." />

			<div className="-mx-1 flex-1 overflow-y-auto px-1">
				{showSkeleton && (
					<div className="space-y-2">
						{Array.from({ length: 6 }).map((_, index) => (
							<Skeleton key={index} className="h-12 w-full rounded-lg" />
						))}
					</div>
				)}

				{isError && (
					<ErrorState
						error={error}
						onRetry={() => refetch()}
						title="Couldn't load chats"
						className="border-none"
					/>
				)}

				{!isLoading && !isError && chats.length === 0 && (
					<div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-xs">
						<MessageSquare className="size-5" />
						{debouncedSearch ? "No chats match your search." : "No chats yet."}
					</div>
				)}

				<div className="space-y-0.5">
					{chats.map((chat) => (
						<ChatHistoryItem
							key={chat.id}
							chat={chat}
							isActive={chat.id === activeChatId}
							isUpdating={updateChat.isPending}
							onTogglePin={() => handleTogglePin(chat.id, !chat.pinned)}
							onRename={(title) => handleRename(chat.id, title)}
							onDelete={() => handleDelete(chat.id)}
							onNavigate={onNavigate}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
