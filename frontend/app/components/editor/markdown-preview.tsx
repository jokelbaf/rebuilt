import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "~/lib/utils";

export function MarkdownPreview({ content, className }: { content: string; className?: string }) {
	if (!content.trim()) {
		return <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>;
	}

	return (
		<div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
		</div>
	);
}
