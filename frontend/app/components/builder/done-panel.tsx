import { CheckCircle2, Download } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { fadeInUp } from "~/lib/motion";

interface DonePanelProps {
	onDownload: () => void;
	isSaving: boolean;
	label: string;
	description?: string;
}

export function DonePanel({ onDownload, isSaving, label, description }: DonePanelProps) {
	return (
		<motion.div
			variants={fadeInUp}
			initial="hidden"
			animate="visible"
			className="flex flex-col items-center gap-4 py-10 text-center"
		>
			<div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
				<CheckCircle2 className="size-6" />
			</div>
			<div className="space-y-1">
				<h3 className="font-semibold">All set!</h3>
				<p className="text-muted-foreground max-w-sm text-sm">
					{description ?? "Your document is ready. Download it to save it locally."}
				</p>
			</div>
			<Button onClick={onDownload} disabled={isSaving}>
				<Download className="size-4" />
				{isSaving ? "Saving..." : label}
			</Button>
		</motion.div>
	);
}
