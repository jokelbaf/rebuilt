import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { fadeInUp } from "~/lib/motion";

const suggestions = [
	"What vacancies do I have stored?",
	"Which of my projects best matches my newest vacancy?",
	"Review my profile notes and suggest improvements",
	"Help me prepare for an interview",
];

export function ChatWelcome({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
	return (
		<motion.div
			variants={fadeInUp}
			initial="hidden"
			animate="visible"
			className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center"
		>
			<div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
				<Sparkles className="size-6" />
			</div>
			<div className="space-y-1.5">
				<h2 className="text-lg font-semibold">How can I help with your job search?</h2>
				<p className="text-muted-foreground max-w-md text-sm">
					I can search your vacancies, projects, profile and experience. Type{" "}
					<kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">/</kbd> in the
					composer to attach them to your message, or drop in files.
				</p>
			</div>
			<div className="flex max-w-lg flex-wrap items-center justify-center gap-2">
				{suggestions.map((suggestion) => (
					<Button
						key={suggestion}
						variant="outline"
						size="sm"
						className="h-auto py-1.5 text-xs font-normal"
						onClick={() => onSuggestion(suggestion)}
					>
						{suggestion}
					</Button>
				))}
			</div>
		</motion.div>
	);
}
