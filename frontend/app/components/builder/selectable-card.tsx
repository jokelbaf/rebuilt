import { Check } from "lucide-react";

import { cn } from "~/lib/utils";

interface SelectableCardProps {
	selected: boolean;
	onSelect: () => void;
	children: React.ReactNode;
	className?: string;
}

export function SelectableCard({ selected, onSelect, children, className }: SelectableCardProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"hover:border-primary/50 relative rounded-xl border p-4 text-left transition-all hover:shadow-sm",
				selected && "border-primary ring-primary/30 ring-2",
				className
			)}
		>
			{selected && (
				<span className="bg-primary text-primary-foreground absolute top-3 right-3 flex size-5 items-center justify-center rounded-full">
					<Check className="size-3" />
				</span>
			)}
			{children}
		</button>
	);
}
