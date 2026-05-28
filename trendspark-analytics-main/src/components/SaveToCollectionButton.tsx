import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { SaveToCollectionDialog } from "@/components/SaveToCollectionDialog";
import { useCollections } from "@/hooks/data/use-collections";

export function SaveToCollectionButton({
  paperId,
  paperTitle,
  size = "sm",
  className,
}: {
  paperId: string;
  paperTitle?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { data: collections = [] } = useCollections();
  const [open, setOpen] = useState(false);

  const savedCount = useMemo(() => {
    return collections.reduce((acc, c) => (c.paperIds.includes(paperId) ? acc + 1 : acc), 0);
  }, [collections, paperId]);

  const saved = savedCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-md border transition-all",
          size === "sm" ? "p-1.5" : "h-9 px-4 inline-flex items-center gap-2 text-sm font-medium",
          saved
            ? "border-brand/50 bg-brand/15 text-brand hover:bg-brand/20"
            : "border-border hover:border-brand/40 hover:text-brand",
          className,
        )}
        title={saved ? `Saved in ${savedCount} collection${savedCount === 1 ? "" : "s"}` : "Save to collection"}
      >
        {size === "sm" ? (
          saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />
        ) : (
          <>
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            {saved ? `Saved (${savedCount})` : "Save"}
          </>
        )}
      </button>

      <SaveToCollectionDialog open={open} onOpenChange={setOpen} paperId={paperId} paperTitle={paperTitle} />
    </>
  );
}

