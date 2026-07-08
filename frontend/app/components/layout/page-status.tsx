import { BackLink } from "~/components/common/back-link";
import { ErrorState, LoadingState } from "~/components/common/states";
import { PageHeader } from "~/components/layout/page";

function StatusHeader({ backTo, title }: { backTo?: string; title?: string }) {
	if (backTo) {
		return (
			<div className="flex items-center gap-2">
				<BackLink to={backTo} />
				<span className="text-base font-semibold">{title ?? "Back"}</span>
			</div>
		);
	}
	return <span>{title ?? "Loading"}</span>;
}

export function LoadingPage({ backTo, title }: { backTo?: string; title?: string }) {
	return (
		<>
			<PageHeader title={<StatusHeader backTo={backTo} title={title} />} />
			<div className="flex flex-1 items-center justify-center">
				<LoadingState />
			</div>
		</>
	);
}

interface ErrorPageProps {
	backTo?: string;
	title?: string;
	error: unknown;
	onRetry?: () => void;
}

export function ErrorPage({ backTo, title, error, onRetry }: ErrorPageProps) {
	return (
		<>
			<PageHeader title={<StatusHeader backTo={backTo} title={title} />} />
			<div className="flex flex-1 items-center justify-center p-6">
				<ErrorState error={error} onRetry={onRetry} className="max-w-md" />
			</div>
		</>
	);
}
