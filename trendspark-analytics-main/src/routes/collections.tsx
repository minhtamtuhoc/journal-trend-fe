import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FolderPlus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { useCollections, useCreateCollection, useDeleteCollection, useRenameCollection } from "@/hooks/data/use-collections";
import type { Collection } from "@/types/domain";
import { formatTimeAgo } from "@/lib/time";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collections = [], isLoading } = useCollections();

  const createMutation = useCreateCollection();
  const renameMutation = useRenameCollection();
  const deleteMutation = useDeleteCollection();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");

  const sorted = useMemo(() => {
    return [...collections].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [collections]);

  const openRename = (c: Collection) => {
    setRenameTarget(c);
    setRenameName(c.name);
  };

  const submitCreate = async () => {
    try {
      const name = createName.trim();
      await createMutation.mutateAsync(name);
      toast.success("Collection created");
      setCreateOpen(false);
      setCreateName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create collection");
    }
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    try {
      const name = renameName.trim();
      await renameMutation.mutateAsync({ id: renameTarget.id, name });
      toast.success("Collection renamed");
      setRenameTarget(null);
      setRenameName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename collection");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Collection deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete collection");
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Collections"
        subtitle="Organize saved papers into curated sets"
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors"
          >
            <FolderPlus className="size-4" /> New Collection
          </button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-2/3" />
                  <div className="mt-3 flex items-center gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((c) => (
            <Card key={c.id} className="hover:border-brand/35 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate">{c.name}</div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span>{c.paperIds.length} papers</span>
                    <span>·</span>
                    <span>Updated {formatTimeAgo(c.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openRename(c)}
                    className="p-2 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Rename"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="p-2 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
          <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
            <FolderOpen className="size-5" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">No collections yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto px-4">
            Create collections to group saved papers by topic, project, or review status.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-brand-foreground glow-brand"
            style={{ background: "var(--gradient-brand)" }}
          >
            <FolderPlus className="size-3.5" /> Create your first collection
          </button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>Create a named collection for saved papers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Thesis references"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setCreateName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={createMutation.isPending || createName.trim().length === 0}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename collection</DialogTitle>
            <DialogDescription>Update the collection name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
            <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setRenameTarget(null);
                setRenameName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitRename}
              disabled={renameMutation.isPending || renameName.trim().length === 0}
            >
              {renameMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the collection. Saved papers are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

