import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderPlus, Bookmark } from "lucide-react";

import type { Collection } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections, useCreateCollection, useSavePaperToCollections } from "@/hooks/data/use-collections";

function collectionsContainingPaper(collections: Collection[], paperId: string): string[] {
  return collections.filter((c) => c.paperIds.includes(paperId)).map((c) => c.id);
}

export function SaveToCollectionDialog({
  open,
  onOpenChange,
  paperId,
  paperTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  paperTitle?: string;
}) {
  const { data: rawCollections, isLoading } = useCollections();
  const collections = useMemo(() => rawCollections ?? [], [rawCollections]);
  const createCollection = useCreateCollection();
  const saveToCollections = useSavePaperToCollections();

  const existingSelected = useMemo(() => collectionsContainingPaper(collections, paperId), [collections, paperId]);
  const [selected, setSelected] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(existingSelected);
  }, [open, existingSelected]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSave = selected.length > 0 && !saveToCollections.isPending;

  const save = async () => {
    try {
      const hasChanges =
        selected.length !== existingSelected.length ||
        selected.some((id) => !existingSelected.includes(id)) ||
        existingSelected.some((id) => !selected.includes(id));

      if (!hasChanges) {
        toast.info("No changes made");
        onOpenChange(false);
        return;
      }

      await saveToCollections.mutateAsync({ paperId, collectionIds: selected });
      toast.success(`Updated collections for${paperTitle ? ` “${paperTitle}”` : " paper"}`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save to collections");
    }
  };

  const createInline = async () => {
    try {
      const name = newName.trim();
      if (!name) return;
      const created = await createCollection.mutateAsync(name);
      setNewName("");
      setSelected((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      toast.success("Collection created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create collection");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>Select one or more collections for this paper.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Paper</div>
            <div className="text-sm font-medium text-foreground truncate">{paperTitle ?? paperId}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Collections</div>
              <span className="text-[10px] font-mono text-muted-foreground">{collections.length}</span>
            </div>

            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && collections.length === 0 && (
              <div className="text-center py-12 px-6 glass rounded-2xl border border-border">
                <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
                  <Bookmark className="size-5" />
                </div>
                <div className="font-semibold text-sm text-foreground">No collections yet</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Create a collection below, then select it to save this paper.
                </div>
              </div>
            )}

            {!isLoading && collections.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-xl border border-border divide-y divide-border min-w-0">
                {collections.map((c) => {
                  const checked = selected.includes(c.id);
                  const already = c.paperIds.includes(paperId);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={cn("w-full flex items-start justify-between gap-3 px-3 py-2 text-left hover:bg-secondary/30 transition-colors", checked && "bg-brand/10")}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={cn(
                            "mt-0.5 size-4 rounded border border-border flex items-center justify-center text-[10px] font-bold shrink-0",
                            checked ? "bg-brand/20 border-brand/40 text-brand" : "bg-background/40 text-muted-foreground",
                          )}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                            {c.paperIds.length} papers{already ? " · already saved" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5 hidden sm:block">
                        {already ? "Saved" : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Create new</div>
            <div className="flex items-center gap-2 min-w-0">
              <Input
                className="min-w-0 flex-1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Thesis references"
              />
              <Button
                type="button"
                onClick={createInline}
                disabled={createCollection.isPending || newName.trim().length === 0}
                size="icon"
                className="shrink-0"
              >
                <FolderPlus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!canSave}>
            {saveToCollections.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

