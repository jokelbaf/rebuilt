import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

const TITLE_LIMIT = 80;

interface RenameChatDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentTitle: string;
	isPending: boolean;
	onRename: (title: string) => void;
}

export function RenameChatDialog({
	open,
	onOpenChange,
	currentTitle,
	isPending,
	onRename,
}: RenameChatDialogProps) {
	const [title, setTitle] = useState(currentTitle);
	const trimmed = title.trim();
	const canSave = trimmed.length > 0 && trimmed !== currentTitle && !isPending;

	function handleOpenChange(next: boolean) {
		if (next) setTitle(currentTitle);
		onOpenChange(next);
	}

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (canSave) onRename(trimmed);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Rename chat</DialogTitle>
					<DialogDescription>Give this conversation a clearer name.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						maxLength={TITLE_LIMIT}
						placeholder="Chat name"
						autoFocus
					/>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSave}>
							{isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
