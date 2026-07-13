"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatBubble from "@/components/messages/ChatBubble";
import ConversationItem from "@/components/messages/ConversationItem";
import { Button } from "@/components/ui/button";
import {
    Send, ArrowLeft, Phone, Video, MoreVertical, ImageIcon, Paperclip, Smile, MessageCircle, Search, Loader2
} from "lucide-react";
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
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const userData = data.data?.user || data.data || data;
                    setNewChatUser({
                        id: userData.id.toString(),
                        name: userData.fullName,
                        role: userData.role,
                        avatar: userData.avatar,
                    });
                } else {
                    toast.error("User not found");
                }
            } catch {
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
            const existing = conversations.find((c) => c.otherUser?.id === newParam);
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

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        if (!activeConversationId && !newChatUser) return;

        const recipientId = activeConversationId ? undefined : newChatUser?.id;
        const result = await sendMessage({
            content: newMessage,
            conversationId: activeConversationId || undefined,
            recipientId,
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
                    <h1 className="text-xl font-semibold text-gray-900">Platform Messages</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Communicate with users, providers, and handle platform-wide messaging.</p>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex min-h-[500px]">
                {/* Conversations List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-md pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {convsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : conversations.length > 0 ? (
                            <div className="divide-y divide-gray-100">
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
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 border border-gray-200">
                                    <MessageCircle className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="font-medium text-gray-900 text-sm">No conversations</p>
                                <p className="text-xs text-gray-500 mt-1">You haven't started any chats yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-white ${showMobileChat ? "flex" : "hidden md:flex"}`}>
                    {displayUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-white shrink-0">
                                <button onClick={() => setShowMobileChat(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>

                                <div className="relative">
                                    {displayUser.avatar ? (
                                        <img src={displayUser.avatar} alt={displayUser.name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-semibold border border-indigo-100 text-sm">
                                            {displayUser.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-gray-900 truncate text-sm">{displayUser.name}</h2>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{displayUser.role?.replace('_', ' ') || 'User'}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600"><Phone className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600"><Video className="h-4 w-4" /></Button>
                                    <div className="w-px h-5 bg-gray-200 mx-1"></div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            {/* Messages Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                {messages.map((msg, index) => (
                                    <ChatBubble
                                        key={msg.id || `msg-${index}`}
                                        message={msg}
                                        currentUserId={user ? String(user.id) : null}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 mb-2">
                                            <MessageCircle className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <p>Send a message to start the conversation</p>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                                <div className="flex items-end gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                                    <div className="flex items-center gap-1 pb-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md"><Paperclip className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md hidden sm:flex"><ImageIcon className="h-4 w-4" /></Button>
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
                                        className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent p-2 text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-2 pb-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md hidden sm:flex"><Smile className="h-4 w-4" /></Button>
                                        <Button 
                                            onClick={handleSend} 
                                            disabled={!newMessage.trim()}
                                            className="h-8 w-8 p-0 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-sm transition-all"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-gray-200 mb-4 shadow-sm">
                                <MessageCircle className="h-6 w-6 text-gray-300" />
                            </div>
                            <h3 className="text-base font-medium text-gray-900">Your Messages</h3>
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
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
            <AdminMessagesInner />
        </Suspense>
    );
}
