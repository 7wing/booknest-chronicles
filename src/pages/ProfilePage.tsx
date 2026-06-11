import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BookCard } from "@/components/BookCard";
import { ProgressRing } from "@/components/ProgressRing";
import { FollowButton } from "@/components/profile/FollowButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";
import { books, posts } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { Settings, Edit2, BookOpen, Users, Award, Calendar } from "lucide-react";

const badges = ["🏆 Top Reviewer", "📚 50 Books", "🔥 30-Day Streak", "💬 Discussion Leader"];
const profileTabs = ["Shelves", "Posts", "Connections", "Clubs"];

const ProfilePage = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    location: "",
    website: "",
  });

  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.id;
  const { data: profile, isLoading } = useProfile(userId);
  const updateProfile = useUpdateProfile();

  const isOwnProfile = !userId || profile?.id === userId;

  const handleOpenEdit = () => {
    setEditForm({
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateProfile.mutate(
      {
        display_name: editForm.display_name,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
      },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-5 md:py-6 space-y-6">
          <div className="glass-card p-5 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full" />
              <div className="flex-1 text-center md:text-left space-y-3 w-full">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
                <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const displayName = profile?.display_name || "Reader";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-5 md:py-6 space-y-6">
        {/* Profile Header */}
        <div className="glass-card p-5 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            <AvatarUpload />
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {displayName}
                </h1>
                <div className="flex gap-2 justify-center md:justify-start">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={handleOpenEdit}
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                  ) : (
                    <FollowButton targetUserId={profile?.id || ""} />
                  )}
                  {isOwnProfile && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground max-w-md">{profile.bio}</p>
              )}
              {(profile?.location || profile?.website) && (
                <div className="flex gap-3 text-xs text-muted-foreground justify-center md:justify-start">
                  {profile.location && <span>{profile.location}</span>}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              )}
              <div className="flex gap-4 justify-center md:justify-start text-sm">
                <span>
                  <strong className="text-foreground">-</strong>{" "}
                  <span className="text-muted-foreground">following</span>
                </span>
                <span>
                  <strong className="text-foreground">-</strong>{" "}
                  <span className="text-muted-foreground">followers</span>
                </span>
                <span>
                  <strong className="text-foreground">-</strong>{" "}
                  <span className="text-muted-foreground">books</span>
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <ProgressRing progress={60} size={90} strokeWidth={6} label="12" sublabel="of 20" />
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            {badges.map((b) => (
              <Badge key={b} className="bg-secondary text-secondary-foreground border-0 text-xs">
                {b}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: "Books", value: "-" },
            { icon: Calendar, label: "Streak", value: "-" },
            { icon: Users, label: "Clubs", value: "-" },
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

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="display_name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="display_name"
                value={editForm.display_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, display_name: e.target.value }))
                }
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="website"
                type="url"
                value={editForm.website}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ProfilePage;