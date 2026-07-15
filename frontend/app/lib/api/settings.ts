import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type { AiSettings, AiSettingsUpdate, AiUsage, AppInfo } from "./types/settings";

const settingsApi = {
	getAi: () => apiClient.get<AiSettings>("/settings/ai"),
	updateAi: (input: AiSettingsUpdate) => apiClient.patch<AiSettings>("/settings/ai", input),
	getAiUsage: () => apiClient.get<AiUsage>("/settings/ai/usage"),
	getAbout: () => apiClient.get<AppInfo>("/settings/about"),
};

export function useAiSettings() {
	return useQuery({
		queryKey: queryKeys.settings.ai,
		queryFn: settingsApi.getAi,
	});
}

export function useUpdateAiSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: settingsApi.updateAi,
		onSuccess: (settings) => {
			queryClient.setQueryData(queryKeys.settings.ai, settings);
			void queryClient.invalidateQueries({ queryKey: queryKeys.chats.modelCatalogs });
			void queryClient.invalidateQueries({ queryKey: queryKeys.settings.usage });
		},
	});
}

export function useAiUsage(enabled = true) {
	return useQuery({
		queryKey: queryKeys.settings.usage,
		queryFn: settingsApi.getAiUsage,
		enabled,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function useAppInfo() {
	return useQuery({ queryKey: queryKeys.settings.about, queryFn: settingsApi.getAbout });
}
