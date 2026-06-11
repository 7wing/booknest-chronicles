import { supabase } from "@/lib/supabase";

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

export interface GoogleBook {
  google_books_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  pages: number | null;
  genre: string | null;
  isbn: string | null;
  published_date: string | null;
}

function normalizeGoogleBook(item: any): GoogleBook {
  const info = item.volumeInfo ?? {};
  const isbn13 = info.industryIdentifiers?.find(
    (i: any) => i.type === "ISBN_13"
  )?.identifier;
  const isbn10 = info.industryIdentifiers?.find(
    (i: any) => i.type === "ISBN_10"
  )?.identifier;

  return {
    google_books_id: item.id,
    title: info.title ?? "Unknown Title",
    author: info.authors?.[0] ?? "Unknown Author",
    cover_url:
      info.imageLinks?.thumbnail?.replace("http:", "https:") ??
      info.imageLinks?.smallThumbnail?.replace("http:", "https:") ??
      null,
    description: info.description ?? null,
    pages: info.pageCount ?? null,
    genre: info.categories?.[0] ?? null,
    isbn: isbn13 ?? isbn10 ?? null,
    published_date: info.publishedDate ?? null,
  };
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 10
): Promise<GoogleBook[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GOOGLE_BOOKS_API_KEY is not set");
  }

  const params = new URLSearchParams({
    q: query,
    maxResults: String(Math.min(Math.max(maxResults, 1), 40)),
    ...(apiKey ? { key: apiKey } : {}),
  });

  const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes?${params}`);
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items?.map(normalizeGoogleBook) ?? [];
}

export async function addBookToDatabase(
  bookData: GoogleBook
): Promise<string | null> {
  const { data, error } = await supabase
    .from("books")
    .upsert(
      {
        google_books_id: bookData.google_books_id,
        title: bookData.title,
        author: bookData.author,
        cover_url: bookData.cover_url,
        description: bookData.description,
        pages: bookData.pages,
        genre: bookData.genre,
        isbn: bookData.isbn,
        published_date: bookData.published_date,
      },
      { onConflict: "google_books_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Error upserting book:", error);
    throw error;
  }

  return data?.id ?? null;
}
