import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type { AiSettings, AiSettingsUpdate } from "./types/settings";

const settingsApi = {
	getAi: () => apiClient.get<AiSettings>("/settings/ai"),
	updateAi: (input: AiSettingsUpdate) => apiClient.patch<AiSettings>("/settings/ai", input),
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
		},
	});
}
