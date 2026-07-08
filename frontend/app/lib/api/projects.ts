import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	ImportProjectFromGitInput,
	Project,
	ProjectInput,
	ProjectSummary,
} from "./types/projects";

const projectsApi = {
	list: (search: string) =>
		apiClient.get<ProjectSummary[]>("/projects", { params: { q: search || undefined } }),
	get: (id: string) => apiClient.get<Project>(`/projects/${id}`),
	create: (input: ProjectInput) => apiClient.post<Project>("/projects", input),
	update: (id: string, input: ProjectInput) => apiClient.put<Project>(`/projects/${id}`, input),
	remove: (id: string) => apiClient.delete<void>(`/projects/${id}`),
	importFromGit: (input: ImportProjectFromGitInput) =>
		apiClient.post<Project>("/projects/import/git", input),
};

export function useProjects(search: string) {
	return useQuery({
		queryKey: queryKeys.projects.list(search),
		queryFn: () => projectsApi.list(search),
	});
}

export function useProject(id: string | undefined) {
	return useQuery({
		queryKey: queryKeys.projects.detail(id ?? ""),
		queryFn: () => projectsApi.get(id as string),
		enabled: Boolean(id),
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: projectsApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
	});
}

export function useUpdateProject(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: ProjectInput) => projectsApi.update(id, input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: projectsApi.remove,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
	});
}

export function useImportProjectFromGit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: projectsApi.importFromGit,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
	});
}
