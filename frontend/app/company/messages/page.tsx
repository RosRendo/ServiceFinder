"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatBubble from "@/components/messages/ChatBubble";
import ConversationItem from "@/components/messages/ConversationItem";
import { Button } from "@/components/ui/button";
import {
    Send, ArrowLeft, Phone, Video, MoreVertical, ImageIcon, Paperclip, Smile, MessageCircle, Search, Info, Loader2
} from "lucide-react";
import { useConversations, useMessages } from "@/lib/hooks/useChat";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api/client";

function CompanyMessagesPageContent() {
    const searchParams = useSearchParams();
    const { user } = useAuthContext();
    const { conversations, refetch: refetchConversations } = useConversations();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [newChatUser, setNewChatUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.success(`Attached file: ${file.name}`);
            setNewMessage((prev) => (prev ? `${prev} [Attachment: ${file.name}]` : `[Attachment: ${file.name}]`));
        }
    };

    const { messages, sendMessage } = useMessages(activeConversationId || undefined);

    const activeConversation = conversations.find((c) => c.id === activeConversationId);
    const isArchived = activeConversation?.archivedAt
        ? new Date(activeConversation.archivedAt) <= new Date()
        : false;
    const displayUser = activeConversation?.otherUser || newChatUser;

    useEffect(() => {
        const fetchUserInfo = async (id: string) => {
            try {
                const res = await api.get(`/users/${id}`);
                const data = res.data;
                const userData = data.data?.user || data.data || data;
                setNewChatUser({
                    id: userData.id.toString(),
                    name: userData.fullName,
                    role: userData.role,
                    avatar: userData.avatar
                });
            } catch (e) {
                console.error("Failed to fetch user info", e);
                toast.error("Failed to load user info");
            }
        };

        const conversationParam = searchParams.get("conversation");
        const newParam = searchParams.get("new");

        if (conversationParam) {
            setActiveConversationId(conversationParam);
            setShowMobileChat(true);
            setNewChatUser(null);
        } else if (newParam) {
            const existing = conversations.find(c => c.otherUser?.id === newParam);
            if (existing) {
                setActiveConversationId(existing.id);
                setNewChatUser(null);
            } else {
                setActiveConversationId(null);
                fetchUserInfo(newParam);
            }
            setShowMobileChat(true);
        } else if (conversations.length > 0 && !activeConversationId) {
            if (!newParam) {
                setActiveConversationId(conversations[0].id);
                setNewChatUser(null);
            }
        }
    }, [searchParams, conversations]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        if (!activeConversationId && !newChatUser) return;

        const recipientId = activeConversationId ? undefined : newChatUser?.id;
        const result = await sendMessage({
            content: newMessage,
            conversationId: activeConversationId || undefined,
            recipientId: recipientId,
        });

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
        <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Messages</h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Communicate with your clients and staff.</p>
                </div>
            </div>

            <div className="flex-1 bg-background border border-border rounded-lg shadow-sm overflow-hidden flex min-h-[500px]">
                {/* Conversations List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-muted/30 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
                    <div className="p-4 border-b border-border bg-background">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                className="w-full h-9 bg-muted/30 border border-border rounded-md pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length > 0 ? (
                            <div className="divide-y divide-border">
                                {conversations.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isActive={activeConversationId === conv.id}
                                        onClick={() => {
                                            setActiveConversationId(conv.id);
                                            setNewChatUser(null);
                                            setShowMobileChat(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 flex flex-col items-center">
                                <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-3 border border-border">
                                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground text-sm">No conversations</p>
                                <p className="text-xs text-muted-foreground mt-1">You haven't started any chats yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-background ${showMobileChat ? "flex" : "hidden md:flex"}`}>
                    {displayUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-4 p-4 border-b border-border bg-background shrink-0">
                                <button onClick={() => setShowMobileChat(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>

                                <div className="relative">
                                    {displayUser.avatar ? (
                                        <img src={displayUser.avatar} alt={displayUser.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20 text-sm">
                                            {(displayUser.name || "U").split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-foreground truncate text-sm">{displayUser.name}</h2>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{displayUser.role?.replace('_', ' ') || 'User'}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => toast.info(`Starting voice call channel with ${displayUser.name}...`)}
                                        title="Voice Call"
                                    >
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => toast.info(`Video inspection available on mobile technician application.`)}
                                        title="Video Call"
                                    >
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <div className="w-px h-5 bg-muted mx-1"></div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => toast.info(`Contact profile: ${displayUser.name} (${displayUser.role || 'User'})`)}
                                        title="More details"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                {messages.map((msg, index) => (
                                    <ChatBubble
                                        key={msg.id || `msg-${index}`}
                                        message={msg}
                                        currentUserId={user ? String(user.id) : null}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                        <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center border border-border/50 mb-2">
                                            <MessageCircle className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p>Send a message to start the conversation</p>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-background border-t border-border shrink-0">
                                {isArchived ? (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center text-sm text-amber-500 font-medium shadow-sm flex items-center justify-center gap-2">
                                        🔒 This job chat is archived because the service booking has been completed.
                                    </div>
                                ) : (
                                    <div className="flex items-end gap-2 bg-muted/30 rounded-lg border border-border p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            onChange={handleFileUpload} 
                                        />
                                        <div className="flex items-center gap-1 pb-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                                onClick={() => fileInputRef.current?.click()}
                                                title="Attach Document"
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md hidden sm:flex"
                                                onClick={() => fileInputRef.current?.click()}
                                                title="Attach Image"
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent p-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                                            rows={1}
                                        />
                                        <div className="flex items-center gap-2 pb-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md hidden sm:flex"
                                                onClick={() => setNewMessage((prev) => prev + " 👍 ")}
                                                title="Add Emoji"
                                            >
                                                <Smile className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                onClick={handleSend} 
                                                disabled={!newMessage.trim()}
                                                className="h-8 w-8 p-0 rounded-md bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:hover:bg-primary shadow-sm transition-all"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center border border-border mb-4 shadow-sm">
                                <MessageCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-base font-medium text-foreground">Your Messages</h3>
                            <p className="text-sm mt-1">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CompanyMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
        }>
            <CompanyMessagesPageContent />
        </Suspense>
    );
}

