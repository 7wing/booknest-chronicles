import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MoreVertical, ArrowLeft, BookOpen, Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMessages, useSendMessage, useConversations } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/authStore";

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { messages, isLoading: messagesLoading } = useMessages(selectedChat);
  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedChat || !messageInput.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedChat,
      content: messageInput.trim(),
    });
    
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedChat);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] lg:h-screen flex">
        {/* Sidebar - hidden on mobile when chat selected */}
        <div className={`${selectedChat ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col border-r border-border bg-card`}>
          <div className="p-4 border-b border-border">
            <h1 className="font-heading text-xl font-bold text-foreground">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChat(c.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors min-h-[64px] ${
                    selectedChat === c.id ? "bg-accent/10" : "hover:bg-secondary"
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-accent/20">
                    {c.other_user?.avatar_url ? (
                      <AvatarImage src={c.other_user.avatar_url} alt={c.other_user.display_name || ""} />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(c.other_user?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold truncate">
                        {c.other_user?.display_name || c.other_user?.username || "Unknown User"}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {c.last_message_at ? formatRelativeTime(c.last_message_at) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                  </div>
                  {(c.unread_count || 0) > 0 && (
                    <Badge className="bg-accent text-accent-foreground border-0 text-[10px] h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {c.unread_count}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1 flex-col bg-background`}>
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSelectedChat(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8 border-2 border-accent/20">
                  {selectedConversation?.other_user?.avatar_url ? (
                    <AvatarImage src={selectedConversation.other_user.avatar_url} alt={selectedConversation.other_user.display_name || ""} />
                  ) : null}
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                    {getInitials(selectedConversation?.other_user?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {selectedConversation?.other_user?.display_name || selectedConversation?.other_user?.username || "Unknown User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9"><BookOpen className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                          msg.sender_id === user?.id
                            ? "bg-accent text-accent-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-3 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Smile className="h-5 w-5" /></Button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-10 px-4 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    size="icon" 
                    className="h-10 w-10 gold-gradient text-accent-foreground border-0 shrink-0"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;