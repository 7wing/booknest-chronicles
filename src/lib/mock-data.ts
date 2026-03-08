import bookCover1 from "@/assets/book-cover-1.jpg";
import bookCover2 from "@/assets/book-cover-2.jpg";
import bookCover3 from "@/assets/book-cover-3.jpg";
import bookCover4 from "@/assets/book-cover-4.jpg";
import bookCover5 from "@/assets/book-cover-5.jpg";
import bookCover6 from "@/assets/book-cover-6.jpg";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  genre: string;
  progress?: number;
  pages: number;
  mood?: string;
}

export interface Post {
  id: string;
  user: { name: string; avatar: string; };
  type: "review" | "quote" | "update" | "poll";
  content: string;
  book?: Book;
  likes: number;
  comments: number;
  timestamp: string;
  rating?: number;
}

export interface LiveSession {
  id: string;
  title: string;
  host: string;
  book: Book;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
}

export interface Club {
  id: string;
  name: string;
  members: number;
  currentBook: Book;
  description: string;
}

export const books: Book[] = [
  { id: "1", title: "The Midnight Library", author: "Matt Haig", cover: bookCover1, rating: 4.2, genre: "Fantasy", progress: 68, pages: 304, mood: "Hopeful" },
  { id: "2", title: "Lessons in Chemistry", author: "Bonnie Garmus", cover: bookCover2, rating: 4.5, genre: "Literary Fiction", progress: 100, pages: 400, mood: "Empowering" },
  { id: "3", title: "Beach Read", author: "Emily Henry", cover: bookCover3, rating: 4.1, genre: "Romance", progress: 45, pages: 361, mood: "Light" },
  { id: "4", title: "Project Hail Mary", author: "Andy Weir", cover: bookCover4, rating: 4.8, genre: "Sci-Fi", pages: 496, mood: "Thrilling" },
  { id: "5", title: "The Silent Patient", author: "Alex Michaelides", cover: bookCover5, rating: 4.0, genre: "Thriller", pages: 325, mood: "Dark" },
  { id: "6", title: "The Seven Husbands", author: "Taylor Jenkins Reid", cover: bookCover6, rating: 4.3, genre: "Historical Fiction", progress: 20, pages: 389, mood: "Nostalgic" },
];

export const posts: Post[] = [
  {
    id: "1", user: { name: "Sarah Chen", avatar: "SC" }, type: "review",
    content: "Just finished The Midnight Library and I'm emotional. Matt Haig has this incredible ability to make you reflect on your own life choices. The concept of the root life vs branch lives is genius.",
    book: books[0], likes: 142, comments: 23, timestamp: "2h ago", rating: 5,
  },
  {
    id: "2", user: { name: "James Wright", avatar: "JW" }, type: "quote",
    content: '"Between life and death there is a library, and within that library, the shelves go on forever."',
    book: books[0], likes: 89, comments: 12, timestamp: "4h ago",
  },
  {
    id: "3", user: { name: "Maya Patel", avatar: "MP" }, type: "update",
    content: "45% through Beach Read and I can't put it down! The banter between the two writers is everything. 📖",
    book: books[2], likes: 56, comments: 8, timestamp: "6h ago",
  },
  {
    id: "4", user: { name: "Alex Rivera", avatar: "AR" }, type: "review",
    content: "Project Hail Mary is the best sci-fi I've read in years. Rocky is now my favorite fictional character of all time. The friendship that develops is pure and beautiful.",
    book: books[3], likes: 203, comments: 45, timestamp: "1d ago", rating: 5,
  },
];

export const liveSessions: LiveSession[] = [
  { id: "1", title: "Fantasy Book Club Live", host: "BookishBelle", book: books[0], viewers: 234, isLive: true, thumbnail: bookCover1 },
  { id: "2", title: "Author Q&A: New Releases", host: "LitLounge", book: books[3], viewers: 567, isLive: true, thumbnail: bookCover4 },
  { id: "3", title: "Cozy Mystery Read-Along", host: "MysteryMaven", book: books[4], viewers: 89, isLive: false, thumbnail: bookCover5 },
];

export const clubs: Club[] = [
  { id: "1", name: "Midnight Readers", members: 1243, currentBook: books[0], description: "Fantasy & magical realism enthusiasts" },
  { id: "2", name: "Page Turners Club", members: 892, currentBook: books[3], description: "Sci-fi and thriller lovers" },
  { id: "3", name: "Romance Bookworms", members: 2105, currentBook: books[2], description: "All things love and happily ever afters" },
];

export const genres = ["Fantasy", "Romance", "Sci-Fi", "Thriller", "Literary Fiction", "Historical Fiction", "Horror", "Non-Fiction", "YA", "Mystery"];
export const moods = ["Hopeful", "Dark", "Light", "Thrilling", "Nostalgic", "Empowering", "Cozy", "Adventurous"];
