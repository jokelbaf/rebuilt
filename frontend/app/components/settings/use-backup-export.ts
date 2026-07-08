import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { downloadBackup } from "~/lib/api/backup";
import { getErrorMessage } from "~/lib/api/errors";
import { triggerDownload } from "~/lib/download";

const FINISH_DELAY = 600;
const REVOKE_DELAY = 10_000;

export function useBackupExport() {
	const [isExporting, setIsExporting] = useState(false);
	const [progress, setProgress] = useState<number | null>(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	async function exportBackup() {
		if (isExporting) return;
		setIsExporting(true);
		setProgress(null);

		try {
			const { blob, fileName } = await downloadBackup(({ loaded, total }) => {
				if (mountedRef.current && total) {
					setProgress(Math.min(100, Math.round((loaded / total) * 100)));
				}
			});
			if (mountedRef.current) setProgress(100);

			const url = URL.createObjectURL(blob);
			triggerDownload(url, fileName);
			setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
			toast.success("Backup downloaded");
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setTimeout(() => {
				if (mountedRef.current) {
					setIsExporting(false);
					setProgress(null);
				}
			}, FINISH_DELAY);
		}
	}

	return { isExporting, progress, exportBackup };
}
