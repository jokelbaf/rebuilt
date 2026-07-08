import { Spinner } from "~/components/ui/spinner";

export function GitImportProgress({ repo }: { repo: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
			<Spinner className="text-primary size-7" />
			<div className="space-y-1">
				<p className="font-medium">Importing {repo}</p>
				<p className="text-muted-foreground max-w-sm text-sm">
					Cloning the repository and analyzing it with AI to generate project metadata.
					This can take a moment...
				</p>
			</div>
		</div>
	);
}
