import { Eye, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface GeneratePanelProps {
	notes: string;
	onNotesChange: (value: string) => void;
	onGenerate: () => void;
	isGenerating: boolean;
	hasResult: boolean;
	onView: () => void;
}

export function GeneratePanel({
	notes,
	onNotesChange,
	onGenerate,
	isGenerating,
	hasResult,
	onView,
}: GeneratePanelProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="generation-notes">Notes</Label>
				<Textarea
					id="generation-notes"
					rows={6}
					value={notes}
					onChange={(event) => onNotesChange(event.target.value)}
					placeholder="Add any notes about the vacancy or the document you want to generate..."
					className="resize-none"
				/>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button onClick={onGenerate} disabled={isGenerating}>
					<Sparkles className="size-4" />
					{isGenerating ? "Generating..." : hasResult ? "Regenerate" : "Generate"}
				</Button>
				{hasResult && (
					<Button variant="outline" onClick={onView}>
						<Eye className="size-4" />
						View
					</Button>
				)}
			</div>
			{hasResult && (
				<p className="text-muted-foreground text-sm">
					Document generated. Click{" "}
					<span className="text-foreground font-medium">View</span> to review or edit it
					before exporting.
				</p>
			)}
		</div>
	);
}
