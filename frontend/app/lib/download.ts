import { toast } from "sonner";

import { getErrorMessage } from "~/lib/api/errors";

const REVOKE_DELAY = 10_000;

export async function downloadFile(url: string, fileName: string): Promise<void> {
	const toastId = toast.loading("Downloading file", { description: fileName });

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(await readErrorMessage(response));

		saveDownload(await response.blob(), fileName, toastId);
	} catch (error) {
		toast.error("Download failed", {
			id: toastId,
			description: getErrorMessage(error),
		});
	}
}

export function saveDownload(blob: Blob, fileName: string, toastId?: string | number): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.rel = "noopener";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
	toast.success("Saved to Downloads", {
		id: toastId,
		description: fileName,
	});
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const payload = (await response.json()) as { message?: unknown };
		if (typeof payload.message === "string") return payload.message;
	} catch {
		// Use the response status when an error has no JSON envelope.
	}
	return response.statusText || "The file could not be downloaded.";
}
