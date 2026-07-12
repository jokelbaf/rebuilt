import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteLibraryCoverLetter, useLibraryCoverLetter } from "~/lib/api/library";
import type { CoverLetterListItem } from "~/lib/api/types/library";
import { downloadFile } from "~/lib/download";
import { formatRelativeDate, prettifyName } from "~/lib/format";

import { DocumentCard } from "./document-card";
import { DocumentPreviewDialog } from "./document-preview-dialog";

interface CoverLetterCardProps {
	coverLetter: CoverLetterListItem;
}

export function CoverLetterCard({ coverLetter }: CoverLetterCardProps) {
	const [previewOpen, setPreviewOpen] = useState(false);
	const detail = useLibraryCoverLetter(coverLetter.id, previewOpen);
	const deleteCoverLetter = useDeleteLibraryCoverLetter();

	const title = coverLetter.vacancyTitle || prettifyName(coverLetter.name) || "Cover letter";

	function download() {
		void downloadFile(
			`/api/cover-letter/download/${coverLetter.id}`,
			`${coverLetter.name || "cover-letter"}.pdf`
		);
	}

	function remove() {
		deleteCoverLetter.mutate(coverLetter.id, {
			onSuccess: () => toast.success("Cover letter deleted"),
		});
	}

	return (
		<>
			<DocumentCard
				icon={Mail}
				title={title}
				meta={`Updated ${formatRelativeDate(coverLetter.updatedAt)}`}
				onPreview={() => setPreviewOpen(true)}
				onDownload={download}
				onDelete={remove}
				deleteTitle="Delete cover letter?"
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
		</>
	);
}
