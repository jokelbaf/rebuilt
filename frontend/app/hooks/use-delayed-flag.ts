import { useEffect, useState } from "react";

export function useDelayedFlag(active: boolean, delay = 300): boolean {
	const [elapsed, setElapsed] = useState(false);

	useEffect(() => {
		if (!active) return;
		const id = setTimeout(() => setElapsed(true), delay);
		return () => clearTimeout(id);
	}, [active, delay]);

	return active && elapsed;
}
