import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Paper } from "@/types/domain";
import {
  generateBibTeX,
  generateRIS,
  generateAPA,
  generateIEEE,
  downloadCitationFile,
} from "@/lib/citation";
import { Copy, Download, Check, Quote, FileText } from "lucide-react";
import { toast } from "sonner";

export type CitationFormat = "bibtex" | "ris" | "apa" | "ieee";

interface CitationExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  papers: Paper | Paper[] | null;
  collectionTitle?: string;
}

export function CitationExportModal({
  open,
  onOpenChange,
  papers,
  collectionTitle,
}: CitationExportModalProps) {
  const [activeFormat, setActiveFormat] = useState<CitationFormat>("bibtex");
  const [copied, setCopied] = useState(false);

  const paperList = useMemo(() => {
    if (!papers) return [];
    return Array.isArray(papers) ? papers : [papers];
  }, [papers]);

  const isBatch = paperList.length > 1;

  const formattedContent = useMemo(() => {
    if (paperList.length === 0) return "";
    switch (activeFormat) {
      case "bibtex":
        return generateBibTeX(paperList);
      case "ris":
        return generateRIS(paperList);
      case "apa":
        return generateAPA(paperList);
      case "ieee":
        return generateIEEE(paperList);
      default:
        return "";
    }
  }, [paperList, activeFormat]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setCopied(true);
      toast.success(`Copied ${activeFormat.toUpperCase()} citation to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy citation");
    }
  };

  const handleDownload = () => {
    const defaultName = isBatch
      ? collectionTitle
        ? `${collectionTitle.replace(/[^a-zA-Z0-9]/g, "_")}_citations`
        : "collection_citations"
      : paperList[0]?.authors[0]
      ? `${paperList[0].authors[0].split(" ").pop()}_${paperList[0].year}_citation`
      : "paper_citation";

    if (activeFormat === "bibtex") {
      downloadCitationFile(`${defaultName}.bib`, formattedContent);
      toast.success("Downloaded .bib file");
    } else if (activeFormat === "ris") {
      downloadCitationFile(`${defaultName}.ris`, formattedContent);
      toast.success("Downloaded .ris file");
    } else {
      downloadCitationFile(`${defaultName}.txt`, formattedContent);
      toast.success("Downloaded .txt file");
    }
  };

  if (!papers || paperList.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border p-6 shadow-xl rounded-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2 text-brand">
            <Quote className="size-5" />
            <DialogTitle className="text-lg font-bold text-foreground">
              {isBatch ? `Export Collection Citations (${paperList.length} papers)` : "Export Citation"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isBatch
              ? `Generate references for all ${paperList.length} papers in ${collectionTitle ?? "this collection"}.`
              : `Reference format for "${paperList[0]?.title}"`}
          </DialogDescription>
        </DialogHeader>

        {/* Format selector tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border">
          {(
            [
              { id: "bibtex", label: "BibTeX (.bib)", hint: "Overleaf / LaTeX" },
              { id: "ris", label: "RIS (.ris)", hint: "Zotero / EndNote" },
              { id: "apa", label: "APA 7th", hint: "Word / MS Office" },
              { id: "ieee", label: "IEEE", hint: "Engineering" },
            ] as const
          ).map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setActiveFormat(fmt.id)}
              className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFormat === fmt.id
                  ? "bg-brand text-brand-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span>{fmt.label}</span>
              <span className={`text-[9px] ${activeFormat === fmt.id ? "text-brand-foreground/80" : "text-muted-foreground/60"}`}>
                {fmt.hint}
              </span>
            </button>
          ))}
        </div>

        {/* Code / Text Preview */}
        <div className="relative group">
          <textarea
            readOnly
            value={formattedContent}
            rows={isBatch ? 10 : 7}
            className="w-full p-4 rounded-xl bg-secondary/30 border border-border text-xs font-mono text-foreground focus:outline-none resize-none selection:bg-brand/30 selection:text-brand-foreground leading-relaxed"
          />
          <div className="absolute top-3 right-3 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-background/80 border border-border text-muted-foreground backdrop-blur">
            {activeFormat}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText className="size-3 text-brand" />
            Ready for Overleaf, Zotero, Mendeley & EndNote
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-all cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? "Copied!" : "Copy Citation"}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-brand-foreground hover:bg-brand/90 transition-all cursor-pointer shadow-sm"
            >
              <Download className="size-3.5" />
              Download {activeFormat === "bibtex" ? ".bib" : activeFormat === "ris" ? ".ris" : ".txt"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
