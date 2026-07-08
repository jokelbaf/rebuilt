import { Check } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "~/lib/utils";

interface StepperProps {
	steps: string[];
	current: number;
	onStepSelect?: (index: number) => void;
}

export function Stepper({ steps, current, onStepSelect }: StepperProps) {
	return (
		<ol className="flex w-full items-center">
			{steps.map((label, index) => {
				const isCompleted = index < current;
				const isActive = index === current;
				const isClickable = Boolean(onStepSelect) && index < current;
				const isLast = index === steps.length - 1;

				return (
					<li key={label} className={cn("flex items-center", !isLast && "flex-1")}>
						<button
							type="button"
							disabled={!isClickable}
							onClick={() => isClickable && onStepSelect?.(index)}
							className={cn(
								"flex items-center gap-2",
								isClickable && "cursor-pointer"
							)}
						>
							<span
								className={cn(
									"flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
									isCompleted &&
										"border-primary bg-primary text-primary-foreground",
									isActive && "border-primary text-primary",
									!isCompleted &&
										!isActive &&
										"border-border text-muted-foreground"
								)}
							>
								{isCompleted ? <Check className="size-4" /> : index + 1}
							</span>
							<span
								className={cn(
									"hidden text-sm font-medium sm:block",
									isActive ? "text-foreground" : "text-muted-foreground"
								)}
							>
								{label}
							</span>
						</button>
						{!isLast && (
							<div className="bg-border mx-2 h-px flex-1 overflow-hidden">
								<motion.div
									className="bg-primary h-full"
									initial={false}
									animate={{ width: isCompleted ? "100%" : "0%" }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
