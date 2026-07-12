import { useState } from "react";
import { toast } from "sonner";

import { useExportResumePdf, useGenerateResume, useSaveResume } from "~/lib/api/resume";
import type { ExportPdfResult, GeneratedDocument } from "~/lib/api/types/resume";
import { useVacancies } from "~/lib/api/vacancies";
import { downloadFile } from "~/lib/download";
import { slugify } from "~/lib/format";

export function useResumeBuilder() {
	const { data: vacancies } = useVacancies();
	const generate = useGenerateResume();
	const exportPdf = useExportResumePdf();
	const save = useSaveResume();

	const [vacancyId, setVacancyId] = useState<string>();
	const [language, setLanguage] = useState("");
	const [templateId, setTemplateId] = useState<string>();
	const [notes, setNotes] = useState("");
	const [generated, setGenerated] = useState<GeneratedDocument>();
	const [html, setHtml] = useState("");
	const [exportResult, setExportResult] = useState<ExportPdfResult>();

	const selectedVacancy = (vacancies ?? []).find((vacancy) => vacancy.id === vacancyId);

	function selectVacancy(id: string) {
		setVacancyId(id);
		const vacancy = (vacancies ?? []).find((item) => item.id === id);
		if (vacancy) setLanguage(vacancy.language);
	}

	function generateDocument() {
		if (!vacancyId || !templateId) return;
		generate.mutate(
			{ vacancyId, language, templateId, notes },
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
		if (!generated || !selectedVacancy || !exportResult) return;
		const name = slugify(selectedVacancy.title) || "resume";
		save.mutate(
			{ id: generated.id, name, html, vacancyId: selectedVacancy.id, language },
			{
				onSuccess: () => {
					toast.success("Resume saved");
					void downloadFile(exportResult.downloadUrl, exportResult.fileName);
				},
			}
		);
	}

	return {
		state: {
			vacancyId,
			language,
			templateId,
			notes,
			generated,
			html,
			exportResult,
			selectedVacancy,
		},
		actions: {
			selectVacancy,
			setLanguage,
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
