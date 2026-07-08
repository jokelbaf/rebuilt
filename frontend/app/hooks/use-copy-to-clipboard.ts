import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const RESET_DELAY = 2000;

export function useCopyToClipboard() {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const copy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			toast.error("Couldn't copy to clipboard");
			return;
		}
		setCopied(true);
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setCopied(false), RESET_DELAY);
	}, []);

	return { copied, copy };
}
