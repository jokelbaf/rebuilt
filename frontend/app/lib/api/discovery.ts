import {
	keepPreviousData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	DiscoveredVacancy,
	DiscoveredVacancyApproval,
	DiscoveredVacancyCount,
	DiscoveredVacancyDetail,
	DiscoveredVacancyFilters,
	DiscoveryRun,
	DiscoveryEvent,
	DiscoveryExchangeRates,
	DiscoveryNotificationSettings,
	DiscoveryNotificationTest,
	DiscoverySettings,
	DiscoveryVacancyStatus,
	PlatformAccount,
	PlatformAccountInput,
	SearchQuery,
	SearchQueryInput,
	SearchQueryUpdate,
} from "./types/discovery";

const discoveryApi = {
	settings: () => apiClient.get<DiscoverySettings>("/discovery/settings"),
	updateSettings: (input: DiscoverySettings) =>
		apiClient.put<DiscoverySettings>("/discovery/settings", input),
	testTelegram: (input: DiscoveryNotificationSettings) =>
		apiClient.post<DiscoveryNotificationTest>("/discovery/notifications/telegram/test", input),
	exchangeRates: () => apiClient.get<DiscoveryExchangeRates>("/discovery/exchange-rates"),
	accounts: () => apiClient.get<PlatformAccount[]>("/discovery/accounts"),
	upsertAccount: (input: PlatformAccountInput) =>
		apiClient.post<PlatformAccount>("/discovery/accounts", input),
	deleteAccount: (platform: string) => apiClient.delete<void>(`/discovery/accounts/${platform}`),
	verifyAccount: (platform: string) =>
		apiClient.post<PlatformAccount>(`/discovery/accounts/${platform}/verify`),
	queries: () => apiClient.get<SearchQuery[]>("/discovery/queries"),
	createQuery: (input: SearchQueryInput) =>
		apiClient.post<SearchQuery>("/discovery/queries", input),
	updateQuery: ({ id, input }: { id: string; input: SearchQueryUpdate }) =>
		apiClient.patch<SearchQuery>(`/discovery/queries/${id}`, input),
	deleteQuery: (id: string) => apiClient.delete<void>(`/discovery/queries/${id}`),
	vacancies: (filters: DiscoveredVacancyFilters) =>
		apiClient.get<DiscoveredVacancy[]>("/discovery/vacancies", {
			params: {
				status: filters.status,
				platform: filters.platform,
				minScore: filters.minScore,
				q: filters.q,
			},
		}),
	vacancyCount: (status: DiscoveryVacancyStatus) =>
		apiClient.get<DiscoveredVacancyCount>("/discovery/vacancies/count", {
			params: { status },
		}),
	vacancy: (id: string) => apiClient.get<DiscoveredVacancyDetail>(`/discovery/vacancies/${id}`),
	approveVacancy: (id: string) =>
		apiClient.post<DiscoveredVacancyApproval>(`/discovery/vacancies/${id}/approve`),
	dismissVacancy: ({ id, reason }: { id: string; reason: string }) =>
		apiClient.post<DiscoveredVacancy>(`/discovery/vacancies/${id}/dismiss`, { reason }),
	restoreVacancy: (id: string) =>
		apiClient.post<DiscoveredVacancy>(`/discovery/vacancies/${id}/restore`),
	runs: (limit: number) =>
		apiClient.get<DiscoveryRun[]>("/discovery/runs", { params: { limit } }),
	run: (id: string) => apiClient.get<DiscoveryRun>(`/discovery/runs/${id}`),
	runEvents: ({ id, before, limit }: { id: string; before?: number; limit: number }) =>
		apiClient.get<DiscoveryEvent[]>(`/discovery/runs/${id}/events`, {
			params: { before, limit },
		}),
	cancelRun: (id: string) => apiClient.post<DiscoveryRun>(`/discovery/runs/${id}/cancel`),
	deleteRun: (id: string) => apiClient.delete<void>(`/discovery/runs/${id}`),
	startRun: () => apiClient.post<DiscoveryRun>("/discovery/runs"),
};

export function useDiscoverySettings() {
	return useQuery({ queryKey: queryKeys.discovery.settings, queryFn: discoveryApi.settings });
}

export function useUpdateDiscoverySettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.updateSettings,
		onSuccess: (settings) => {
			queryClient.setQueryData(queryKeys.discovery.settings, settings);
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.vacancies.all });
		},
	});
}

export function useTestTelegramNotification() {
	return useMutation({ mutationFn: discoveryApi.testTelegram });
}

export function useDiscoveryExchangeRates() {
	return useQuery({
		queryKey: queryKeys.discovery.exchangeRates,
		queryFn: discoveryApi.exchangeRates,
	});
}

export function usePlatformAccounts() {
	return useQuery({ queryKey: queryKeys.discovery.accounts, queryFn: discoveryApi.accounts });
}

export function useUpsertPlatformAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.upsertAccount,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.accounts }),
	});
}

