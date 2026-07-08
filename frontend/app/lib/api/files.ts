import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	CreateMarkdownFileInput,
	FileCollection,
	MarkdownFile,
	MarkdownFileSummary,
	UpdateMarkdownFileInput,
} from "./types/files";

const filesApi = {
	list: (collection: FileCollection, search: string) =>
		apiClient.get<MarkdownFileSummary[]>(`/${collection}`, {
			params: { q: search || undefined },
		}),
	get: (collection: FileCollection, name: string) =>
		apiClient.get<MarkdownFile>(`/${collection}/${name}`),
	create: (collection: FileCollection, input: CreateMarkdownFileInput) =>
		apiClient.post<MarkdownFile>(`/${collection}`, input),
	update: (collection: FileCollection, name: string, input: UpdateMarkdownFileInput) =>
		apiClient.put<MarkdownFile>(`/${collection}/${name}`, input),
	remove: (collection: FileCollection, name: string) =>
		apiClient.delete<void>(`/${collection}/${name}`),
};

export function useMarkdownFiles(collection: FileCollection, search: string) {
	return useQuery({
		queryKey: queryKeys.files.list(collection, search),
		queryFn: () => filesApi.list(collection, search),
	});
}

export function useMarkdownFile(collection: FileCollection, name: string | undefined) {
	return useQuery({
		queryKey: queryKeys.files.detail(collection, name ?? ""),
		queryFn: () => filesApi.get(collection, name as string),
		enabled: Boolean(name),
	});
}

export function useCreateMarkdownFile(collection: FileCollection) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateMarkdownFileInput) => filesApi.create(collection, input),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.files.all(collection) }),
	});
}

export function useUpdateMarkdownFile(collection: FileCollection, name: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateMarkdownFileInput) => filesApi.update(collection, name, input),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.files.all(collection) }),
	});
}

export function useDeleteMarkdownFile(collection: FileCollection) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (name: string) => filesApi.remove(collection, name),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.files.all(collection) }),
	});
}
