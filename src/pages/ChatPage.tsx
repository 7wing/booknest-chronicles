import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, MoreVertical, ArrowLeft, BookOpen, Smile } from "lucide-react";
import { useState } from "react";

const conversations = [
  { id: "1", name: "Sarah Chen", avatar: "SC", lastMsg: "Have you started The Midnight Library?", time: "2m", unread: 2 },
  { id: "2", name: "Midnight Readers", avatar: "MR", lastMsg: "James: The ending was incredible!", time: "15m", unread: 0 },
  { id: "3", name: "Maya Patel", avatar: "MP", lastMsg: "Thanks for the recommendation! 📖", time: "1h", unread: 0 },
  { id: "4", name: "Book Club Chat", avatar: "BC", lastMsg: "Next month we're reading...", time: "3h", unread: 5 },
];

const messages = [
  { id: "1", sender: "them", name: "Sarah Chen", text: "Have you started The Midnight Library yet?", time: "10:23 AM" },
  { id: "2", sender: "me", text: "Yes! I'm about 68% through and it's SO good", time: "10:25 AM" },
  { id: "3", sender: "them", name: "Sarah Chen", text: "Right?! The concept of the root life is genius. I finished it last night and I'm still thinking about it", time: "10:26 AM" },
  { id: "4", sender: "me", text: "No spoilers please! 😂 But I can already tell this is going to be a 5-star read for me", time: "10:28 AM" },
  { id: "5", sender: "them", name: "Sarah Chen", text: "My lips are sealed 🤐 But definitely come discuss in the club when you're done!", time: "10:30 AM" },
];

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>("1");

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] lg:h-screen flex">
        {/* Sidebar - hidden on mobile when chat selected */}
        <div className={`${selectedChat ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col border-r border-border bg-card`}>
          <div className="p-4 border-b border-border">
            <h1 className="font-heading text-xl font-bold text-foreground">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors min-h-[64px] ${
                  selectedChat === c.id ? "bg-accent/10" : "hover:bg-secondary"
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0 border-2 border-accent/20">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{c.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <Badge className="bg-accent text-accent-foreground border-0 text-[10px] h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {c.unread}
                  </Badge>
                )}
              </button>
            ))}
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
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Sarah Chen</p>
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9"><BookOpen className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "me"
                        ? "bg-accent text-accent-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Smile className="h-5 w-5" /></Button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-4 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="icon" className="h-10 w-10 gold-gradient text-accent-foreground border-0 shrink-0">
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
