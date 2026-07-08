import { History } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

import { ChatComposer } from "~/components/chat/chat-composer";
import { ChatHistoryPanel } from "~/components/chat/chat-history-panel";
import { ChatMessages, ChatMessagesSkeleton } from "~/components/chat/chat-messages";
import { ChatWelcome } from "~/components/chat/chat-welcome";
import { useChatSession } from "~/components/chat/use-chat";
import type { ComposerSubmission } from "~/components/chat/use-composer";
import { ErrorState } from "~/components/common/states";
import { PageHeader } from "~/components/layout/page";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { useAiModelCatalog } from "~/lib/api/chat";

interface ComposerChoice {
	chatId: string | undefined;
	model: string | null;
	effort: string | null | undefined;
}

export default function ChatPage() {
	const { id } = useParams<{ id: string }>();
	const session = useChatSession(id);
	const { data: catalog } = useAiModelCatalog();
	const [choice, setChoice] = useState<ComposerChoice>({
		chatId: id,
		model: null,
		effort: undefined,
	});
	const [historyOpen, setHistoryOpen] = useState(false);

	const models = catalog?.models ?? [];
	const modelOverride = choice.chatId === id ? choice.model : null;
	const effortOverride = choice.chatId === id ? choice.effort : undefined;
	const defaultModel = models.find((m) => m.default)?.id ?? models[0]?.id ?? "sonnet";
	const model = modelOverride ?? session.chat?.model ?? defaultModel;
	const effort = effortOverride !== undefined ? effortOverride : (session.chat?.effort ?? null);

	const hasConversation =
		session.messages.length > 0 || session.turn.userMessage !== null || session.isStreaming;
	const showSkeleton = Boolean(id) && session.isLoading;

	function handleSend(input: ComposerSubmission) {
		return session.send({ ...input, model, effort });
	}

	function handleSuggestion(prompt: string) {
		void session.send({ content: prompt, model, effort, context: [], files: [] });
	}

	return (
		<>
			<PageHeader
				title={session.chat?.title ?? "AI Chat"}
				description={
					session.chat
						? "AI Chat"
						: "Chat with AI about your vacancies, projects and experience."
				}
				actions={
					<Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
						<SheetTrigger asChild>
							<Button variant="outline" size="sm" className="md:hidden">
								<History className="size-4" />
								History
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-80 p-0">
							<SheetHeader className="border-b">
								<SheetTitle>Chats</SheetTitle>
							</SheetHeader>
							<ChatHistoryPanel
								activeChatId={id}
								className="min-h-0 flex-1"
								onNavigate={() => setHistoryOpen(false)}
							/>
						</SheetContent>
					</Sheet>
				}
			/>

			<div className="flex min-h-0 flex-1">
				<ChatHistoryPanel
					activeChatId={id}
					className="hidden w-64 shrink-0 border-r md:flex"
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					{session.isError ? (
						<div className="flex-1 overflow-y-auto p-6">
							<ErrorState
								error={session.error}
								onRetry={() => void session.refetch()}
								title="Couldn't load this chat"
							/>
						</div>
					) : showSkeleton ? (
						<ChatMessagesSkeleton />
					) : hasConversation ? (
						<ChatMessages
							messages={session.messages}
							streamingUserMessage={session.turn.userMessage}
							streamingText={session.turn.pendingText}
							streamingTools={session.turn.tools}
							isStreaming={session.isStreaming}
							lastError={session.lastError}
						/>
					) : (
						<div className="min-h-0 flex-1">
							<ChatWelcome onSuggestion={handleSuggestion} />
						</div>
					)}

					<ChatComposer
						isStreaming={session.isStreaming}
						model={model}
						effort={effort}
						onModelChange={(next) => setChoice({ chatId: id, model: next, effort })}
						onEffortChange={(next) => setChoice({ chatId: id, model, effort: next })}
						onSend={handleSend}
						onStop={session.stop}
					/>
				</div>
			</div>
		</>
	);
}
