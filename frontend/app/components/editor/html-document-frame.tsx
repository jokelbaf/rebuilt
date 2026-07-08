import { cn } from "~/lib/utils";

interface HtmlDocumentFrameProps {
	html: string;
	title?: string;
	className?: string;
}

export function HtmlDocumentFrame({
	html,
	title = "Document preview",
	className,
}: HtmlDocumentFrameProps) {
	return (
		<iframe
			title={title}
			srcDoc={html}
			sandbox="allow-same-origin"
			className={cn("h-full w-full border-0 bg-white", className)}
		/>
	);
}
