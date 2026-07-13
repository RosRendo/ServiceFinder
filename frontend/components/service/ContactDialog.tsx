import { useState } from "react";
import { Phone, Mail, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "staff";
  timestamp: Date;
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "call" | "message";
  company: {
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
  };
}

export function ContactDialog({ open, onOpenChange, type, company }: ContactDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hi! Thanks for contacting ${company.name}. How can we help you today?`,
      sender: "staff",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    // Simulate staff response
    setTimeout(() => {
      const staffResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! Our team will get back to you shortly. Is there anything specific you'd like to know about our service?",
        sender: "staff",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, staffResponse]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (type === "call") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Contact {company.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <Avatar className="h-20 w-20 mb-4">
              {company.logo && <AvatarImage src={company.logo} alt={company.name} />}
              <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg text-foreground mb-1">{company.name}</h3>
            {company.phone ? (
              <p className="text-muted-foreground mb-6">{company.phone}</p>
            ) : (
              <p className="text-muted-foreground mb-6">No phone number available</p>
            )}
            
            <div className="flex gap-3 w-full">
              {company.phone ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.location.href = `tel:${company.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button 
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      onOpenChange(false);
                      toast({
                        title: "Request Sent",
                        description: "We'll call you back shortly!",
                      });
                    }}
                  >
                    Request Callback
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0">
        {/* Header */}
        <div className="bg-primary p-4 text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
              {company.logo && <AvatarImage src={company.logo} alt={company.name} />}
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                {company.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{company.name}</h3>
              <p className="text-sm text-primary-foreground/80">Usually replies within minutes</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[300px] p-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-4 rounded-b-lg">
          {company.email ? (
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No email address available for this company
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}