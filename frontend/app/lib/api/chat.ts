import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import { streamSse, type SseMessage } from "./sse";
import type {
	AiModelCatalog,
	Chat,
	ChatContextRef,
	ChatDetail,
	ChatMessage,
	ChatStreamEvent,
	ChatUpdateInput,
} from "./types/chat";

export interface CreateChatInput {
	model: string;
	effort: string | null;
}

const chatApi = {
	list: (search: string) =>
		apiClient.get<Chat[]>("/chats", { params: { query: search || undefined } }),
	get: (id: string) => apiClient.get<ChatDetail>(`/chats/${id}`),
	create: (input: CreateChatInput) => apiClient.post<Chat>("/chats", input),
	update: (id: string, input: ChatUpdateInput) => apiClient.patch<Chat>(`/chats/${id}`, input),
	remove: (id: string) => apiClient.delete<void>(`/chats/${id}`),
	models: (provider?: string) =>
		apiClient.get<AiModelCatalog>("/chats/models", { params: { provider } }),
};

export function useChats(search: string) {
	return useQuery({
		queryKey: queryKeys.chats.list(search),
		queryFn: () => chatApi.list(search),
	});
}

export function useChat(id: string | undefined, options: { enabled?: boolean } = {}) {
	return useQuery({
		queryKey: queryKeys.chats.detail(id ?? ""),
		queryFn: () => chatApi.get(id as string),
		enabled: Boolean(id) && (options.enabled ?? true),
	});
}

export function useCreateChat() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: chatApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chats.all }),
	});
}

export function useUpdateChat() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: ChatUpdateInput }) =>
			chatApi.update(id, input),
		onSuccess: (chat) => {
			queryClient.setQueryData<ChatDetail>(
				queryKeys.chats.detail(chat.id),
				(previous) => previous && { ...previous, ...chat }
			);
			void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
		},
	});
}

export function useDeleteChat() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: chatApi.remove,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chats.all }),
	});
}

export function useAiModelCatalog(provider?: string) {
	return useQuery({
		queryKey: queryKeys.chats.models(provider),
		queryFn: () => chatApi.models(provider),
		staleTime: Infinity,
	});
}

export interface SendChatMessageInput {
	chatId: string;
	content: string;
	model: string;
	effort: string | null;
	context: ChatContextRef[];
	files: File[];
	signal: AbortSignal;
	onEvent: (event: ChatStreamEvent) => void;
}

/** Send a chat message and stream the assistant's reply through onEvent. */
export async function sendChatMessage(input: SendChatMessageInput): Promise<void> {
	const body = new FormData();
	body.set("content", input.content);
	body.set("model", input.model);
	body.set("effort", input.effort ?? "");
	body.set("context", JSON.stringify(input.context));
	for (const file of input.files) {
		body.append("files", file);
	}

	await streamSse(`/chats/${input.chatId}/messages`, {
		body,
		signal: input.signal,
		onMessage: (message) => {
			const event = parseChatStreamEvent(message);
			if (event) input.onEvent(event);
		},
	});
}

function parseChatStreamEvent({ event, data }: SseMessage): ChatStreamEvent | null {
	let payload: unknown;
	try {
		payload = JSON.parse(data);
	} catch {
		return null;
	}
	if (typeof payload !== "object" || payload === null) return null;

	switch (event) {
		case "delta": {
			const { text } = payload as { text?: string };
			return typeof text === "string" ? { type: "delta", text } : null;
		}
		case "tool": {
			const { name, summary } = payload as { name?: string; summary?: string };
			return typeof name === "string" ? { type: "tool", name, summary: summary ?? "" } : null;
		}
		case "done": {
			const { message, title } = payload as { message?: ChatMessage; title?: string | null };
			return message ? { type: "done", message, title: title ?? null } : null;
		}
		case "error": {
			const { message } = payload as { message?: string };
			return { type: "error", message: message || "AI chat generation failed." };
		}
		default:
			return null;
	}
}
