import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	useDeleteLibraryResume,
	useLibraryResume,
	useUpdateLibraryResume,
} from "~/lib/api/library";
import type { ResumeListItem } from "~/lib/api/types/library";
import { downloadFile } from "~/lib/download";
import { formatRelativeDate, prettifyName } from "~/lib/format";

import { DocumentCard } from "./document-card";
import { DocumentEditDialog } from "./document-edit-dialog";
import { DocumentPreviewDialog } from "./document-preview-dialog";

interface ResumeCardProps {
	resume: ResumeListItem;
}

export function ResumeCard({ resume }: ResumeCardProps) {
	const [previewOpen, setPreviewOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const detail = useLibraryResume(resume.id, previewOpen || editOpen);
	const deleteResume = useDeleteLibraryResume();
	const updateResume = useUpdateLibraryResume();

	const title = resume.vacancyTitle || prettifyName(resume.name) || "Resume";

	function download() {
		void downloadFile(`/api/resume/download/${resume.id}`, `${resume.name || "resume"}.pdf`);
	}

	function remove() {
		deleteResume.mutate(resume.id, { onSuccess: () => toast.success("Resume deleted") });
	}

	function saveHtml(html: string) {
		updateResume.mutate(
			{ id: resume.id, html },
			{
				onSuccess: () => {
					setEditOpen(false);
					toast.success("Resume updated");
				},
			}
		);
	}

	return (
		<>
			<DocumentCard
				icon={FileText}
				title={title}
				badge={resume.language}
				meta={`Updated ${formatRelativeDate(resume.updatedAt)}`}
				onPreview={() => setPreviewOpen(true)}
				onEdit={() => setEditOpen(true)}
				onDownload={download}
				onDelete={remove}
				deleteTitle="Delete resume?"
				deleteDescription={`"${title}" will be permanently removed.`}
			/>
			<DocumentPreviewDialog
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title={title}
				html={detail.data?.html}
				isLoading={detail.isLoading}
				error={detail.isError ? detail.error : undefined}
				onDownload={download}
			/>
			<DocumentEditDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				title={`Edit ${title}`}
				html={detail.data?.html}
				isLoading={detail.isLoading}
				error={detail.isError ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				onSave={saveHtml}
				isSaving={updateResume.isPending}
			/>
		</>
	);
}
