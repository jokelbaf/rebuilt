import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface ListFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	rows?: number;
}

export function ListField({ id, label, value, onChange, placeholder, rows = 4 }: ListFieldProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between">
				<Label htmlFor={id}>{label}</Label>
				<span className="text-muted-foreground text-xs">One per line</span>
			</div>
			<Textarea
				id={id}
				rows={rows}
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				className="resize-none"
			/>
		</div>
	);
}
