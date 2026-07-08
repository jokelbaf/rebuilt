import { SelectableCard } from "~/components/builder/selectable-card";
import { LANGUAGES, languageLabel } from "~/lib/languages";

interface LanguageStepProps {
	value: string;
	onChange: (value: string) => void;
	detected?: string;
}

export function LanguageStep({ value, onChange, detected }: LanguageStepProps) {
	return (
		<div className="space-y-4">
			{detected && (
				<p className="text-muted-foreground text-sm">
					Detected from the vacancy:{" "}
					<span className="text-foreground font-medium">{languageLabel(detected)}</span>
				</p>
			)}
			<div className="grid gap-3 sm:grid-cols-3">
				{LANGUAGES.map((language) => (
					<SelectableCard
						key={language.value}
						selected={value === language.value}
						onSelect={() => onChange(language.value)}
					>
						<p className="text-sm font-medium">{language.label}</p>
						<p className="text-muted-foreground text-xs uppercase">{language.value}</p>
					</SelectableCard>
				))}
			</div>
		</div>
	);
}
