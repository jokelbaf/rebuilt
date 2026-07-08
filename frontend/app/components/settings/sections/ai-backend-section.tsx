import { Bot } from "lucide-react";

import { EmptyState } from "~/components/common/states";

export function AiBackendSection() {
	return (
		<EmptyState
			icon={Bot}
			title="AI Backend"
			description="Configure the AI provider that powers resume and cover letter generation. This section is coming soon."
		/>
	);
}
