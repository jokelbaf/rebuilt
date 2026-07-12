import { useState } from "react";
import { toast } from "sonner";

import {
	useExportCoverLetterPdf,
	useGenerateCoverLetter,
	useSaveCoverLetter,
} from "~/lib/api/cover-letter";
import { useResumes } from "~/lib/api/resume";
import type { ExportPdfResult, GeneratedDocument } from "~/lib/api/types/resume";
import { downloadFile } from "~/lib/download";
import { slugify } from "~/lib/format";

export function useCoverLetterBuilder() {
	const { data: resumes } = useResumes();
	const generate = useGenerateCoverLetter();
	const exportPdf = useExportCoverLetterPdf();
	const save = useSaveCoverLetter();

	const [resumeId, setResumeId] = useState<string>();
	const [templateId, setTemplateId] = useState<string>();
	const [notes, setNotes] = useState("");
	const [generated, setGenerated] = useState<GeneratedDocument>();
	const [html, setHtml] = useState("");
	const [exportResult, setExportResult] = useState<ExportPdfResult>();

	const selectedResume = (resumes ?? []).find((resume) => resume.id === resumeId);

	function generateDocument() {
		if (!resumeId || !templateId) return;
		generate.mutate(
			{ resumeId, templateId, notes },
			{
				onSuccess: (document) => {
					setGenerated(document);
					setHtml(document.html);
					setExportResult(undefined);
				},
			}
		);
	}

	function exportDocument() {
		if (!generated) return;
		exportPdf.mutate({ id: generated.id, html }, { onSuccess: setExportResult });
	}

	function downloadDocument() {
		if (!generated || !selectedResume || !exportResult) return;
		const name = slugify(`${selectedResume.name}-cover-letter`) || "cover-letter";
		save.mutate(
			{ id: generated.id, name, html, resumeId: selectedResume.id },
			{
				onSuccess: () => {
					toast.success("Cover letter saved");
					void downloadFile(exportResult.downloadUrl, exportResult.fileName);
				},
			}
		);
	}

	return {
		state: { resumeId, templateId, notes, generated, html, exportResult, selectedResume },
		actions: {
			setResumeId,
			setTemplateId,
			setNotes,
			setHtml,
			generateDocument,
			exportDocument,
			downloadDocument,
		},
		status: {
			isGenerating: generate.isPending,
			isExporting: exportPdf.isPending,
			isSaving: save.isPending,
		},
	};
}
