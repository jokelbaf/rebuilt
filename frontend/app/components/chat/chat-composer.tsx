import { Paperclip, Send, Square } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

import { AttachmentChip } from "./attachment-chip";
import { ContextChip } from "./context-chip";
import { ContextPicker } from "./context-picker";
import { ModelSelect } from "./model-select";
import { useComposer, type ComposerSubmission } from "./use-composer";

interface ChatComposerProps {
	isStreaming: boolean;
	model: string;
	effort: string | null;
	onModelChange: (model: string) => void;
	onEffortChange: (effort: string | null) => void;
	onSend: (input: ComposerSubmission) => Promise<boolean>;
	onStop: () => void;
}

export function ChatComposer({
	isStreaming,
	model,
	effort,
	onModelChange,
	onEffortChange,
	onSend,
	onStop,
}: ChatComposerProps) {
	const {
		textareaRef,
		fileInputRef,
		content,
		context,
		files,
		slash,
		items,
		highlightIndex,
		dragActive,
		setHighlightIndex,
		selectItem,
		handleChange,
		handleKeyDown,
		handlePaste,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		addFiles,
		removeFile,
		removeContext,
		submit,
	} = useComposer({ isStreaming, onSend });

	const canSend = !isStreaming && (content.trim().length > 0 || files.length > 0);

	return (
		<div className="shrink-0 border-t">
			<div className="mx-auto w-full max-w-3xl p-4">
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className={cn(
						"bg-background focus-within:ring-ring/50 relative rounded-xl border transition-all focus-within:ring-2",
						dragActive && "border-primary bg-primary/5"
					)}
				>
					{slash && (
						<ContextPicker
							items={items}
							highlightIndex={highlightIndex}
							onSelect={selectItem}
							onHighlight={setHighlightIndex}
						/>
					)}

					{(context.length > 0 || files.length > 0) && (
						<div className="flex flex-wrap gap-1.5 px-3 pt-3">
							{context.map((reference) => (
								<ContextChip
									key={`${reference.type}:${reference.id}`}
									reference={reference}
									onRemove={() => removeContext(reference)}
								/>
							))}
							{files.map((file, index) => (
								<AttachmentChip
									key={`${file.name}:${file.size}`}
									name={file.name}
									size={file.size}
									mediaType={file.type || null}
									onRemove={() => removeFile(index)}
								/>
							))}
						</div>
					)}

					<Textarea
						ref={textareaRef}
						value={content}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onPaste={handlePaste}
						placeholder="Message the assistant... Type / to attach vacancies, projects, profile or experience."
						rows={1}
						className="max-h-52 min-h-11 resize-none border-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
					/>

					<div className="flex items-center justify-between gap-2 px-2 pb-2">
						<div className="flex items-center gap-1">
							<input
								ref={fileInputRef}
								type="file"
								multiple
								className="hidden"
								onChange={(event) => {
									if (event.target.files) addFiles(event.target.files);
									event.target.value = "";
								}}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-muted-foreground size-8"
								onClick={() => fileInputRef.current?.click()}
							>
								<Paperclip className="size-4" />
								<span className="sr-only">Attach files</span>
							</Button>
							<ModelSelect
								model={model}
								effort={effort}
								onModelChange={onModelChange}
								onEffortChange={onEffortChange}
								disabled={isStreaming}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground hidden text-xs sm:block">
								Enter to send · Shift+Enter for a new line
							</span>
							{isStreaming ? (
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-8"
									onClick={onStop}
								>
									<Square className="size-3.5" />
									<span className="sr-only">Stop generating</span>
								</Button>
							) : (
								<Button
									type="button"
									size="icon"
									className="size-8"
									disabled={!canSend}
									onClick={() => void submit()}
								>
									<Send className="size-4" />
									<span className="sr-only">Send message</span>
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
