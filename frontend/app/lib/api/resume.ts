import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	ExportPdfInput,
	ExportPdfResult,
	GenerateResumeInput,
	GeneratedDocument,
	ResumeSummary,
	SaveResumeInput,
} from "./types/resume";

const resumeApi = {
	list: (search: string) =>
		apiClient.get<ResumeSummary[]>("/resumes", { params: { q: search || undefined } }),
	generate: (input: GenerateResumeInput) =>
		apiClient.post<GeneratedDocument>("/resume/generate", input),
	exportPdf: (input: ExportPdfInput) => apiClient.post<ExportPdfResult>("/resume/export", input),
	save: (input: SaveResumeInput) => apiClient.post<ResumeSummary>("/resume/save", input),
};

export function useResumes(search = "") {
	return useQuery({
		queryKey: queryKeys.resumes.list(search),
		queryFn: () => resumeApi.list(search),
		placeholderData: keepPreviousData,
	});
}

export function useGenerateResume() {
	return useMutation({ mutationFn: resumeApi.generate });
}

export function useExportResumePdf() {
	return useMutation({ mutationFn: resumeApi.exportPdf });
}

export function useSaveResume() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: resumeApi.save,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all }),
	});
}
