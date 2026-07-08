import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ThemeProvider } from "~/components/theme-provider";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "~/components/ui/sonner";
import { createQueryClient } from "~/lib/api/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(createQueryClient);

	return (
		<ThemeProvider defaultTheme="system" storageKey="rebuilt-theme">
			<QueryClientProvider client={queryClient}>
				<TooltipProvider delayDuration={200}>{children}</TooltipProvider>
				<Toaster richColors position="bottom-right" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
