import { motion } from "motion/react";

import { AttachmentChip } from "~/components/chat/attachment-chip";
import { ContextChip } from "~/components/chat/context-chip";
import { CopyMessageButton, MessageContextMenu } from "~/components/chat/copy-message";
import { MarkdownPreview } from "~/components/editor/markdown-preview";
import type { ChatMessage } from "~/lib/api/types/chat";
import { fadeInUp } from "~/lib/motion";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
	if (message.role === "user") {
		return (
			<motion.div
				variants={fadeInUp}
				initial="hidden"
				animate="visible"
				className="group/message flex items-center justify-end gap-1"
			>
				{message.content && (
					<CopyMessageButton
						content={message.content}
						className="opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100"
					/>
				)}
				<MessageContextMenu content={message.content}>
					<div className="bg-muted max-w-[85%] space-y-2 rounded-xl px-4 py-2.5">
						{(message.context.length > 0 || message.attachments.length > 0) && (
							<div className="flex flex-wrap gap-1.5">
								{message.context.map((reference) => (
									<ContextChip
										key={`${reference.type}:${reference.id}`}
										reference={reference}
									/>
								))}
								{message.attachments.map((attachment) => (
									<AttachmentChip key={attachment.name} {...attachment} />
								))}
							</div>
						)}
						{message.content && (
							<p className="text-sm break-words whitespace-pre-wrap">
								{message.content}
							</p>
						)}
					</div>
				</MessageContextMenu>
			</motion.div>
		);
	}

	return (
		<motion.div
			variants={fadeInUp}
			initial="hidden"
			animate="visible"
			className="group/message max-w-full"
		>
			<MessageContextMenu content={message.content}>
				<div>
					<MarkdownPreview content={message.content} className="prose-pre:max-w-full" />
				</div>
			</MessageContextMenu>
			<div className="mt-1 -ml-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
				<CopyMessageButton content={message.content} />
			</div>
		</motion.div>
	);
}
