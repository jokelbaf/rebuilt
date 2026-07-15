import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	CoverLetterDocument,
	CoverLetterListItem,
	ResumeDocument,
	ResumeListItem,
	UpdateLibraryDocumentInput,
} from "./types/library";

const libraryApi = {
	listResumes: () => apiClient.get<ResumeListItem[]>("/library/resumes"),
	getResume: (id: string) => apiClient.get<ResumeDocument>(`/library/resumes/${id}`),
	updateResume: ({ id, html }: UpdateLibraryDocumentInput) =>
		apiClient.patch<ResumeDocument>(`/library/resumes/${id}`, { html }),
	removeResume: (id: string) => apiClient.delete<void>(`/library/resumes/${id}`),
	listCoverLetters: () => apiClient.get<CoverLetterListItem[]>("/library/cover-letters"),
	getCoverLetter: (id: string) =>
		apiClient.get<CoverLetterDocument>(`/library/cover-letters/${id}`),
	updateCoverLetter: ({ id, html }: UpdateLibraryDocumentInput) =>
		apiClient.patch<CoverLetterDocument>(`/library/cover-letters/${id}`, { html }),
	removeCoverLetter: (id: string) => apiClient.delete<void>(`/library/cover-letters/${id}`),
};

export function useLibraryResumes() {
	return useQuery({ queryKey: queryKeys.library.resumes, queryFn: libraryApi.listResumes });
}

export function useLibraryResume(id: string | undefined, enabled = true) {
	return useQuery({
		queryKey: queryKeys.library.resume(id ?? ""),
		queryFn: () => libraryApi.getResume(id as string),
		enabled: enabled && Boolean(id),
	});
}

export function useDeleteLibraryResume() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: libraryApi.removeResume,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.library.resumes }),
	});
}

export function useUpdateLibraryResume() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: libraryApi.updateResume,
		onSuccess: (resume) => {
			queryClient.setQueryData(queryKeys.library.resume(resume.id), resume);
			void queryClient.invalidateQueries({ queryKey: queryKeys.library.resumes });
			void queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all });
		},
	});
}

export function useLibraryCoverLetters() {
	return useQuery({
		queryKey: queryKeys.library.coverLetters,
		queryFn: libraryApi.listCoverLetters,
	});
}

export function useLibraryCoverLetter(id: string | undefined, enabled = true) {
	return useQuery({
		queryKey: queryKeys.library.coverLetter(id ?? ""),
		queryFn: () => libraryApi.getCoverLetter(id as string),
		enabled: enabled && Boolean(id),
	});
}

export function useDeleteLibraryCoverLetter() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: libraryApi.removeCoverLetter,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.library.coverLetters }),
	});
}

export function useUpdateLibraryCoverLetter() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: libraryApi.updateCoverLetter,
		onSuccess: (coverLetter) => {
			queryClient.setQueryData(queryKeys.library.coverLetter(coverLetter.id), coverLetter);
			void queryClient.invalidateQueries({ queryKey: queryKeys.library.coverLetters });
		},
	});
}
