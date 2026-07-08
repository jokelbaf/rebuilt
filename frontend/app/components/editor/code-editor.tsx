import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror, { EditorView, type Extension } from "@uiw/react-codemirror";

import { useTheme } from "~/hooks/use-theme";
import { cn } from "~/lib/utils";

interface CodeEditorProps {
	value: string;
	onChange: (value: string) => void;
	extensions?: Extension[];
	placeholder?: string;
	readOnly?: boolean;
	className?: string;
}

export function CodeEditor({
	value,
	onChange,
	extensions = [],
	placeholder,
	readOnly,
	className,
}: CodeEditorProps) {
	const { resolvedTheme } = useTheme();

	return (
		<CodeMirror
			value={value}
			onChange={onChange}
			theme={resolvedTheme === "dark" ? githubDark : githubLight}
			extensions={[EditorView.lineWrapping, ...extensions]}
			placeholder={placeholder}
			readOnly={readOnly}
			height="100%"
			basicSetup={{
				foldGutter: false,
				highlightActiveLine: false,
				highlightActiveLineGutter: false,
			}}
			className={cn(
				"h-full overflow-hidden bg-transparent text-sm [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent [&_.cm-gutters]:border-none [&_.cm-gutters]:bg-transparent [&_.cm-focused]:outline-none",
				className
			)}
		/>
	);
}
