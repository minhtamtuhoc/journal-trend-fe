/** TanStack Start SSR has no browser — skip API calls until client hydration. */
export const isBrowser = typeof window !== "undefined";
