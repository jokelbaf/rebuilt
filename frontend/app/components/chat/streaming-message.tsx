import { MarkdownPreview } from "~/components/editor/markdown-preview";
import { Spinner } from "~/components/ui/spinner";

import { ToolActivityList } from "./tool-activity";
import type { ToolActivity } from "./use-chat";

interface StreamingMessageProps {
	text: string;
	tools: ToolActivity[];
}

export function StreamingMessage({ text, tools }: StreamingMessageProps) {
	return (
		<div className="space-y-3">
			<ToolActivityList tools={tools} active />
			{text ? (
				<div className="relative">
					<MarkdownPreview content={text} className="prose-pre:max-w-full" />
					<span className="bg-primary ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle" />
				</div>
			) : (
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<Spinner className="size-4" />
					Thinking...
				</div>
			)}
		</div>
	);
}
