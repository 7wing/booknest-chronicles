import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/shared/BookCover";
import { clubs } from "@/lib/mock-data";
import { useFeed } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, MessageSquare } from "lucide-react";

const tabs = ["Following", "For You", "Clubs", "Challenges"];

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState<string>("For You");
  const { data: posts, isLoading } = useFeed(activeTab === "Following" ? "Following" : "For You");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Community</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <Badge
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 cursor-pointer text-sm py-1.5 px-4 ${
                activeTab === tab
                  ? "bg-accent text-accent-foreground border-0"
                  : "bg-secondary text-secondary-foreground border-0 hover:bg-accent/15"
              }`}
            >
              {tab}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            ) : posts && posts.length > 0 ? (
              posts.map((post, i) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            ) : (
              <div className="glass-card p-8 text-center space-y-2">
                <p className="font-heading text-base text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground">Follow some readers or share your first book thought!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-heading text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Your Clubs
              </h3>
              {clubs.map((club) => (
                <div key={club.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                  <BookCover src={club.currentBook.cover} alt={club.currentBook.title} className="h-10 w-7 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{club.name}</p>
                    <p className="text-[11px] text-muted-foreground">{club.members.toLocaleString()} members</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-4 space-y-3">
              <h3 className="font-heading text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Active Discussions
              </h3>
              {[
                { title: "Best fantasy debut of 2026?", replies: 89 },
                { title: "Unpopular book opinions thread", replies: 234 },
                { title: "March read-along picks", replies: 56 },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.replies} replies</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default CommunityPage;
