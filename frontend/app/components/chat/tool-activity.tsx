import { Wrench } from "lucide-react";
import { motion } from "motion/react";

import { fadeInUp } from "~/lib/motion";
import { cn } from "~/lib/utils";

import type { ToolActivity } from "./use-chat";

interface ToolActivityListProps {
	tools: ToolActivity[];
	active?: boolean;
}

export function ToolActivityList({ tools, active = false }: ToolActivityListProps) {
	if (tools.length === 0) return null;

	return (
		<div className="space-y-1">
			{tools.map((tool, index) => {
				const isLast = index === tools.length - 1;
				return (
					<motion.div
						key={tool.id}
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						className={cn(
							"text-muted-foreground flex items-center gap-2 text-xs",
							active && isLast && "animate-pulse"
						)}
					>
						<Wrench className="size-3 shrink-0" />
						<span className="font-medium">{tool.name}</span>
						{tool.summary && <span className="truncate">{tool.summary}</span>}
					</motion.div>
				);
			})}
		</div>
	);
}
