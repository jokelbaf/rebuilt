import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type { CreateGitSourceInput, GitOwner, GitRepo, GitSource } from "./types/git";

const gitApi = {
	listSources: () => apiClient.get<GitSource[]>("/git/sources"),
	createSource: (input: CreateGitSourceInput) => apiClient.post<GitSource>("/git/sources", input),
	removeSource: (id: string) => apiClient.delete<void>(`/git/sources/${id}`),
	listOwners: () => apiClient.get<GitOwner[]>("/git/owners"),
	listRepos: (owner: string, search: string) =>
		apiClient.get<GitRepo[]>(`/git/owners/${owner}/repos`, {
			params: { q: search || undefined },
		}),
};

export function useGitSources() {
	return useQuery({ queryKey: queryKeys.git.sources, queryFn: gitApi.listSources });
}

export function useCreateGitSource() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: gitApi.createSource,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.git.sources }),
	});
}

export function useDeleteGitSource() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: gitApi.removeSource,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.git.sources }),
	});
}

export function useGitOwners(enabled: boolean) {
	return useQuery({ queryKey: queryKeys.git.owners, queryFn: gitApi.listOwners, enabled });
}

export function useGitRepos(owner: string | undefined, search: string) {
	return useQuery({
		queryKey: queryKeys.git.repos(owner ?? "", search),
		queryFn: () => gitApi.listRepos(owner as string, search),
		enabled: Boolean(owner),
	});
}
