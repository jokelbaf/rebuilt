import { useParams } from "react-router";

import { MarkdownFileEditor } from "~/components/files/markdown-file-editor";
import { ErrorPage, LoadingPage } from "~/components/layout/page-status";
import { useMarkdownFile } from "~/lib/api/files";
import type { FileCollection } from "~/lib/api/types/files";
import { fileCollectionConfig } from "~/lib/files-config";

export function MarkdownFileEditorRoute({ collection }: { collection: FileCollection }) {
	const { name } = useParams();
	const config = fileCollectionConfig[collection];
	const { data, isLoading, isError, error, refetch } = useMarkdownFile(collection, name);

	if (isLoading) return <LoadingPage backTo={config.basePath} title={name} />;
	if (isError || !data) {
		return (
			<ErrorPage
				backTo={config.basePath}
				title={name}
				error={error}
				onRetry={() => refetch()}
			/>
		);
	}

	return (
		<MarkdownFileEditor
			key={data.name}
			collection={collection}
			mode="edit"
			initialName={data.name}
			initialContent={data.content}
		/>
	);
}
