import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { sendChatMessage, useChat, useCreateChat } from "~/lib/api/chat";
import { getErrorMessage } from "~/lib/api/errors";
import { queryKeys } from "~/lib/api/query-keys";
import type { ChatContextRef, ChatDetail, ChatMessage } from "~/lib/api/types/chat";

export interface ToolActivity {
	id: number;
	name: string;
	summary: string;
}

interface TurnOverlay {
	userMessage: ChatMessage | null;
	pendingText: string;
	tools: ToolActivity[];
}

interface TurnError {
	chatId: string | undefined;
	message: string | null;
}

export interface SendMessageInput {
	content: string;
	model: string;
	effort: string | null;
	context: ChatContextRef[];
	files: File[];
}

const emptyTurn: TurnOverlay = { userMessage: null, pendingText: "", tools: [] };

function buildOptimisticMessage(input: SendMessageInput): ChatMessage {
	return {
		id: `optimistic-${Date.now()}`,
		role: "user",
		content: input.content,
		context: input.context,
		attachments: input.files.map((file) => ({
			name: file.name,
			mediaType: file.type || null,
			size: file.size,
		})),
		createdAt: new Date().toISOString(),
	};
}

export function useChatSession(chatId: string | undefined) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const createChat = useCreateChat();

	const [isStreaming, setIsStreaming] = useState(false);
	const [turn, setTurn] = useState<TurnOverlay>(emptyTurn);
	const [turnError, setTurnError] = useState<TurnError>({ chatId, message: null });
	const abortRef = useRef<AbortController | null>(null);
	const streamChatIdRef = useRef<string | null>(null);
	const toolIdRef = useRef(0);

	const chatQuery = useChat(chatId, { enabled: !isStreaming });
	const lastError = turnError.chatId === chatId ? turnError.message : null;

	const stop = useCallback(() => {
		abortRef.current?.abort();
	}, []);

	useEffect(() => {
		if (streamChatIdRef.current && streamChatIdRef.current !== chatId) {
			stop();
		}
	}, [chatId, stop]);

	const send = useCallback(
		async (input: SendMessageInput): Promise<boolean> => {
			if (isStreaming) return false;
			setTurnError({ chatId, message: null });

			let id = chatId;
			if (!id) {
				let created;
				try {
					created = await createChat.mutateAsync({
						model: input.model,
						effort: input.effort,
					});
				} catch {
					return false;
				}
				id = created.id;
				queryClient.setQueryData<ChatDetail>(queryKeys.chats.detail(id), {
					...created,
					messages: [],
				});
				navigate(`/chat/${id}`, { replace: true });
			}

			const userMessage = buildOptimisticMessage(input);
			const controller = new AbortController();
			abortRef.current = controller;
			streamChatIdRef.current = id;
			setTurn({ userMessage, pendingText: "", tools: [] });
			setIsStreaming(true);

			const refresh = async () => {
				await queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(id) });
				await queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
			};

			let sawError = false;
			try {
				await sendChatMessage({
					chatId: id,
					content: input.content,
					model: input.model,
					effort: input.effort,
					context: input.context,
					files: input.files,
					signal: controller.signal,
					onEvent: (event) => {
						switch (event.type) {
							case "delta":
								setTurn((prev) => ({
									...prev,
									pendingText: prev.pendingText + event.text,
								}));
								break;
							case "tool":
								setTurn((prev) => ({
									...prev,
									tools: [
										...prev.tools,
										{
											id: ++toolIdRef.current,
											name: event.name,
											summary: event.summary,
										},
									],
								}));
								break;
							case "done":
								queryClient.setQueryData<ChatDetail>(
									queryKeys.chats.detail(id),
									(previous) =>
										previous && {
											...previous,
											title: event.title ?? previous.title,
											messages: [
												...previous.messages,
												userMessage,
												event.message,
											],
										}
								);
								setTurn(emptyTurn);
								void queryClient.invalidateQueries({
									queryKey: queryKeys.chats.all,
								});
								break;
							case "error":
								sawError = true;
								setTurnError({ chatId: id, message: event.message });
								break;
						}
					},
				});
				if (sawError) await refresh();
				return true;
			} catch (error) {
				const aborted = error instanceof DOMException && error.name === "AbortError";
				if (!aborted) {
					setTurnError({ chatId: id, message: getErrorMessage(error) });
					toast.error(getErrorMessage(error));
				}
				await refresh();
				return false;
			} finally {
				abortRef.current = null;
				streamChatIdRef.current = null;
				setIsStreaming(false);
				setTurn(emptyTurn);
			}
		},
		[chatId, createChat, isStreaming, navigate, queryClient]
	);

	return {
		chat: chatQuery.data,
		messages: chatQuery.data?.messages ?? [],
		isLoading: chatQuery.isLoading,
		isError: chatQuery.isError,
		error: chatQuery.error,
		refetch: chatQuery.refetch,
		isStreaming,
		turn,
		lastError,
		send,
		stop,
	};
}
