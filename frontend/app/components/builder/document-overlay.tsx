import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

interface DocumentOverlayProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	html: string;
	onSave: (html: string) => void;
	title?: string;
}

interface DocumentEditorBodyProps {
	html: string;
	title: string;
	onSave: (html: string) => void;
}

function DocumentEditorBody({ html, title, onSave }: DocumentEditorBodyProps) {
	const [draft, setDraft] = useState(html);

	return (
		<>
			<SheetHeader className="border-b">
				<SheetTitle>{title}</SheetTitle>
				<SheetDescription className="sr-only">
					Edit the generated HTML and preview the result.
				</SheetDescription>
			</SheetHeader>
			<div className="flex min-h-0 flex-1 p-4">
				<HtmlEditor value={draft} onChange={setDraft} />
			</div>
			<SheetFooter className="flex-row justify-end gap-2 border-t">
				<Button onClick={() => onSave(draft)}>
					<Save className="size-4" />
					Save
				</Button>
			</SheetFooter>
		</>
	);
}

export function DocumentOverlay({
	open,
	onOpenChange,
	html,
	onSave,
	title = "Edit document",
}: DocumentOverlayProps) {
	function handleSave(next: string) {
		onSave(next);
		onOpenChange(false);
		toast.success("Changes saved");
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="
					flex h-full w-full flex-col gap-0 p-0

					data-[side=right]:w-[95vw]
					sm:data-[side=right]:w-[85vw]
					lg:data-[side=right]:w-[80vw]

					max-w-none!
				"
			>
				<DocumentEditorBody key={html} html={html} title={title} onSave={handleSave} />
			</SheetContent>
		</Sheet>
	);
}
