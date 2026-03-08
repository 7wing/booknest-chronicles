import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { books, posts } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { Settings, Edit2, BookOpen, Users, Award, Calendar } from "lucide-react";

const badges = ["🏆 Top Reviewer", "📚 50 Books", "🔥 30-Day Streak", "💬 Discussion Leader"];
const profileTabs = ["Shelves", "Posts", "Connections", "Clubs"];

const ProfilePage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-5 md:py-6 space-y-6">
        {/* Profile Header */}
        <div className="glass-card p-5 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-accent/30">
              <AvatarFallback className="bg-accent/10 text-accent text-2xl font-heading font-bold">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">Jane Doe</h1>
                <div className="flex gap-2 justify-center md:justify-start">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Avid reader, fantasy lover, and coffee enthusiast. Currently exploring literary fiction. 📖☕
              </p>
              <div className="flex gap-4 justify-center md:justify-start text-sm">
                <span><strong className="text-foreground">142</strong> <span className="text-muted-foreground">following</span></span>
                <span><strong className="text-foreground">1.2k</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong className="text-foreground">42</strong> <span className="text-muted-foreground">books</span></span>
              </div>
            </div>
            <div className="hidden md:block">
              <ProgressRing progress={60} size={90} strokeWidth={6} label="12" sublabel="of 20" />
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            {badges.map((b) => (
              <Badge key={b} className="bg-secondary text-secondary-foreground border-0 text-xs">{b}</Badge>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: "Books", value: "42" },
            { icon: Calendar, label: "Streak", value: "12d" },
            { icon: Users, label: "Clubs", value: "5" },
            { icon: Award, label: "Badges", value: "8" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center space-y-1">
              <s.icon className="h-4 w-4 text-accent mx-auto" />
              <p className="font-heading text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none border-b border-border pb-2">
          {profileTabs.map((tab, i) => (
            <button
              key={tab}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg min-h-[44px] ${
                i === 0
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Shelf Grid */}
        <section>
          <h2 className="font-heading text-lg font-bold mb-3">Favorite Shelves</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} size="sm" />
            ))}
          </div>
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="font-heading text-lg font-bold mb-3">Recent Posts</h2>
          <div className="space-y-4">
            {posts.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
