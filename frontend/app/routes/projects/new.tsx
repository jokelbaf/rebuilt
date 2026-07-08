import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { BackLink } from "~/components/common/back-link";
import { PageBody, PageHeader } from "~/components/layout/page";
import { GitImport } from "~/components/projects/git-import";
import { ManualProjectCreate } from "~/components/projects/manual-project-create";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { fade } from "~/lib/motion";

type Source = "manual" | "git";

export default function NewProjectPage() {
	const [source, setSource] = useState<Source>("manual");

	return (
		<>
			<PageHeader
				title={
					<div className="flex items-center gap-2">
						<BackLink to="/projects" />
						<span className="text-base font-semibold">New Project</span>
					</div>
				}
			/>
			<PageBody className="max-w-2xl space-y-6">
				<div className="space-y-2">
					<Label>Source</Label>
					<Select value={source} onValueChange={(value) => setSource(value as Source)}>
						<SelectTrigger className="w-full sm:w-72">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="manual">Manual Input</SelectItem>
							<SelectItem value="git">Git Repo</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={source}
						variants={fade}
						initial="hidden"
						animate="visible"
						exit={{ opacity: 0 }}
					>
						{source === "manual" ? <ManualProjectCreate /> : <GitImport />}
					</motion.div>
				</AnimatePresence>
			</PageBody>
		</>
	);
}