export function useDeletePlatformAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.deleteAccount,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.accounts }),
	});
}

export function useVerifyPlatformAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.verifyAccount,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.accounts }),
	});
}

export function useSearchQueries() {
	return useQuery({ queryKey: queryKeys.discovery.queries, queryFn: discoveryApi.queries });
}

export function useCreateSearchQuery() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.createQuery,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.queries }),
	});
}

export function useUpdateSearchQuery() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.updateQuery,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.queries }),
	});
}

export function useDeleteSearchQuery() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.deleteQuery,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.discovery.queries }),
	});
}

export function useDiscoveredVacancies(filters: DiscoveredVacancyFilters) {
	return useQuery({
		queryKey: queryKeys.discovery.vacancies.list(filters),
		queryFn: () => discoveryApi.vacancies(filters),
		placeholderData: keepPreviousData,
	});
}

export function useDiscoveredVacancyCount(status: DiscoveryVacancyStatus = "new") {
	return useQuery({
		queryKey: queryKeys.discovery.vacancies.count(status),
		queryFn: () => discoveryApi.vacancyCount(status),
	});
}

export function useDiscoveredVacancy(id: string | undefined) {
	return useQuery({
		queryKey: queryKeys.discovery.vacancies.detail(id ?? ""),
		queryFn: () => discoveryApi.vacancy(id as string),
		enabled: Boolean(id),
	});
}

function useVacancyDecision() {
	const queryClient = useQueryClient();
	return {
		optimistic: async (id: string) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.discovery.vacancies.all });
			const previous = queryClient.getQueriesData<DiscoveredVacancy[]>({
				queryKey: queryKeys.discovery.vacancies.lists,
			});
			queryClient.setQueriesData<DiscoveredVacancy[]>(
				{ queryKey: queryKeys.discovery.vacancies.lists },
				(items) => items?.filter((item) => item.id !== id)
			);
			return previous;
		},
		restore: (
			previous: [readonly unknown[], DiscoveredVacancy[] | undefined][] | undefined
		) => {
			for (const [key, data] of previous ?? []) queryClient.setQueryData(key, data);
		},
		refresh: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.vacancies.all });
		},
	};
}

export function useApproveVacancy() {
	const queryClient = useQueryClient();
	const decision = useVacancyDecision();
	return useMutation({
		mutationFn: discoveryApi.approveVacancy,
		onMutate: decision.optimistic,
		onError: (_error, _id, context) => decision.restore(context),
		onSettled: () => {
			decision.refresh();
			queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
		},
	});
}

export function useDismissVacancy() {
	const decision = useVacancyDecision();
	return useMutation({
		mutationFn: discoveryApi.dismissVacancy,
		onMutate: ({ id }) => decision.optimistic(id),
		onError: (_error, _variables, context) => decision.restore(context),
		onSettled: decision.refresh,
	});
}

export function useRestoreVacancy() {
	const decision = useVacancyDecision();
	return useMutation({
		mutationFn: discoveryApi.restoreVacancy,
		onMutate: decision.optimistic,
		onError: (_error, _id, context) => decision.restore(context),
		onSettled: decision.refresh,
	});
}

export function useDiscoveryRuns(limit = 50) {
	return useQuery({
		queryKey: queryKeys.discovery.runs.list(limit),
		queryFn: () => discoveryApi.runs(limit),
		refetchInterval: (query) =>
			query.state.data?.some((run) => run.status === "running") ? 2_000 : false,
	});
}

export function useDiscoveryRun(id: string | undefined) {
	return useQuery({
		queryKey: queryKeys.discovery.runs.detail(id ?? ""),
		queryFn: () => discoveryApi.run(id as string),
		enabled: Boolean(id),
	});
}

const EVENTS_PAGE_SIZE = 100;

export function useDiscoveryRunEvents(id: string | undefined) {
	return useInfiniteQuery({
		queryKey: queryKeys.discovery.runs.events(id ?? ""),
		queryFn: ({ pageParam }) =>
			discoveryApi.runEvents({
				id: id as string,
				before: pageParam,
				limit: EVENTS_PAGE_SIZE,
			}),
		initialPageParam: undefined as number | undefined,
		getNextPageParam: (page) =>
			page.length === EVENTS_PAGE_SIZE ? page.at(-1)?.id : undefined,
		enabled: Boolean(id),
	});
}

export function useCancelDiscoveryRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.cancelRun,
		onSuccess: (run) => {
			queryClient.setQueryData(queryKeys.discovery.runs.detail(run.id), run);
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.runs.all });
		},
	});
}

export function useDeleteDiscoveryRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.deleteRun,
		onSuccess: (_data, id) => {
			queryClient.removeQueries({ queryKey: queryKeys.discovery.runs.detail(id) });
			queryClient.removeQueries({ queryKey: queryKeys.discovery.runs.events(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.runs.all });
		},
	});
}

export function useStartDiscoveryRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: discoveryApi.startRun,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.runs.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.discovery.vacancies.all });
		},
	});
}
