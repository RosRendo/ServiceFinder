"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatBubble from "@/components/messages/ChatBubble";
import ConversationItem from "@/components/messages/ConversationItem";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Phone, Video, MoreVertical, ImageIcon, Paperclip, Smile, MessageCircle, Search, Loader2 } from "lucide-react";
import { useConversations, useMessages } from "@/lib/hooks/useChat";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { toast } from "sonner";

const AdminMessagesInner = () => {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const { conversations, loading: convsLoading, refetch: refetchConversations } = useConversations();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [newChatUser, setNewChatUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useMessages(activeConversationId || undefined);
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const displayUser = activeConversation?.otherUser || newChatUser;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchUserInfo = async (id: string) => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const userData = data.data?.user || data.data || data;
          setNewChatUser({ id: userData.id.toString(), name: userData.fullName, role: userData.role, avatar: userData.avatar });
        } else {
          toast.error("User not found");
        }
      } catch { toast.error("Failed to load user info"); }
    };

    const conversationParam = searchParams.get("conversation");
    const newParam = searchParams.get("new");

    if (conversationParam) {
      setActiveConversationId(conversationParam);
      setShowMobileChat(true);
      setNewChatUser(null);
    } else if (newParam) {
      const existing = conversations.find((c) => c.otherUser?.id === newParam);
      if (existing) { setActiveConversationId(existing.id); setNewChatUser(null); }
      else { setActiveConversationId(null); fetchUserInfo(newParam); }
      setShowMobileChat(true);
    } else if (conversations.length > 0 && !activeConversationId && !newParam) {
      setActiveConversationId(conversations[0].id);
      setNewChatUser(null);
    }
  }, [searchParams, conversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || (!activeConversationId && !newChatUser)) return;
    const recipientId = activeConversationId ? undefined : newChatUser?.id;
    const result = await sendMessage({ content: newMessage, conversationId: activeConversationId || undefined, recipientId });
    if (result.success) {
      if (!activeConversationId && result.conversationId) {
        setActiveConversationId(result.conversationId);
        setNewChatUser(null);
        refetchConversations();
      }
      setNewMessage("");
    } else {
      toast.error("Failed to send message: " + (result.error || "Unknown error"));
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Platform Messages</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Communicate with users, providers, and handle platform-wide messaging.</p>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 bg-background border border-border rounded-xl shadow-sm overflow-hidden flex min-h-0">
        {/* Sidebar: Conversations */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-muted/10 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search conversations..."
                className="w-full h-9 bg-muted/30 border border-border rounded-lg pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {convsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
              </div>
            ) : conversations.length > 0 ? (
              <div className="divide-y divide-border/50">
                {conversations.map((conv) => (
                  <ConversationItem key={conv.id} conversation={conv} isActive={activeConversationId === conv.id}
                    onClick={() => { setActiveConversationId(conv.id); setNewChatUser(null); setShowMobileChat(true); }} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 flex flex-col items-center">
                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3 border border-border">
                  <MessageCircle className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground text-sm">No conversations</p>
                <p className="text-xs text-muted-foreground mt-1">You haven't started any chats yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showMobileChat ? "flex" : "hidden md:flex"}`}>
          {displayUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background shrink-0">
                <button onClick={() => setShowMobileChat(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="relative">
                  {displayUser.avatar ? (
                    <img src={displayUser.avatar} alt={displayUser.name} className="h-9 w-9 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                      {displayUser.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground truncate text-sm">{displayUser.name}</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{displayUser.role?.replace("_", " ") || "User"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><Video className="h-4 w-4" /></Button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-background">
                {messages.map((msg, index) => (
                  <ChatBubble key={msg.id || `msg-${index}`} message={msg} currentUserId={user ? String(user.id) : null} />
                ))}
                <div ref={messagesEndRef} />
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
                    <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center border border-border">
                      <MessageCircle className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <p>Send a message to start the conversation</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-background shrink-0">
                <div className="flex items-end gap-2 bg-muted/20 rounded-xl border border-border p-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                  <div className="flex items-center gap-1 pb-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><Paperclip className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><ImageIcon className="h-4 w-4" /></Button>
                  </div>
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message..." rows={1}
                    className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent p-2 text-sm font-medium focus:outline-none text-foreground placeholder:text-muted-foreground" />
                  <div className="flex items-center gap-2 pb-1">
                    <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"><Smile className="h-4 w-4" /></Button>
                    <Button onClick={handleSend} disabled={!newMessage.trim()}
                      className="h-8 w-8 p-0 rounded-lg disabled:opacity-40 transition-all">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center border border-border mb-4">
                <MessageCircle className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Your Messages</h3>
              <p className="text-sm mt-1">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminMessages() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>}>
      <AdminMessagesInner />
    </Suspense>
  );
}
