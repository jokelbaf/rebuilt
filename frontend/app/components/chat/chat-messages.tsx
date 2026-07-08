import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

import { Skeleton } from "~/components/ui/skeleton";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import type { ChatMessage } from "~/lib/api/types/chat";

import { ChatMessageItem } from "./chat-message";
import { StreamingMessage } from "./streaming-message";
import type { ToolActivity } from "./use-chat";

const STICKY_THRESHOLD = 96;

interface ChatMessagesProps {
	messages: ChatMessage[];
	streamingUserMessage: ChatMessage | null;
	streamingText: string;
	streamingTools: ToolActivity[];
	isStreaming: boolean;
	lastError: string | null;
}

export function ChatMessages({
	messages,
	streamingUserMessage,
	streamingText,
	streamingTools,
	isStreaming,
	lastError,
}: ChatMessagesProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const stickyRef = useRef(true);

	useEffect(() => {
		const container = containerRef.current;
		if (container && stickyRef.current) {
			container.scrollTop = container.scrollHeight;
		}
	}, [messages.length, streamingText, streamingTools.length, lastError]);

	function handleScroll() {
		const container = containerRef.current;
		if (!container) return;
		const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
		stickyRef.current = distance < STICKY_THRESHOLD;
	}

	return (
		<div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
			<div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
				{messages.map((message) => (
					<ChatMessageItem key={message.id} message={message} />
				))}
				{streamingUserMessage && <ChatMessageItem message={streamingUserMessage} />}
				{isStreaming && <StreamingMessage text={streamingText} tools={streamingTools} />}
				{lastError && (
					<div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
						<AlertTriangle className="mt-0.5 size-4 shrink-0" />
						{lastError}
					</div>
				)}
			</div>
		</div>
	);
}

export function ChatMessagesSkeleton() {
	const show = useDelayedFlag(true);
	if (!show) return null;

	return (
		<div className="flex-1 overflow-hidden">
			<div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
				<div className="flex justify-end">
					<Skeleton className="h-14 w-2/5 rounded-xl" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-11/12" />
					<Skeleton className="h-4 w-3/5" />
				</div>
				<div className="flex justify-end">
					<Skeleton className="h-10 w-1/3 rounded-xl" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</div>
		</div>
	);
}
