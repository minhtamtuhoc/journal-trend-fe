import type { Paper } from "@/types/domain";

/** Clean string for citekey generation */
function sanitizeKey(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

function getCiteKey(paper: Paper): string {
  const firstAuthor = paper.authors[0] ? paper.authors[0].split(" ").pop() ?? "Author" : "Author";
  const firstWordTitle = paper.title.split(" ")[0] ?? "Paper";
  return `${sanitizeKey(firstAuthor)}${paper.year || ""}${sanitizeKey(firstWordTitle)}`;
}

/** Format author name for IEEE (e.g. "John Smith" -> "J. Smith") */
function formatIEEEAuthor(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const lastName = parts.pop();
  const initials = parts.map((p) => `${p[0]?.toUpperCase()}.`).join(" ");
  return `${initials} ${lastName}`;
}

export function generateBibTeX(papers: Paper | Paper[]): string {
  const list = Array.isArray(papers) ? papers : [papers];
  return list
    .map((p) => {
      const citeKey = getCiteKey(p);
      const authors = p.authors.length > 0 ? p.authors.join(" and ") : "Unknown Author";
      const cleanTitle = p.title.replace(/[{}]/g, "");
      const journalStr = p.journal ? `  journal = {${p.journal}},\n` : "";
      const doiStr = p.doi ? `  doi = {${p.doi}},\n` : "";

      return `@article{${citeKey},
  author = {${authors}},
  title = {{${cleanTitle}}},
${journalStr}  year = {${p.year || "n.d."}}${doiStr ? ",\n" + doiStr.slice(0, -2) : ""}
}`;
    })
    .join("\n\n");
}

export function generateRIS(papers: Paper | Paper[]): string {
  const list = Array.isArray(papers) ? papers : [papers];
  return list
    .map((p) => {
      const lines: string[] = ["TY  - JOUR", `TI  - ${p.title}`];
      p.authors.forEach((a) => lines.push(`AU  - ${a}`));
      if (p.journal) lines.push(`JO  - ${p.journal}`);
      if (p.year) lines.push(`PY  - ${p.year}`);
      if (p.doi) lines.push(`DO  - ${p.doi}`);
      lines.push("ER  - ");
      return lines.join("\n");
    })
    .join("\n\n");
}

export function generateAPA(papers: Paper | Paper[]): string {
  const list = Array.isArray(papers) ? papers : [papers];
  return list
    .map((p) => {
      let authorStr = "Unknown Author";
      if (p.authors.length === 1) {
        authorStr = p.authors[0];
      } else if (p.authors.length === 2) {
        authorStr = `${p.authors[0]} & ${p.authors[1]}`;
      } else if (p.authors.length > 2) {
        authorStr = `${p.authors[0]} et al.`;
      }

      const yearStr = p.year ? `(${p.year})` : "(n.d.)";
      const titleStr = p.title.endsWith(".") ? p.title : `${p.title}.`;
      const journalStr = p.journal ? ` *${p.journal}*.` : "";
      const doiUrl = p.doi
        ? p.doi.startsWith("http")
          ? ` ${p.doi}`
          : ` https://doi.org/${p.doi}`
        : "";

      return `${authorStr} ${yearStr}. ${titleStr}${journalStr}${doiUrl}`;
    })
    .join("\n\n");
}

export function generateIEEE(papers: Paper | Paper[]): string {
  const list = Array.isArray(papers) ? papers : [papers];
  return list
    .map((p, index) => {
      let authorStr = "Unknown Author";
      if (p.authors.length > 0) {
        const ieeeAuthors = p.authors.map(formatIEEEAuthor);
        if (ieeeAuthors.length === 1) {
          authorStr = ieeeAuthors[0];
        } else if (ieeeAuthors.length === 2) {
          authorStr = `${ieeeAuthors[0]} and ${ieeeAuthors[1]}`;
        } else {
          authorStr = `${ieeeAuthors.slice(0, -1).join(", ")}, and ${ieeeAuthors[ieeeAuthors.length - 1]}`;
        }
      }

      const titleStr = `"${p.title.endsWith(".") ? p.title.slice(0, -1) : p.title},"`;
      const journalStr = p.journal ? ` *${p.journal}*,` : "";
      const yearStr = p.year ? ` ${p.year}.` : ".";
      const doiStr = p.doi ? ` doi: ${p.doi}.` : "";

      return `[${index + 1}] ${authorStr}, ${titleStr}${journalStr}${yearStr}${doiStr}`;
    })
    .join("\n\n");
}

export function downloadCitationFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
