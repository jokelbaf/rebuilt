import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	CreateTemplateInput,
	Template,
	TemplateSummary,
	UpdateTemplateInput,
} from "./types/templates";

const templatesApi = {
	list: () => apiClient.get<TemplateSummary[]>("/templates"),
	get: (name: string) => apiClient.get<Template>(`/templates/${name}`),
	create: (input: CreateTemplateInput) => apiClient.post<Template>("/templates", input),
	update: (name: string, input: UpdateTemplateInput) =>
		apiClient.put<Template>(`/templates/${name}`, input),
	remove: (name: string) => apiClient.delete<void>(`/templates/${name}`),
};

export function useTemplates() {
	return useQuery({ queryKey: queryKeys.templates.all, queryFn: templatesApi.list });
}

export function useTemplate(name: string | undefined) {
	return useQuery({
		queryKey: queryKeys.templates.detail(name ?? ""),
		queryFn: () => templatesApi.get(name as string),
		enabled: Boolean(name),
	});
}

export function useCreateTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: templatesApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
	});
}

export function useUpdateTemplate(name: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateTemplateInput) => templatesApi.update(name, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(name) });
		},
	});
}

export function useDeleteTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: templatesApi.remove,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
	});
}
