import { AppLayout } from "@/components/AppLayout";
import { LiveCard } from "@/components/LiveCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookCover } from "@/components/shared/BookCover";
import { liveSessions, books } from "@/lib/mock-data";
import { Users, Heart, MessageCircle, Send, Maximize2, Volume2, ThumbsUp, Smile, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLiveChat } from "@/hooks/useLiveChat";

const LivePage = () => {
  const [showChat, setShowChat] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const session = liveSessions[0];
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use the session ID from the session or a mock ID for now
  const sessionId = session?.id ?? "default";

  const { messages, viewerCount, isLoading, sendMessage, isSending } = useLiveChat(sessionId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Video/Content Area */}
          <div className="flex-1">
            <div className="relative aspect-video bg-navy overflow-hidden">
              <img src={session.thumbnail} alt="" className="h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <span className="live-badge text-sm px-4 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                    LIVE
                  </span>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground drop-shadow-lg">
                    {session.title}
                  </h2>
                  <p className="text-primary-foreground/70">{session.host}</p>
                </div>
              </div>

              {/* Controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/60 to-transparent flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-primary-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">{viewerCount} watching</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <BookCover src={session.book.cover} alt={session.book.title} className="h-14 w-10 rounded object-cover" />
                  <div>
                    <h3 className="font-heading text-base font-bold">{session.book.title}</h3>
                    <p className="text-xs text-muted-foreground">by {session.book.author} · Page 142</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gold-gradient text-accent-foreground border-0 gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Follow
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 lg:hidden" onClick={() => setShowChat(!showChat)}>
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </Button>
                </div>
              </div>

              {/* Reactions */}
              <div className="flex gap-2 mt-3">
                {["❤️", "🔥", "📖", "😂", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:scale-110 transition-transform text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-80 xl:w-96 flex-col border-l border-border bg-card h-[50vh] lg:h-[calc(100vh-64px)]`}>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Live Chat</h3>
              <Badge className="bg-accent/15 text-accent border-0 text-[10px]">{viewerCount} viewers</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="bg-secondary text-[8px]">
                          {msg.user?.display_name?.slice(0, 2).toUpperCase() ?? msg.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-semibold text-accent">
                          {msg.user?.display_name ?? "Anonymous"}
                        </span>
                        <p className="text-xs text-foreground">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Say something..."
                  className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 gold-gradient text-accent-foreground border-0"
                  onClick={handleSendMessage}
                  disabled={isSending || !messageInput.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* More Live Sessions */}
        <div className="p-4 space-y-4">
          <h2 className="font-heading text-lg font-bold">More Live Sessions</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-none">
            {liveSessions.map((s) => (
              <div key={s.id} className="snap-start"><LiveCard session={s} /></div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LivePage;