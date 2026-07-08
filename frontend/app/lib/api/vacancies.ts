import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";
import type {
	CreateVacancyInput,
	ParseVacancyInput,
	UpdateVacancyInput,
	Vacancy,
	VacancyDetail,
} from "./types/vacancies";

const vacanciesApi = {
	list: (search: string) =>
		apiClient.get<Vacancy[]>("/vacancies", { params: { q: search || undefined } }),
	get: (id: string) => apiClient.get<VacancyDetail>(`/vacancies/${id}`),
	create: (input: CreateVacancyInput) => apiClient.post<VacancyDetail>("/vacancies", input),
	parse: (input: ParseVacancyInput) => apiClient.post<VacancyDetail>("/vacancies/parse", input),
	update: (id: string, input: UpdateVacancyInput) =>
		apiClient.put<VacancyDetail>(`/vacancies/${id}`, input),
	remove: (id: string) => apiClient.delete<void>(`/vacancies/${id}`),
};

export function useVacancies(search = "") {
	return useQuery({
		queryKey: queryKeys.vacancies.list(search),
		queryFn: () => vacanciesApi.list(search),
		placeholderData: keepPreviousData,
	});
}

export function useVacancy(id: string | undefined) {
	return useQuery({
		queryKey: queryKeys.vacancies.detail(id ?? ""),
		queryFn: () => vacanciesApi.get(id as string),
		enabled: Boolean(id),
	});
}

export function useCreateVacancy() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vacanciesApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all }),
	});
}

export function useParseVacancy() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vacanciesApi.parse,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all }),
	});
}

export function useUpdateVacancy(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateVacancyInput) => vacanciesApi.update(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.detail(id) });
		},
	});
}

export function useDeleteVacancy() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vacanciesApi.remove,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all }),
	});
}
