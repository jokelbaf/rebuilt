import { Trash2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

interface ConfirmDeleteProps {
	onConfirm: () => void;
	title?: string;
	description?: string;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ConfirmDelete({
	onConfirm,
	title = "Delete this item?",
	description = "This action is permanent and cannot be undone.",
	trigger,
	open,
	onOpenChange,
}: ConfirmDeleteProps) {
	const controlled = open !== undefined;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			{!controlled && (
				<AlertDialogTrigger asChild>
					{trigger ?? (
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-destructive size-8"
						>
							<Trash2 className="size-4" />
							<span className="sr-only">Delete</span>
						</Button>
					)}
				</AlertDialogTrigger>
			)}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} variant="destructive">
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
