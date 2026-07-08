import { DatabaseBackup, Download, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
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
import { Progress } from "~/components/ui/progress";
import { Spinner } from "~/components/ui/spinner";
import { useBackupExport } from "~/components/settings/use-backup-export";
import { useImportBackup } from "~/lib/api/backup";
import type { BackupSummary } from "~/lib/api/types/backup";

function summaryLine(summary: BackupSummary): string {
	return (
		`Restored ${summary.vacancies} vacancies, ${summary.projects} projects, ` +
		`${summary.resumes} resumes and ${summary.chats} chats.`
	);
}

export function BackupsSection() {
	const { isExporting, progress, exportBackup } = useBackupExport();
	const importBackup = useImportBackup();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	function handleFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		importBackup.mutate(file, {
			onSuccess: (summary) =>
				toast.success("Backup restored", {
					description: summaryLine(summary),
				}),
		});
	}

	return (
		<div className="space-y-5">
			<div className="space-y-1">
				<h2 className="text-base font-semibold">Backups</h2>
				<p className="text-muted-foreground text-sm">
					Save all of your data into a single file, or restore it from a previous backup.
				</p>
			</div>

			<div className="space-y-1.5 rounded-lg border p-4">
				<div className="space-y-4">
					<div className="space-y-1">
						<h3 className="text-sm font-medium">Download Backup</h3>
						<p className="text-muted-foreground text-sm">
							Collects the full database, chat attachments and exported documents into
							a compressed <code className="text-xs">.rebuilt</code> file.
						</p>
					</div>
					<Button onClick={() => void exportBackup()} disabled={isExporting}>
						{isExporting ? (
							<Spinner className="size-4" />
						) : (
							<Download className="size-4" />
						)}
						Download
					</Button>
				</div>
				<AnimatePresence initial={false}>
					{isExporting && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.25, ease: "easeOut" }}
							className="overflow-hidden"
						>
							<div className="flex items-center gap-3 pt-3">
								<Progress value={progress ?? 8} className="h-1.5 flex-1" />
								<span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
									{progress === null ? "…" : `${progress}%`}
								</span>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="space-y-1.5 rounded-lg border p-4">
				<div className="space-y-4">
					<div className="space-y-1">
						<h3 className="text-sm font-medium">Import Backup</h3>
						<p className="text-muted-foreground text-sm">
							Restore everything from a <code className="text-xs">.rebuilt</code>{" "}
							file. Your current data will be replaced.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => setConfirmOpen(true)}
						disabled={importBackup.isPending}
					>
						{importBackup.isPending ? (
							<Spinner className="size-4" />
						) : (
							<Upload className="size-4" />
						)}
						Import
					</Button>
				</div>
				<AnimatePresence initial={false}>
					{importBackup.isPending && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.25, ease: "easeOut" }}
							className="overflow-hidden"
						>
							<div className="text-muted-foreground flex items-center gap-2 pt-3 text-sm">
								<DatabaseBackup className="size-4 animate-pulse" />
								Restoring your data from the backup...
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".rebuilt"
				className="hidden"
				onChange={handleFilePicked}
			/>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore from Backup</AlertDialogTitle>
						<AlertDialogDescription>
							You are about to restore your data from a backup. This will erase all
							current data and replace it with the backup contents. This action cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => fileInputRef.current?.click()}>
							Choose Backup File
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
