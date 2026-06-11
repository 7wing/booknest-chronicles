import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function BookCover({ src, alt, className }: BookCoverProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "bg-secondary flex items-center justify-center rounded-lg",
          className
        )}
        aria-label={`No cover available for ${alt}`}
      >
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover of ${alt}`}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
