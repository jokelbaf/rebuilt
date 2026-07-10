import { Bot, CheckCircle2, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { ErrorState, RowSkeletonList } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useAiSettings, useUpdateAiSettings } from "~/lib/api/settings";
import type { AiProvider } from "~/lib/api/types/settings";
import { listContainer, listItem } from "~/lib/motion";
import { cn } from "~/lib/utils";

function ProviderOption({
	provider,
	selected,
	disabled,
}: {
	provider: AiProvider;
	selected: boolean;
	disabled: boolean;
}) {
	return (
		<motion.label
			variants={listItem}
			className={cn(
				"flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
				selected && "border-primary bg-primary/5",
				disabled && "cursor-not-allowed opacity-60"
			)}
		>
			<RadioGroupItem value={provider.id} disabled={disabled} className="mt-1" />
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-medium">{provider.label}</span>
					<Badge variant={provider.available ? "secondary" : "outline"}>
						{provider.available ? (
							<>
								<CheckCircle2 className="size-3" /> CLI found
							</>
						) : (
							<>
								<Terminal className="size-3" /> CLI not found
							</>
						)}
					</Badge>
				</div>
				<p className="text-muted-foreground text-sm">{provider.description}</p>
				{!provider.available && (
					<p className="text-muted-foreground text-xs">{provider.installHint}</p>
				)}
			</div>
		</motion.label>
	);
}

export function AiBackendSection() {
	const { data, isLoading, isError, error, refetch } = useAiSettings();
	const updateSettings = useUpdateAiSettings();

	function handleChange(provider: string) {
		if (!data || provider === data.provider) return;
		const selected = data.providers.find((item) => item.id === provider);
		updateSettings.mutate(
			{ provider },
			{
				onSuccess: () => toast.success(`${selected?.label ?? "AI backend"} is now active`),
			}
		);
	}

	return (
		<div className="space-y-5">
			<div className="space-y-1">
				<h2 className="text-base font-semibold">AI Backend</h2>
				<p className="text-muted-foreground text-sm">
					Choose the local AI CLI used for generation, analysis, imports and new chats.
					Existing chats stay with the provider they were created with.
				</p>
			</div>

			{isLoading && <RowSkeletonList count={2} />}
			{isError && (
				<ErrorState
					error={error}
					onRetry={() => refetch()}
					title="Couldn't load AI settings"
				/>
			)}
			{data && (
				<RadioGroup value={data.provider} onValueChange={handleChange} asChild>
					<motion.div
						variants={listContainer}
						initial="hidden"
						animate="visible"
						className="space-y-2"
					>
						{data.providers.map((provider) => (
							<ProviderOption
								key={provider.id}
								provider={provider}
								selected={provider.id === data.provider}
								disabled={!provider.available || updateSettings.isPending}
							/>
						))}
					</motion.div>
				</RadioGroup>
			)}

			<div className="text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
				<Bot className="mt-0.5 size-3.5 shrink-0" />
				<span>Authentication is managed by each CLI and is never stored by ReBuilt.</span>
			</div>
		</div>
	);
}
