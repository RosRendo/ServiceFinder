"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Save, 
  Code, 
  Eye, 
  Send, 
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Mock templates
const TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Sent when a user signs up",
    subject: "Welcome to ServiceFinder, {{user_name}}!",
    body: "Hi {{user_name}},\n\nWelcome to ServiceFinder! We're thrilled to have you on board.\n\nBest,\nThe ServiceFinder Team",
    variables: ["user_name", "company_name", "login_url"],
    status: "active"
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "Sent when a user requests a password reset",
    subject: "Reset Your Password - ServiceFinder",
    body: "Hi {{user_name}},\n\nWe received a request to reset your password. Click the link below to choose a new one:\n\n{{reset_url}}\n\nIf you did not request this, please ignore this email.\n\nBest,\nThe ServiceFinder Team",
    variables: ["user_name", "reset_url", "expiry_time"],
    status: "active"
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation",
    description: "Sent to customers when a booking is confirmed",
    subject: "Booking Confirmed: {{service_name}}",
    body: "Hi {{customer_name}},\n\nYour booking for {{service_name}} on {{date}} at {{time}} has been confirmed.\n\nProvider: {{company_name}}\n\nThank you for using ServiceFinder!",
    variables: ["customer_name", "service_name", "date", "time", "company_name", "booking_id"],
    status: "active"
  },
  {
    id: "invoice_created",
    name: "Invoice Created",
    description: "Sent when a new invoice is generated",
    subject: "Invoice #{{invoice_id}} from {{company_name}}",
    body: "Hi {{customer_name}},\n\nA new invoice has been generated for your recent service. \n\nAmount Due: {{amount}}\nDue Date: {{due_date}}\n\nPlease find the invoice attached or click here to pay: {{payment_url}}",
    variables: ["customer_name", "company_name", "invoice_id", "amount", "due_date", "payment_url"],
    status: "inactive"
  }
];

export default function EmailManagementPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  // Derive current template
  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  const [formData, setFormData] = useState({
    subject: currentTemplate.subject,
    body: currentTemplate.body
  });

  // Reset form when template changes
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const template = TEMPLATES.find(t => t.id === id);
    if (template) {
      setFormData({
        subject: template.subject,
        body: template.body
      });
      setViewMode("edit");
    }
  };

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast.success("Template saved successfully");
    }, 800);
  };

  const handleTestEmail = () => {
    toast.success("Test email sent to your inbox");
  };

  const filteredTemplates = TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 lg:pb-0 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full mix-blend-multiply opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Mail className="h-8 w-8 text-indigo-600" />
                Email Templates
              </h1>
              <p className="text-gray-500 mt-2 text-sm font-medium">
                Manage and customize the automated emails sent by the platform.
              </p>
            </div>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-sm">
              Create Custom Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar - Template List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white shadow-sm"
              />
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-200 bg-white/40 font-bold text-gray-900 flex justify-between items-center">
                <span>System Templates</span>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 rounded-lg">{TEMPLATES.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${
                      selectedTemplateId === template.id 
                        ? "bg-indigo-50 border border-indigo-100 shadow-sm" 
                        : "hover:bg-white border border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold ${selectedTemplateId === template.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {template.name}
                      </span>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${template.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <p className={`text-xs font-medium line-clamp-1 ${selectedTemplateId === template.id ? 'text-indigo-600/70' : 'text-gray-500'}`}>
                      {template.description}
                    </p>
                  </button>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm font-medium">
                    No templates found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Editor */}
          <div className="lg:col-span-8">
            <motion.div 
              key={currentTemplate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]"
            >
              {/* Editor Header */}
              <div className="p-6 border-b border-gray-200 bg-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentTemplate.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500">ID: {currentTemplate.id}</span>
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider rounded-md ${currentTemplate.status === 'active' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 bg-gray-50'}`}>
                      {currentTemplate.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode("edit")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
                  >
                    <Code className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-6 flex flex-col gap-6">
                
                {viewMode === "edit" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 font-medium">Email Subject</Label>
                      <Input 
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="h-12 rounded-xl bg-white/50 border-slate-200 font-medium shadow-sm focus:bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-end">
                        <Label className="text-xs font-bold text-gray-500 font-medium">Email Body (Text/HTML)</Label>
                        <button className="text-xs font-bold text-indigo-600 hover:underline">Insert Variable</button>
                      </div>
                      <Textarea 
                        value={formData.body}
                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                        className="flex-1 min-h-[250px] rounded-xl bg-white/50 border-slate-200 font-mono text-sm shadow-sm focus:bg-white resize-none p-4"
                      />
                    </div>

                    {/* Variables Helper */}
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                      <p className="text-xs font-bold text-indigo-900 mb-2">Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentTemplate.variables.map(v => (
                          <span key={v} className="px-2 py-1 bg-white rounded-md text-xs font-mono text-indigo-600 border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="bg-slate-100 rounded-t-2xl p-4 border border-slate-200 border-b-0">
                      <p className="text-sm font-medium text-slate-600"><span className="font-bold text-gray-900">Subject:</span> {formData.subject}</p>
                    </div>
                    <div className="flex-1 bg-white rounded-b-2xl border border-slate-200 p-8 shadow-inner overflow-y-auto">
                      <div className="max-w-xl mx-auto font-sans text-slate-800 whitespace-pre-wrap">
                        {formData.body}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Editor Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center rounded-b-3xl">
                <Button variant="outline" onClick={handleTestEmail} className="rounded-xl border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-100 h-11 px-6 shadow-sm">
                  <Send className="w-4 h-4 mr-2" /> Send Test Email
                </Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-sm">
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
