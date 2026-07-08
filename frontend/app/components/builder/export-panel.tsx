import { FileDown, FileText } from "lucide-react";

import { Button } from "~/components/ui/button";
import type { ExportPdfResult } from "~/lib/api/types/resume";

interface ExportPanelProps {
	onExport: () => void;
	isExporting: boolean;
	result?: ExportPdfResult;
}

export function ExportPanel({ onExport, isExporting, result }: ExportPanelProps) {
	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-sm">Render the document to a PDF file.</p>
			<Button onClick={onExport} disabled={isExporting}>
				<FileDown className="size-4" />
				{isExporting ? "Exporting..." : result ? "Re-export" : "Export"}
			</Button>
			{result && (
				<div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
					<FileText className="text-muted-foreground size-4" />
					<span className="font-medium">{result.fileName}</span>
					<span className="text-muted-foreground">is ready.</span>
				</div>
			)}
		</div>
	);
}
