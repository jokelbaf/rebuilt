import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { BackLink } from "~/components/common/back-link";
import { PageBody, PageHeader } from "~/components/layout/page";
import { ManualVacancyForm } from "~/components/vacancies/manual-vacancy-form";
import { ParseVacancyForm } from "~/components/vacancies/parse-vacancy-form";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { fade } from "~/lib/motion";

type Source = "parse" | "manual";

export default function NewVacancyPage() {
	const [source, setSource] = useState<Source>("parse");

	return (
		<>
			<PageHeader
				title={
					<div className="flex items-center gap-2">
						<BackLink to="/vacancies" />
						<span className="text-base font-semibold">New Vacancy</span>
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
							<SelectItem value="parse">Parse from a link</SelectItem>
							<SelectItem value="manual">Manual Input</SelectItem>
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
						{source === "parse" ? <ParseVacancyForm /> : <ManualVacancyForm />}
					</motion.div>
				</AnimatePresence>
			</PageBody>
		</>
	);
}
