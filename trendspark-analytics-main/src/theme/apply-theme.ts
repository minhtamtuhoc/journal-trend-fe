import type { Theme } from "@/theme/storage";

export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
}

export function flashThemeTransition(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
}

/** Inline script for RootShell — restores theme before first paint. */
export const themeBootstrapScript = `(function(){try{var k="helix.theme",t=localStorage.getItem(k),r=document.documentElement;if(t==="light"){r.classList.add("light");r.classList.remove("dark");}else{r.classList.add("dark");r.classList.remove("light");}}catch(e){}})();`;
