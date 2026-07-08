import { Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Search...",
	className,
}: SearchInputProps) {
	return (
		<div className={cn("relative", className)}>
			<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="pr-9 pl-9"
			/>
			{value.length > 0 && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => onChange("")}
					className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
				>
					<X className="size-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}
