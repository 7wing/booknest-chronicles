import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { posts, clubs } from "@/lib/mock-data";
import { Users, TrendingUp, MessageSquare } from "lucide-react";

const tabs = ["Following", "For You", "Clubs", "Challenges"];

const CommunityPage = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Community</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab, i) => (
            <Badge
              key={tab}
              className={`shrink-0 cursor-pointer text-sm py-1.5 px-4 ${
                i === 0
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
            {posts.map((post, i) => (
              <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
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
                  <img src={club.currentBook.cover} alt="" className="h-10 w-7 rounded object-cover" />
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
