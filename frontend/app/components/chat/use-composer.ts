import { useRef, useState } from "react";

import type { ChatContextRef } from "~/lib/api/types/chat";

import { useContextItems } from "./use-context-items";

const MAX_TEXTAREA_HEIGHT = 208;

interface SlashToken {
	query: string;
	start: number;
}

export interface ComposerSubmission {
	content: string;
	context: ChatContextRef[];
	files: File[];
}

interface UseComposerOptions {
	isStreaming: boolean;
	onSend: (input: ComposerSubmission) => Promise<boolean>;
}

function autosize(textarea: HTMLTextAreaElement) {
	textarea.style.height = "auto";
	textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
}

function detectSlash(value: string, caret: number): SlashToken | null {
	const before = value.slice(0, caret);
	const match = /(?:^|\s)\/([\w-]*)$/.exec(before);
	if (!match) return null;
	return { query: match[1], start: caret - match[1].length - 1 };
}

export function useComposer({ isStreaming, onSend }: UseComposerOptions) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [content, setContent] = useState("");
	const [context, setContext] = useState<ChatContextRef[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [slash, setSlash] = useState<SlashToken | null>(null);
	const [highlightIndex, setHighlightIndex] = useState(0);
	const [dragActive, setDragActive] = useState(false);

	const items = useContextItems(slash?.query ?? "", context);

	function syncSlash(textarea: HTMLTextAreaElement) {
		const caret = textarea.selectionStart ?? textarea.value.length;
		const next = detectSlash(textarea.value, caret);
		if (next?.query !== slash?.query || next?.start !== slash?.start) {
			setHighlightIndex(0);
		}
		setSlash(next);
	}

	function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		setContent(event.target.value);
		autosize(event.target);
		syncSlash(event.target);
	}

	function selectItem(item: ChatContextRef) {
		setContext((previous) => [...previous, item]);
		const textarea = textareaRef.current;
		if (textarea && slash) {
			const end = slash.start + 1 + slash.query.length;
			const next = content.slice(0, slash.start) + content.slice(end);
			setContent(next);
			requestAnimationFrame(() => {
				textarea.focus();
				textarea.setSelectionRange(slash.start, slash.start);
				autosize(textarea);
			});
		}
		setSlash(null);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (slash) {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setHighlightIndex((index) => Math.min(index + 1, Math.max(items.length - 1, 0)));
				return;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				setHighlightIndex((index) => Math.max(index - 1, 0));
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				setSlash(null);
				return;
			}
			if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
				if (items.length > 0) {
					event.preventDefault();
					selectItem(items[highlightIndex] ?? items[0]);
					return;
				}
			}
		}
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void submit();
		}
	}

	function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
		if (event.clipboardData.files.length > 0) {
			event.preventDefault();
			addFiles(event.clipboardData.files);
		}
	}

	function handleDragOver(event: React.DragEvent) {
		event.preventDefault();
		setDragActive(true);
	}

	function handleDragLeave() {
		setDragActive(false);
	}

	function handleDrop(event: React.DragEvent) {
		event.preventDefault();
		setDragActive(false);
		addFiles(event.dataTransfer.files);
	}

	function addFiles(list: FileList) {
		setFiles((previous) => {
			const next = [...previous];
			for (const file of Array.from(list)) {
				const duplicate = next.some(
					(existing) => existing.name === file.name && existing.size === file.size
				);
				if (!duplicate) next.push(file);
			}
			return next;
		});
	}

	function removeFile(index: number) {
		setFiles((previous) => previous.filter((_, i) => i !== index));
	}

	function removeContext(ref: ChatContextRef) {
		setContext((previous) =>
			previous.filter((item) => item.type !== ref.type || item.id !== ref.id)
		);
	}

	async function submit() {
		const trimmed = content.trim();
		if (isStreaming || (!trimmed && files.length === 0)) return;

		const snapshot: ComposerSubmission = { content: trimmed, context, files };
		setContent("");
		setContext([]);
		setFiles([]);
		setSlash(null);
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
		}

		const sent = await onSend(snapshot);
		if (!sent) {
			setContent(snapshot.content);
			setContext(snapshot.context);
			setFiles(snapshot.files);
		}
	}

	return {
		textareaRef,
		fileInputRef,
		content,
		context,
		files,
		slash,
		items,
		highlightIndex,
		dragActive,
		setHighlightIndex,
		selectItem,
		handleChange,
		handleKeyDown,
		handlePaste,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		addFiles,
		removeFile,
		removeContext,
		submit,
	};
}
