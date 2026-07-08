import { Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackLink } from "~/components/common/back-link";
import { MarkdownEditor } from "~/components/editor/markdown-editor";
import { PageContent, PageHeader } from "~/components/layout/page";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCreateMarkdownFile, useUpdateMarkdownFile } from "~/lib/api/files";
import type { FileCollection } from "~/lib/api/types/files";
import { fileCollectionConfig } from "~/lib/files-config";
import { slugify } from "~/lib/format";

interface MarkdownFileEditorProps {
	collection: FileCollection;
	mode: "new" | "edit";
	initialName?: string;
	initialContent: string;
}

export function MarkdownFileEditor({
	collection,
	mode,
	initialName = "",
	initialContent,
}: MarkdownFileEditorProps) {
	const config = fileCollectionConfig[collection];
	const navigate = useNavigate();
	const [name, setName] = useState(initialName);
	const [content, setContent] = useState(initialContent);

	const createFile = useCreateMarkdownFile(collection);
	const updateFile = useUpdateMarkdownFile(collection, initialName);
	const isSaving = createFile.isPending || updateFile.isPending;

	function handleSave() {
		if (mode === "new") {
			const slug = slugify(name);
			if (!slug) {
				toast.error("Enter a file name");
				return;
			}
			createFile.mutate(
				{ name: slug, content },
				{
					onSuccess: () => {
						toast.success("File created");
						navigate(config.basePath);
					},
				}
			);
			return;
		}

		updateFile.mutate({ content }, { onSuccess: () => toast.success("File saved") });
	}

	return (
		<>
			<PageHeader
				title={
					<div className="flex items-center gap-2">
						<BackLink to={config.basePath} />
						<span className="text-base font-semibold">
							{mode === "new" ? "New File" : initialName}
						</span>
					</div>
				}
				actions={
					<Button onClick={handleSave} disabled={isSaving}>
						<Save className="size-4" />
						{isSaving ? "Saving..." : "Save"}
					</Button>
				}
			/>
			<PageContent className="gap-4">
				{mode === "new" && (
					<div className="max-w-sm space-y-2">
						<Label htmlFor="file-name">File name</Label>
						<Input
							id="file-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="about-me"
						/>
					</div>
				)}
				<MarkdownEditor value={content} onChange={setContent} />
			</PageContent>
		</>
	);
}
