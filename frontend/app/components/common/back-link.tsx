import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

export function BackLink({ to, label }: { to: string; label?: string }) {
	return (
		<Button asChild variant="ghost" size="icon" className="size-8">
			<Link to={to}>
				<ArrowLeft className="size-4" />
				<span className="sr-only">{label ?? "Back"}</span>
			</Link>
		</Button>
	);
}
