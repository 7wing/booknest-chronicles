import { useState } from "react";
import { useUpdateProgress } from "@/hooks/useReadingProgress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface ProgressUpdaterProps {
  userBookId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
}

export function ProgressUpdater({
  userBookId,
  bookId,
  currentPage,
  totalPages,
}: ProgressUpdaterProps) {
  const [page, setPage] = useState(currentPage);
  const mutation = useUpdateProgress();

  const handleSave = () => {
    mutation.mutate({
      userBookId,
      bookId,
      currentPage: page,
      totalPages,
    });
  };

  return (
    <div className="space-y-3">
      <Slider
        value={[page]}
        min={0}
        max={totalPages}
        step={1}
        onValueChange={([v]) => setPage(v)}
        disabled={mutation.isPending}
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={mutation.isPending || page === currentPage}
        >
          {mutation.isPending ? "Saving..." : "Save Progress"}
        </Button>
      </div>
    </div>
  );
}
