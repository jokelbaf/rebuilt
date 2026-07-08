import { DEFAULT_TEMPLATE_HTML, TemplateEditor } from "~/components/templates/template-editor";

export default function NewTemplatePage() {
	return <TemplateEditor mode="new" initialHtml={DEFAULT_TEMPLATE_HTML} />;
}
