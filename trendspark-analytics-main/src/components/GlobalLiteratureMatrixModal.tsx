import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, Layers, Sparkles, Loader2, BookOpen, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import type { Collection } from "@/types/domain";
import type { LiteratureMatrixResponse } from "@/types/literature-matrix";
import { useGenerateLiteratureMatrix } from "@/hooks/data/use-literature-matrix";
import { usePapersByIds } from "@/hooks/data/use-papers";

interface GlobalLiteratureMatrixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onGenerateSuccess: (response: LiteratureMatrixResponse) => void;
}

export function GlobalLiteratureMatrixModal({
  open,
  onOpenChange,
  collections,
  onGenerateSuccess,
}: GlobalLiteratureMatrixModalProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const matrixMutation = useGenerateLiteratureMatrix();

  useEffect(() => {
    if (open && collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [open, collections, selectedCollectionId]);

  const activeCollection = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId) ?? null;
  }, [collections, selectedCollectionId]);

  const { data: papers = [], isLoading: isLoadingPapers } = usePapersByIds(
    activeCollection?.paperIds ?? []
  );

  useEffect(() => {
    if (activeCollection) {
      setSelectedPaperIds(activeCollection.paperIds);
    } else {
      setSelectedPaperIds([]);
    }
  }, [activeCollection]);

  const handleTogglePaper = (id: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!activeCollection) return;
    if (selectedPaperIds.length === activeCollection.paperIds.length) {
      setSelectedPaperIds([]);
    } else {
      setSelectedPaperIds([...activeCollection.paperIds]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCollectionId || !activeCollection) {
      toast.error("Please select a collection first.");
      return;
    }

    if (selectedPaperIds.length === 0) {
      toast.error("Please select at least 1 paper to generate the matrix.");
      return;
    }

    try {
      const response = await matrixMutation.mutateAsync({
        collectionId: Number(selectedCollectionId),
        paperIds: selectedPaperIds.map(Number),
      });
      toast.success("Literature Matrix generated successfully!");
      onGenerateSuccess(response);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate Literature Matrix.");
    }
  };

  const allSelected =
    Boolean(activeCollection) &&
    activeCollection!.paperIds.length > 0 &&
    selectedPaperIds.length === activeCollection!.paperIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl p-6 bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3 text-brand">
            <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <Table className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Generate Literature Matrix (AI)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select papers to compare objectives, methodologies, key results, and limitations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-4 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-brand" />
              <span>Select Collection</span>
            </label>

            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 rounded-xl border border-border bg-secondary/10">
                No collections found. Create a collection first before generating a matrix.
              </p>
            ) : (
              <Select
                value={selectedCollectionId}
                onValueChange={(val) => setSelectedCollectionId(val)}
              >
                <SelectTrigger className="w-full h-11 px-3.5 bg-secondary/30 border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-brand/40 transition-colors">
                  <SelectValue placeholder="Select a collection..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border text-foreground rounded-xl shadow-2xl z-50 max-h-60">
                  {collections.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="cursor-pointer focus:bg-brand/10 focus:text-brand transition-colors py-2.5 px-3 rounded-lg"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-semibold text-sm truncate max-w-[280px]">{c.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-bold shrink-0">
                          {c.paperIds.length} paper{c.paperIds.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {activeCollection && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-brand" />
                  <span>Select Specific Papers ({selectedPaperIds.length}/{activeCollection.paperIds.length})</span>
                </label>

                {activeCollection.paperIds.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSelectAll}
                    className="h-7 text-xs text-brand hover:text-brand hover:bg-brand/10 gap-1.5 px-2 font-medium"
                  >
                    {allSelected ? (
                      <>
                        <Square className="size-3.5" /> Clear All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="size-3.5" /> Select All
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isLoadingPapers ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-brand" /> Loading paper details...
                </div>
              ) : activeCollection.paperIds.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 rounded-xl border border-border bg-secondary/10">
                  This collection has no papers saved yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-border rounded-xl p-2 bg-secondary/10">
                  {papers.map((p) => {
                    const checked = selectedPaperIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleTogglePaper(p.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? "bg-brand/10 border-brand/40 text-foreground"
                            : "bg-card border-border/60 hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleTogglePaper(p.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight text-foreground line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {p.authors?.[0]?.name || "Author"} ({p.year})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={matrixMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={
              matrixMutation.isPending ||
              !selectedCollectionId ||
              selectedPaperIds.length === 0
            }
            className="gap-2 text-brand-foreground glow-brand px-5"
            style={{ background: "var(--gradient-brand)" }}
          >
            {matrixMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating Matrix...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Matrix ({selectedPaperIds.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
