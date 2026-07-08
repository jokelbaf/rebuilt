import { useMutation } from "@tanstack/react-query";

import { apiClient } from "./client";
import type { GenerateCoverLetterInput, SaveCoverLetterInput } from "./types/cover-letter";
import type { ExportPdfInput, ExportPdfResult, GeneratedDocument } from "./types/resume";

const coverLetterApi = {
	generate: (input: GenerateCoverLetterInput) =>
		apiClient.post<GeneratedDocument>("/cover-letter/generate", input),
	exportPdf: (input: ExportPdfInput) =>
		apiClient.post<ExportPdfResult>("/cover-letter/export", input),
	save: (input: SaveCoverLetterInput) =>
		apiClient.post<{ name: string }>("/cover-letter/save", input),
};

export function useGenerateCoverLetter() {
	return useMutation({ mutationFn: coverLetterApi.generate });
}

export function useExportCoverLetterPdf() {
	return useMutation({ mutationFn: coverLetterApi.exportPdf });
}

export function useSaveCoverLetter() {
	return useMutation({ mutationFn: coverLetterApi.save });
}
