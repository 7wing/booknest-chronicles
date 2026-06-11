import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAddToShelf } from "@/hooks/useBooks";
import { BookOpen, Check, Plus, BookMarked, Clock, XCircle } from "lucide-react";

const SHELF_OPTIONS = [
  { value: "reading" as const, label: "Currently Reading", icon: BookOpen },
  { value: "tbr" as const, label: "Want to Read", icon: Clock },
  { value: "finished" as const, label: "Finished", icon: Check },
  { value: "wishlist" as const, label: "Wishlist", icon: BookMarked },
  { value: "dnf" as const, label: "DNF", icon: XCircle },
];

interface AddToShelfButtonProps {
  bookId: string;
}

export function AddToShelfButton({ bookId }: AddToShelfButtonProps) {
  const { user } = useAuthStore();
  const addToShelf = useAddToShelf();

  const { data: userBook } = useQuery({
    queryKey: ["user-book", user?.id, bookId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!bookId,
  });

  const currentOption = SHELF_OPTIONS.find((o) => o.value === userBook?.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="gold-gradient text-accent-foreground border-0 gap-2"
          disabled={addToShelf.isPending}
        >
          {currentOption ? (
            <currentOption.icon className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {currentOption ? currentOption.label : "Add to Shelf"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SHELF_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => addToShelf.mutate({ bookId, status: opt.value })}
            className="gap-2 cursor-pointer"
          >
            <opt.icon className="h-4 w-4" />
            {opt.label}
            {userBook?.status === opt.value && (
              <Check className="h-3 w-3 ml-auto text-accent" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
