import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./client";
import { ApiError, NETWORK_ERROR_STATUS } from "./errors";
import type { BackupDownloadProgress, BackupSummary } from "./types/backup";
import type { ApiEnvelope } from "./types/common";

const FALLBACK_FILENAME = "backup.rebuilt";

/** Download the full application backup, reporting streaming progress. */
export async function downloadBackup(
	onProgress: (progress: BackupDownloadProgress) => void
): Promise<{ blob: Blob; fileName: string }> {
	let response: Response;
	try {
		response = await fetch("/api/backup/export");
	} catch {
		throw new ApiError(
			"Unable to reach the server. Is the backend running?",
			NETWORK_ERROR_STATUS
		);
	}

	if (!response.ok) {
		throw new ApiError(await readErrorMessage(response), response.status);
	}

	const total = readContentLength(response);
	const fileName = readFileName(response) ?? FALLBACK_FILENAME;

	if (!response.body) {
		const blob = await response.blob();
		onProgress({ loaded: blob.size, total: blob.size });
		return { blob, fileName };
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array<ArrayBuffer>[] = [];
	let loaded = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value as Uint8Array<ArrayBuffer>);
		loaded += value.byteLength;
		onProgress({ loaded, total });
	}

	return { blob: new Blob(chunks, { type: "application/octet-stream" }), fileName };
}

/** Upload a .rebuilt file and replace all application data with its contents. */
export async function importBackup(file: File): Promise<BackupSummary> {
	const body = new FormData();
	body.set("file", file);

	let response: Response;
	try {
		response = await fetch("/api/backup/import", { method: "POST", body });
	} catch {
		throw new ApiError(
			"Unable to reach the server. Is the backend running?",
			NETWORK_ERROR_STATUS
		);
	}

	let envelope: ApiEnvelope<BackupSummary> | null;
	try {
		envelope = (await response.json()) as ApiEnvelope<BackupSummary>;
	} catch {
		envelope = null;
	}
	if (!response.ok || !envelope?.data) {
		throw new ApiError(
			envelope?.message || response.statusText || "Backup import failed",
			response.status
		);
	}
	return envelope.data;
}

export function useImportBackup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: importBackup,
		onSuccess: () => queryClient.invalidateQueries(),
	});
}

export function useEraseAllData() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => apiClient.delete<void>("/data"),
		onSuccess: () => queryClient.invalidateQueries(),
	});
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const envelope = (await response.json()) as ApiEnvelope<unknown>;
		return envelope.message || "Backup export failed";
	} catch {
		return response.statusText || "Backup export failed";
	}
}

function readContentLength(response: Response): number | null {
	const header = response.headers.get("Content-Length");
	const parsed = header ? Number.parseInt(header, 10) : Number.NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readFileName(response: Response): string | null {
	const header = response.headers.get("Content-Disposition");
	const match = header ? /filename="([^"]+)"/.exec(header) : null;
	return match?.[1] ?? null;
}
