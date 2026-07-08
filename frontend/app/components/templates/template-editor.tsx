import { Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackLink } from "~/components/common/back-link";
import { HtmlEditor } from "~/components/editor/html-editor";
import { PageContent, PageHeader } from "~/components/layout/page";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCreateTemplate, useUpdateTemplate } from "~/lib/api/templates";
import { slugify } from "~/lib/format";

export const DEFAULT_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 3rem; color: #111; }
      h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
      .role { color: #555; }
    </style>
  </head>
  <body>
    <h1>{{ name }}</h1>
    <p class="role">{{ title }}</p>
  </body>
</html>
`;

interface TemplateEditorProps {
	mode: "new" | "edit";
	initialName?: string;
	initialHtml: string;
}

export function TemplateEditor({ mode, initialName = "", initialHtml }: TemplateEditorProps) {
	const navigate = useNavigate();
	const [name, setName] = useState(initialName);
	const [htmlValue, setHtmlValue] = useState(initialHtml);

	const createTemplate = useCreateTemplate();
	const updateTemplate = useUpdateTemplate(initialName);
	const isSaving = createTemplate.isPending || updateTemplate.isPending;

	function handleSave() {
		if (mode === "new") {
			const slug = slugify(name);
			if (!slug) {
				toast.error("Enter a template name");
				return;
			}
			createTemplate.mutate(
				{ name: slug, html: htmlValue },
				{
					onSuccess: () => {
						toast.success("Template created");
						navigate("/templates");
					},
				}
			);
			return;
		}

		updateTemplate.mutate(
			{ html: htmlValue },
			{ onSuccess: () => toast.success("Template saved") }
		);
	}

	return (
		<>
			<PageHeader
				title={
					<div className="flex items-center gap-2">
						<BackLink to="/templates" />
						<span className="text-base font-semibold">
							{mode === "new" ? "New Template" : initialName}
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
						<Label htmlFor="template-name">Template name</Label>
						<Input
							id="template-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="modern-classic"
						/>
					</div>
				)}
				<HtmlEditor value={htmlValue} onChange={setHtmlValue} />
			</PageContent>
		</>
	);
}
