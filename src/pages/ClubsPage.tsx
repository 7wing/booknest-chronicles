import { Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCover } from '@/components/shared/BookCover';
import {
  useClubs,
  useClubMembership,
  useJoinClub,
  useLeaveClub,
} from '@/hooks/useClubs';

interface ClubCardProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    member_count: number;
    current_book: {
      id: string;
      title: string;
      author: string | null;
      cover_url: string | null;
    } | null;
  };
}

function ClubCard({ club }: ClubCardProps) {
  const { data: isMember, isLoading: membershipLoading } = useClubMembership(club.id);
  const joinClub = useJoinClub();
  const leaveClub = useLeaveClub();

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Club header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg font-semibold text-foreground truncate">
            {club.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{club.member_count} members</span>
          </div>
        </div>
        {membershipLoading ? (
          <Skeleton className="h-9 w-24 rounded-lg" />
        ) : isMember ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => leaveClub.mutate({ clubId: club.id })}
            disabled={leaveClub.isPending}
          >
            {leaveClub.isPending ? 'Leaving...' : 'Leave'}
          </Button>
        ) : (
          <Button
            size="sm"
            className="gold-gradient shrink-0"
            onClick={() => joinClub.mutate({ clubId: club.id })}
            disabled={joinClub.isPending}
          >
            {joinClub.isPending ? 'Joining...' : 'Join'}
          </Button>
        )}
      </div>

      {/* Description */}
      {club.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {club.description}
        </p>
      )}

      {/* Current book */}
      {club.current_book && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <div className="w-10 h-14 rounded overflow-hidden shrink-0">
            <BookCover
              src={club.current_book.cover_url}
              alt={club.current_book.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">
              Currently reading
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {club.current_book.title}
            </p>
            {club.current_book.author && (
              <p className="text-xs text-muted-foreground truncate">
                {club.current_book.author}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClubsPageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <Skeleton className="h-14 w-10 rounded" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClubsPage() {
  const { data: clubs, isLoading, error } = useClubs();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-5 md:py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Reading Clubs
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Join a club and read together
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {clubs?.length ?? 0} clubs
          </Badge>
        </div>

        {/* Error state */}
        {error && (
          <div className="glass-card p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Failed to load clubs. Please try again.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && <ClubsPageSkeleton />}

        {/* Empty state */}
        {!isLoading && !error && clubs?.length === 0 && (
          <div className="glass-card p-10 text-center space-y-3">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No clubs yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to create a reading club!
            </p>
          </div>
        )}

        {/* Clubs grid */}
        {!isLoading && !error && clubs && clubs.length > 0 && (
          <div className="space-y-4">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}