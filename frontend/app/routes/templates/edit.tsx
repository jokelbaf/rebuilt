import { useParams } from "react-router";

import { ErrorPage, LoadingPage } from "~/components/layout/page-status";
import { TemplateEditor } from "~/components/templates/template-editor";
import { useTemplate } from "~/lib/api/templates";

export default function EditTemplatePage() {
	const { name } = useParams();
	const { data, isLoading, isError, error, refetch } = useTemplate(name);

	if (isLoading) return <LoadingPage backTo="/templates" title={name} />;
	if (isError || !data)
		return (
			<ErrorPage backTo="/templates" title={name} error={error} onRetry={() => refetch()} />
		);

	return (
		<TemplateEditor
			key={data.name}
			mode="edit"
			initialName={data.name}
			initialHtml={data.html}
		/>
	);
}
