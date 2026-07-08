import { Download } from "lucide-react";

import { HtmlDocumentFrame } from "~/components/editor/html-document-frame";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Spinner } from "~/components/ui/spinner";
import { getErrorMessage } from "~/lib/api/errors";

interface DocumentPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	html?: string;
	isLoading: boolean;
	error?: unknown;
	onDownload: () => void;
}

export function DocumentPreviewDialog({
	open,
	onOpenChange,
	title,
	html,
	isLoading,
	error,
	onDownload,
}: DocumentPreviewDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="flex-row items-center justify-between gap-4 border-b p-4">
					<div className="min-w-0 space-y-0.5">
						<DialogTitle className="truncate">{title}</DialogTitle>
						<DialogDescription className="sr-only">
							Preview of the rendered document.
						</DialogDescription>
					</div>
					<Button
						size="sm"
						onClick={onDownload}
						disabled={!html}
						className="mr-8 shrink-0"
					>
						<Download className="size-4" />
						Download PDF
					</Button>
				</DialogHeader>
				<div className="bg-muted/40 min-h-0 flex-1 overflow-auto p-4">
					{isLoading && (
						<div className="flex h-full items-center justify-center">
							<Spinner className="size-5" />
						</div>
					)}
					{!isLoading && Boolean(error) && (
						<div className="text-destructive flex h-full items-center justify-center text-sm">
							{getErrorMessage(error)}
						</div>
					)}
					{!isLoading && !error && html && (
						<div className="mx-auto h-full w-full max-w-[210mm] overflow-hidden rounded-md border bg-white shadow-sm">
							<HtmlDocumentFrame html={html} title={title} className="h-full" />
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
