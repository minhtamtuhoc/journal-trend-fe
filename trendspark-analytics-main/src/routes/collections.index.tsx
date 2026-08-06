import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FolderPlus, Pencil, Trash2, FolderOpen, Sparkles, History, ChevronDown, Table } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections, useCreateCollection, useDeleteCollection, useRenameCollection } from "@/hooks/data/use-collections";
import type { Collection } from "@/types/domain";
import type { AiCollectionAnalysisResponse } from "@/types/ai-collection-analysis";
import type { LiteratureMatrixResponse } from "@/types/literature-matrix";
import { GlobalAiCollectionModal } from "@/components/GlobalAiCollectionModal";
import { GlobalLiteratureMatrixModal } from "@/components/GlobalLiteratureMatrixModal";
import { LiteratureMatrixModal } from "@/components/LiteratureMatrixModal";
import { AiCollectionAnalysisSheet } from "@/components/AiCollectionAnalysisSheet";
import { AiHistoryDrawer } from "@/components/AiHistoryDrawer";
import { formatTimeAgo } from "@/lib/time";

export const Route = createFileRoute("/collections/")({
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collectionsData, isLoading } = useCollections();
  const collections = useMemo(() => collectionsData ?? [], [collectionsData]);

  const createMutation = useCreateCollection();
  const renameMutation = useRenameCollection();
  const deleteMutation = useDeleteCollection();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");

  // AI Analysis states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [globalMatrixOpen, setGlobalMatrixOpen] = useState(false);
  const [matrixResultOpen, setMatrixResultOpen] = useState(false);
  const [currentMatrixData, setCurrentMatrixData] = useState<LiteratureMatrixResponse | null>(null);
  const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [currentAiAnalysis, setCurrentAiAnalysis] = useState<AiCollectionAnalysisResponse | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | undefined>();

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              className="p-2 rounded-lg border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
              title="View AI Analysis History"
            >
              <History className="size-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={collections.length === 0}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Sparkles className="size-4" /> AI Tools <ChevronDown className="size-3.5 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-card border border-border shadow-2xl rounded-xl p-1.5 z-50">
                <DropdownMenuItem
                  onClick={() => setAiModalOpen(true)}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-foreground cursor-pointer focus:bg-brand/10 focus:text-brand transition-colors"
                >
                  <Sparkles className="size-4 text-brand shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span>Analyze Collection</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">Themes, gaps & topic clusters</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGlobalMatrixOpen(true)}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-foreground cursor-pointer focus:bg-brand/10 focus:text-brand transition-colors"
                >
                  <Table className="size-4 text-brand shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span>Generate Literature Matrix</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">Compare methodology & results</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors"
            >
              <FolderPlus className="size-4" /> New Collection
            </button>
          </div>
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
            <Card key={c.id} className="hover:border-brand/35 transition-colors group relative">
              <Link
                to="/collections/$collectionId"
                params={{ collectionId: c.id }}
                className="absolute inset-y-0 left-0 right-24 rounded-l-2xl"
                aria-label={`Open collection ${c.name}`}
              />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 pointer-events-none">
                  <div className="font-semibold text-sm text-foreground truncate">{c.name}</div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span>{c.paperIds.length} papers</span>
                    <span>·</span>
                    <span>Updated {formatTimeAgo(c.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 relative z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openRename(c);
                    }}
                    className="p-2 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 relative"
                    title="Rename"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(c);
                    }}
                    className="p-2 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 relative"
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
      <GlobalAiCollectionModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        collections={collections}
        onAnalysisSuccess={(res, timestamp) => {
          setCurrentAiAnalysis(res);
          setAnalysisTimestamp(timestamp);
          setAnalysisSheetOpen(true);
        }}
      />

      <GlobalLiteratureMatrixModal
        open={globalMatrixOpen}
        onOpenChange={setGlobalMatrixOpen}
        collections={collections}
        onGenerateSuccess={(res) => {
          setCurrentMatrixData(res);
          setMatrixResultOpen(true);
        }}
      />

      <LiteratureMatrixModal
        open={matrixResultOpen}
        onOpenChange={setMatrixResultOpen}
        data={currentMatrixData}
        isLoading={false}
      />

      <AiCollectionAnalysisSheet
        open={analysisSheetOpen}
        onOpenChange={setAnalysisSheetOpen}
        data={currentAiAnalysis}
        timestamp={analysisTimestamp}
      />

      <AiHistoryDrawer
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        defaultTab="COLLECTION_ANALYSIS"
        onSelectHistory={(res, timestamp, type) => {
          if (type === "LITERATURE_MATRIX" || (res?.matrixRows && res?.markdownTable)) {
            setCurrentMatrixData(res);
            setMatrixResultOpen(true);
          } else if (type === "COLLECTION_ANALYSIS" || res?.collectionName) {
            setCurrentAiAnalysis(res);
            setAnalysisTimestamp(timestamp);
            setAnalysisSheetOpen(true);
          } else {
            toast.info("This is a Trend Analysis report. Go to Trends page to view trend reports.");
          }
        }}
      />
    </AppLayout>
  );
}
