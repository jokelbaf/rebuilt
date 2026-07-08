import { markdown } from "@codemirror/lang-markdown";

import { CodeEditor } from "./code-editor";
import { MarkdownPreview } from "./markdown-preview";
import { SplitPane } from "./split-pane";

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
	return (
		<SplitPane
			leftLabel="Markdown"
			rightLabel="Preview"
			left={
				<CodeEditor
					value={value}
					onChange={onChange}
					extensions={[markdown()]}
					placeholder="# Start writing in markdown..."
					className="p-1"
				/>
			}
			right={
				<div className="p-4">
					<MarkdownPreview content={value} />
				</div>
			}
		/>
	);
}
