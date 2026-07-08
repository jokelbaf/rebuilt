import { MarkdownFileEditor } from "~/components/files/markdown-file-editor";

export default function NewProfileFilePage() {
	return <MarkdownFileEditor collection="profile" mode="new" initialContent="" />;
}
