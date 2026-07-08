import { html } from "@codemirror/lang-html";

import { CodeEditor } from "./code-editor";
import { HtmlDocumentFrame } from "./html-document-frame";
import { SplitPane } from "./split-pane";

interface HtmlEditorProps {
	value: string;
	onChange: (value: string) => void;
}

export function HtmlEditor({ value, onChange }: HtmlEditorProps) {
	return (
		<SplitPane
			leftLabel="HTML"
			rightLabel="Preview"
			left={
				<CodeEditor
					value={value}
					onChange={onChange}
					extensions={[html()]}
					placeholder="<!doctype html>..."
					className="p-1"
				/>
			}
			right={<HtmlDocumentFrame html={value} />}
		/>
	);
}
