import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { useEraseAllData } from "~/lib/api/backup";

export function DangerSection() {
	const eraseAll = useEraseAllData();
	const [confirmOpen, setConfirmOpen] = useState(false);

	function handleErase() {
		eraseAll.mutate(undefined, {
			onSuccess: () => toast.success("All data erased"),
		});
	}

	return (
		<div className="space-y-5">
			<div className="space-y-1">
				<h2 className="text-base font-semibold">Danger Zone</h2>
				<p className="text-muted-foreground text-sm">
					Destructive actions that cannot be undone. Proceed with care.
				</p>
			</div>

			<div className="border-destructive/40 space-y-1.5 rounded-lg border p-4">
				<div className="space-y-4">
					<div className="space-y-1">
						<h3 className="text-sm font-medium">Erase All Data</h3>
						<p className="text-muted-foreground text-sm">
							Permanently deletes every vacancy, project, resume, cover letter, chat,
							note and stored file. Consider downloading a backup first.
						</p>
					</div>
					<Button
						variant="destructive"
						onClick={() => setConfirmOpen(true)}
						disabled={eraseAll.isPending}
					>
						{eraseAll.isPending ? (
							<Spinner className="size-4" />
						) : (
							<Trash2 className="size-4" />
						)}
						Erase
					</Button>
				</div>
			</div>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Erase all data?</AlertDialogTitle>
						<AlertDialogDescription>
							Everything stored by ReBuilt - vacancies, projects, resumes, cover
							letters, chats, notes and files - will be permanently deleted. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleErase} variant="destructive">
							Erase Everything
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
