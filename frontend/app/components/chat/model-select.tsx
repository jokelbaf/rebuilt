import { ChevronDown, Cpu } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAiModelCatalog } from "~/lib/api/chat";

const DEFAULT_EFFORT = "default";

const effortLabels: Record<string, string> = {
	low: "Low",
	medium: "Medium",
	high: "High",
	xhigh: "Extra High",
	max: "Max",
};

function effortLabel(effort: string): string {
	return effortLabels[effort] ?? effort;
}

interface ModelSelectProps {
	model: string;
	effort: string | null;
	onModelChange: (model: string) => void;
	onEffortChange: (effort: string | null) => void;
	disabled?: boolean;
}

export function ModelSelect({
	model,
	effort,
	onModelChange,
	onEffortChange,
	disabled,
}: ModelSelectProps) {
	const { data } = useAiModelCatalog();
	const models = data?.models ?? [];
	const efforts = data?.efforts ?? [];

	const active = models.find((entry) => entry.id === model);
	const triggerLabel = active?.label ?? model;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					disabled={disabled || models.length === 0}
					className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2 text-xs font-normal"
				>
					<Cpu className="size-3.5" />
					<span className="max-w-36 truncate">
						{triggerLabel}
						{effort ? ` · ${effortLabel(effort)}` : ""}
					</span>
					<ChevronDown className="size-3 opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel className="text-muted-foreground text-xs">
					Model
				</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
					{models.map((entry) => (
						<DropdownMenuRadioItem
							key={entry.id}
							value={entry.id}
							onSelect={(event) => event.preventDefault()}
						>
							<div className="min-w-0">
								<p className="text-sm">{entry.label}</p>
								{entry.description && (
									<p className="text-muted-foreground truncate text-xs">
										{entry.description}
									</p>
								)}
							</div>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>

				{efforts.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Effort
						</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={effort ?? DEFAULT_EFFORT}
							onValueChange={(value) =>
								onEffortChange(value === DEFAULT_EFFORT ? null : value)
							}
						>
							<DropdownMenuRadioItem
								value={DEFAULT_EFFORT}
								onSelect={(event) => event.preventDefault()}
							>
								Default
							</DropdownMenuRadioItem>
							{efforts.map((level) => (
								<DropdownMenuRadioItem
									key={level}
									value={level}
									onSelect={(event) => event.preventDefault()}
								>
									{effortLabel(level)}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
