import { motion } from "motion/react";

import { fadeInUp } from "~/lib/motion";

interface StepCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
}

export function StepCard({ title, description, children }: StepCardProps) {
	return (
		<motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">{title}</h2>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</div>
			{children}
		</motion.div>
	);
}
