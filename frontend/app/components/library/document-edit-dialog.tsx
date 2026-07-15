import { Save } from "lucide-react";
import { useState } from "react";

import { ErrorState, LoadingState } from "~/components/common/states";
import { HtmlEditor } from "~/components/editor/html-editor";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";

interface DocumentEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	html?: string;
	isLoading: boolean;
	error?: unknown;
	onRetry: () => void;
	onSave: (html: string) => void;
	isSaving: boolean;
}

interface DocumentEditBodyProps {
	title: string;
	html: string;
	onSave: (html: string) => void;
	isSaving: boolean;
}

function DocumentEditBody({ title, html, onSave, isSaving }: DocumentEditBodyProps) {
	const [draft, setDraft] = useState(html);

	return (
		<>
			<SheetHeader className="border-b">
				<SheetTitle>{title}</SheetTitle>
				<SheetDescription className="sr-only">
					Edit the saved HTML and preview the result.
				</SheetDescription>
			</SheetHeader>
			<div className="flex min-h-0 flex-1 p-4">
				<HtmlEditor value={draft} onChange={setDraft} />
			</div>
			<SheetFooter className="flex-row justify-end gap-2 border-t">
				<Button onClick={() => onSave(draft)} disabled={isSaving || draft === html}>
					<Save className="size-4" />
					{isSaving ? "Saving..." : "Save changes"}
				</Button>
			</SheetFooter>
		</>
	);
}

export function DocumentEditDialog({
	open,
	onOpenChange,
	title,
	html,
	isLoading,
	error,
	onRetry,
	onSave,
	isSaving,
}: DocumentEditDialogProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex h-full w-full max-w-none! flex-col gap-0 p-0 data-[side=right]:w-[95vw] sm:data-[side=right]:w-[85vw] lg:data-[side=right]:w-[80vw]"
			>
				{isLoading && <LoadingState label="Loading document..." className="h-full" />}
				{!isLoading && Boolean(error) && (
					<div className="flex h-full items-center justify-center p-6">
						<ErrorState
							error={error}
							onRetry={onRetry}
							title="Couldn't load document"
							className="w-full max-w-md"
						/>
					</div>
				)}
				{!isLoading && !error && html !== undefined && (
					<DocumentEditBody
						key={html}
						title={title}
						html={html}
						onSave={onSave}
						isSaving={isSaving}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
