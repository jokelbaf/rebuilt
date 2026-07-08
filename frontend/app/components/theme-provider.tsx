import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from "react";

import {
	ThemeProviderContext,
	type ResolvedTheme,
	type Theme,
	type ThemeProviderState,
} from "~/components/theme-context";

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystemTheme(onChange: () => void) {
	const media = window.matchMedia(MEDIA_QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "rebuilt-theme",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return defaultTheme;
		return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
	});

	const systemTheme = useSyncExternalStore(
		subscribeSystemTheme,
		getSystemTheme,
		() => "light" as ResolvedTheme
	);

	const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

	useIsomorphicLayoutEffect(() => {
		applyTheme(resolvedTheme);
	}, [resolvedTheme]);

	const setTheme = useCallback(
		(next: Theme) => {
			localStorage.setItem(storageKey, next);
			setThemeState(next);
		},
		[storageKey]
	);

	const value = useMemo<ThemeProviderState>(
		() => ({ theme, resolvedTheme, setTheme }),
		[theme, resolvedTheme, setTheme]
	);

	return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}
