import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "./errors";

export function createQueryClient(): QueryClient {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				const message = getErrorMessage(error);
				toast.error(message, { id: `query:${message}` });
			},
		}),
		mutationCache: new MutationCache({
			onError: (error) => {
				toast.error(getErrorMessage(error));
			},
		}),
		defaultOptions: {
			queries: {
				retry: 1,
				staleTime: 30_000,
				refetchOnWindowFocus: false,
			},
		},
	});
}
