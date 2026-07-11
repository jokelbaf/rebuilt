import DOMPurify from "dompurify";

function StructuredText({ text }: { text: string }) {
	const blocks = text
		.split(/\n\s*\n/)
		.map((block) => block.trim())
		.filter(Boolean);

	return blocks.map((block, blockIndex) => {
		const lines = block
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		const unordered = lines.every((line) => /^[-*]\s+/.test(line));
		const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line));
		if (unordered || ordered) {
			const List = ordered ? "ol" : "ul";
			return (
				<List key={`${blockIndex}-${block.slice(0, 20)}`}>
					{lines.map((line) => (
						<li key={line}>{line.replace(ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/, "")}</li>
					))}
				</List>
			);
		}
		return <p key={`${blockIndex}-${block.slice(0, 20)}`}>{lines.join("\n")}</p>;
	});
}

export function VacancyDescription({ html, text }: { html: string; text: string }) {
	if (html) {
		return (
			<div
				className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-foreground prose-img:rounded-lg"
				dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
			/>
		);
	}

	return (
		<div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line">
			<StructuredText text={text} />
		</div>
	);
}
