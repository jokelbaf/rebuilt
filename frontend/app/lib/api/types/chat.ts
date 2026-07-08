export type ChatRole = "user" | "assistant";

export type ChatContextType = "vacancy" | "project" | "profile" | "experience";

export interface ChatContextRef {
	type: ChatContextType;
	id: string;
	title: string;
}

export interface ChatAttachment {
	name: string;
	mediaType: string | null;
	size: number;
}

export interface Chat {
	id: string;
	title: string;
	provider: string;
	model: string;
	effort: string | null;
	pinned: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ChatUpdateInput {
	title?: string;
	pinned?: boolean;
}

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	context: ChatContextRef[];
	attachments: ChatAttachment[];
	createdAt: string;
}

export interface ChatDetail extends Chat {
	messages: ChatMessage[];
}

export interface AiModel {
	id: string;
	label: string;
	description: string;
	default: boolean;
}

export interface AiModelCatalog {
	models: AiModel[];
	efforts: string[];
}

export type ChatStreamEvent =
	| { type: "delta"; text: string }
	| { type: "tool"; name: string; summary: string }
	| { type: "done"; message: ChatMessage; title: string | null }
	| { type: "error"; message: string };
