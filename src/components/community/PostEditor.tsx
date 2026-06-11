import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useDebounce } from "use-debounce";
import { useUIStore } from "@/store/uiStore";
import { useCreatePost } from "@/hooks/usePosts";
import { useBookSearch } from "@/hooks/useBooks";
import { useUpload } from "@/hooks/useUpload";
import { Post } from "@/hooks/usePosts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const postSchema = z.object({
  content: z.string().min(1, "Say something!").max(2000),
  type: z.enum(["review", "quote", "update", "poll"]),
  rating: z.number().min(1).max(5).optional(),
  bookId: z.string().optional(),
  containsSpoilers: z.boolean().default(false),
});

type PostFormValues = z.infer<typeof postSchema>;

const typePlaceholders: Record<PostFormValues["type"], string> = {
  review: "Share your review... What did you think?",
  quote: 'Share a quote that resonated with you... "Quote text here..."',
  update: "What are you reading now? Any progress to share?",
  poll: "Ask your followers a question...",
};

export function PostEditor() {
  const { isPostEditorOpen, closePostEditor } = useUIStore();
  const [bookSearch, setBookSearch] = useState("");
  const [debouncedSearch] = useDebounce(bookSearch, 400);
  const [selectedBook, setSelectedBook] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showBookPopover, setShowBookPopover] = useState(false);

  const { data: bookResults, isLoading: isSearchingBooks } = useBookSearch(
    debouncedSearch
  );

  const createPost = useCreatePost();
  const { upload, isUploading, progress } = useUpload();

  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    onDrop: (files) => {
      const newPreviews = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setPreviewImages((prev) => [...prev, ...newPreviews].slice(0, 4));
    },
  });

  const removeImage = (index: number) => {
    setPreviewImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (previewImages.length === 0) return [];
    const urls: string[] = [];
    for (const { file } of previewImages) {
      const url = await upload(file, {
        bucket: "post-images",
        folder: undefined,
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
      });
      urls.push(url);
    }
    return urls;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isPending },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      type: "review",
      rating: undefined,
      bookId: undefined,
      containsSpoilers: false,
    },
  });

  const postType = watch("type");

  // Set bookId when a book is selected
  useEffect(() => {
    if (selectedBook) {
      setValue("bookId", selectedBook.id);
    } else {
      setValue("bookId", undefined);
    }
  }, [selectedBook, setValue]);

  const onSubmit = async (data: PostFormValues) => {
    let imageUrls: string[] = [];
    if (previewImages.length > 0) {
      imageUrls = await uploadImages();
    }

    const postData: Partial<Post> = {
      content: data.content,
      type: data.type,
      contains_spoilers: data.containsSpoilers,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    if (data.type === "review" && data.rating) {
      postData.rating = data.rating;
    }

    if (data.bookId) {
      postData.book_id = data.bookId;
    }

    createPost.mutate(postData, {
      onSuccess: () => {
        closePostEditor();
        reset();
        setSelectedBook(null);
        setBookSearch("");
        previewImages.forEach((img) => URL.revokeObjectURL(img.url));
        setPreviewImages([]);
      },
    });
  };

  const handleBookSelect = (book: { id: string; title: string }) => {
    setSelectedBook(book);
    setShowBookPopover(false);
    setBookSearch(book.title);
  };

  const clearBookSelection = () => {
    setSelectedBook(null);
    setBookSearch("");
    setValue("bookId", undefined);
  };

  return (
    <Dialog open={isPostEditorOpen} onOpenChange={closePostEditor}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Create Post</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 flex-1 overflow-hidden"
        >
          {/* Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="type">Post Type</Label>
            <Select
              value={watch("type")}
              onValueChange={(value: PostFormValues["type"]) =>
                setValue("type", value)
              }
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="poll">Poll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Book Search */}
          <div className="space-y-2">
            <Label htmlFor="book-search">Book (Optional)</Label>
            <Popover open={showBookPopover} onOpenChange={setShowBookPopover}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="book-search"
                    placeholder="Search for a book..."
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      if (selectedBook) clearBookSelection();
                    }}
                    className="w-full pr-10"
                  />
                  {selectedBook && (
                    <button
                      type="button"
                      onClick={clearBookSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-[500px] p-0"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <Command>
                  <CommandInput placeholder="Search books..." />
                  <CommandList>
                    {isSearchingBooks ? (
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : bookResults && bookResults.length > 0 ? (
                      <CommandGroup>
                        <ScrollArea className="max-h-[250px]">
                          {bookResults.map((book) => (
                            <CommandItem
                              key={book.id}
                              value={book.id}
                              onSelect={() =>
                                handleBookSelect({
                                  id: book.id,
                                  title: book.title,
                                })
                              }
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {book.title}
                                </span>
                                {book.author && (
                                  <span className="text-sm text-muted-foreground">
                                    {book.author}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    ) : debouncedSearch ? (
                      <CommandEmpty>No books found</CommandEmpty>
                    ) : null}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedBook && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{selectedBook.title}</span>
              </p>
            )}
          </div>

          {/* Rating (only for reviews) */}
          {postType === "review" && (
            <div className="space-y-2">
              <Label>Rating (Optional)</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      const current = watch("rating");
                      setValue("rating", current === star ? undefined : star);
                    }}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (watch("rating") ?? 0) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-muted-foreground hover:text-amber-400"
                      )}
                    />
                  </button>
                ))}
                {watch("rating") && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {watch("rating")}/5
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder={typePlaceholders[postType]}
              className="min-h-[150px] flex-1 resize-none"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {watch("content")?.length ?? 0}/2000
            </p>
          </div>

          {/* Contains Spoilers Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="contains-spoilers"
              checked={watch("containsSpoilers")}
              onCheckedChange={(checked) =>
                setValue("containsSpoilers", checked)
              }
            />
            <Label htmlFor="contains-spoilers" className="cursor-pointer">
              Contains spoilers
            </Label>
          </div>

          {/* Submit Button */}
          <div className="space-y-3">
            {/* Image attachment UI */}
            {previewImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previewImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">
                  {isDragActive
                    ? "Drop images here..."
                    : isUploading
                    ? `Uploading ${progress}%...`
                    : "Drag & drop images or click to select"}
                </span>
                {isUploading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || isUploading}
            className={cn(
              "w-full font-semibold transition-all",
              !isPending && !isUploading && "gold-gradient hover:opacity-90"
            )}
          >
            {isPending || isUploading ? "Posting..." : "Post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}