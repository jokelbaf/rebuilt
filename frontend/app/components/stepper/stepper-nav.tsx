import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "~/components/ui/button";

interface StepperNavProps {
	onBack?: () => void;
	onNext?: () => void;
	backDisabled?: boolean;
	nextDisabled?: boolean;
	nextLabel?: string;
}

export function StepperNav({
	onBack,
	onNext,
	backDisabled,
	nextDisabled,
	nextLabel = "Next",
}: StepperNavProps) {
	return (
		<div className="flex items-center justify-between gap-2 border-t pt-4">
			<Button
				type="button"
				variant="outline"
				onClick={onBack}
				disabled={backDisabled || !onBack}
			>
				<ChevronLeft className="size-4" />
				Back
			</Button>
			{onNext && (
				<Button type="button" onClick={onNext} disabled={nextDisabled}>
					{nextLabel}
					<ChevronRight className="size-4" />
				</Button>
			)}
		</div>
	);
}
