import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	CoverLetterDocument,
	CoverLetterListItem,
	ResumeDocument,
	ResumeListItem,
} from "./types/library";

const libraryApi = {
	listResumes: () => apiClient.get<ResumeListItem[]>("/library/resumes"),
	getResume: (id: string) => apiClient.get<ResumeDocument>(`/library/resumes/${id}`),
	removeResume: (id: string) => apiClient.delete<void>(`/library/resumes/${id}`),
	listCoverLetters: () => apiClient.get<CoverLetterListItem[]>("/library/cover-letters"),
	getCoverLetter: (id: string) =>
		apiClient.get<CoverLetterDocument>(`/library/cover-letters/${id}`),
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
